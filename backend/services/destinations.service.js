// backend/services/destinations.service.js
'use strict';

const { Destination, Country, TravelArrangement, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Helper: detektuj koje kolone postoje u modelu i napravi bezbedan payload
 */
function pickAllowedPayload(payload, allowedKeys) {
  const out = {};
  for (const k of allowedKeys) {
    if (payload[k] !== undefined) out[k] = payload[k];
  }
  return out;
}

async function resolveCountryIdIfNeeded(payload) {
  // Ako model Destination uopšte NEMA countryId kolonu – preskoči
  if (!Destination.rawAttributes.countryId) return null;

  // Ako korisnik pošalje direktno countryId – koristi to
  if (payload.countryId) return payload.countryId;

  // Ako pošalje string `country`, a postoji model Country – probaj da ga pronađeš/kreiraš
  if (payload.country && Country) {
    const [row] = await Country.findOrCreate({
      where: { name: payload.country },
      defaults: { name: payload.country }
    });
    return row.id;
  }

  return null;
}

/**
 * CREATE
 * Očekuje makar `name`.
 * Opcionalno:
 *  - countryId ili country (string) -> ako tabela ima foreign key na Country
 *  - createdByUsername (ako kolona postoji i ako je obavezna)
 */
async function create(payload) {
  const attrs = Destination.rawAttributes;

  if (!payload.name) throw new Error('name is required');

  const data = pickAllowedPayload(payload, Object.keys(attrs));

  // Country veza (ako postoji countryId)
  const countryId = await resolveCountryIdIfNeeded(payload);
  if (countryId && attrs.countryId) data.countryId = countryId;

  // Ako postoji createdByUsername i nije prosleđen, probaj iz payload-a (ili odbij)
  if (attrs.createdByUsername && !data.createdByUsername) {
    // ako je kolona obavezna (allowNull === false), bolje jasno poruči
    const required = attrs.createdByUsername.allowNull === false;
    if (required) throw new Error('createdByUsername is required by Destination model');
  }

  const dest = await Destination.create(data);
  return dest;
}

/**
 * LIST
 * Podržava jednostavne filtere: q (pretraga po nazivu), countryId
 */
async function list(query = {}) {
  const where = {};
  if (query.q && Destination.rawAttributes.name) {
    where.name = { [Op.iLike]: `%${query.q}%` };
  }
  if (query.countryId && Destination.rawAttributes.countryId) {
    where.countryId = query.countryId;
  }

  const include = [];
  if (Country && Destination.associations?.country) {
    include.push({ model: Country, as: 'country' });
  }

  const rows = await Destination.findAll({
    where,
    include,
    order: [['name', 'ASC']]
  });
  return rows;
}

/**
 * UPDATE
 * Ažuriraj samo postojeće kolone u modelu.
 * Podržava promenu countryId preko country string-a.
 */
async function update(id, payload) {
  return await sequelize.transaction(async (tx) => {
    const dest = await Destination.findByPk(id, { transaction: tx });
    if (!dest) throw new Error('Destination not found');

    const attrs = Destination.rawAttributes;
    const data = pickAllowedPayload(payload, Object.keys(attrs));

    // Rešavanje countryId ako je poslat country string
    if (attrs.countryId) {
      if (!data.countryId && payload.country) {
        const [row] = await Country.findOrCreate({
          where: { name: payload.country },
          defaults: { name: payload.country },
          transaction: tx
        });
        data.countryId = row.id;
      }
    }

    Object.assign(dest, data);
    await dest.save({ transaction: tx });
    return dest;
  });
}

/**
 * DELETE
 * Ako postoje aranžmani koji referenciraju destinaciju – DB FK može da odbije.
 * U tom slučaju vrati smislen error.
 */
async function remove(id) {
  return await sequelize.transaction(async (tx) => {
    // Opcionalno: zabrani brisanje ako postoje aranžmani
    if (TravelArrangement && TravelArrangement.rawAttributes.destinationId) {
      const count = await TravelArrangement.count({ where: { destinationId: id }, transaction: tx });
      if (count > 0) {
        throw new Error('Cannot delete: destination is used by one or more travel arrangements');
      }
    }
    const rows = await Destination.destroy({ where: { id }, transaction: tx });
    if (!rows) throw new Error('Destination not found');
    return { deleted: id };
  });
}

module.exports = { create, list, update, remove };
