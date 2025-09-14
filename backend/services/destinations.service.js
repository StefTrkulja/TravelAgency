// backend/services/destinations.service.js
'use strict';

const { Destination, Country, TravelArrangement, sequelize } = require('../models');
const { Op } = require('sequelize');


function pickAllowedPayload(payload, allowedKeys) {
  const out = {};
  for (const k of allowedKeys) {
    if (payload[k] !== undefined) out[k] = payload[k];
  }
  return out;
}

async function resolveCountryIdIfNeeded(payload) {
  if (!Destination.rawAttributes.countryId) return null;

  if (payload.countryId) return payload.countryId;

  if (payload.country && Country) {
    const [row] = await Country.findOrCreate({
      where: { name: payload.country },
      defaults: { name: payload.country }
    });
    return row.id;
  }

  return null;
}


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


async function update(id, payload) {
  return await sequelize.transaction(async (tx) => {
    const dest = await Destination.findByPk(id, { transaction: tx });
    if (!dest) throw new Error('Destination not found');

    const attrs = Destination.rawAttributes;
    const data = pickAllowedPayload(payload, Object.keys(attrs));

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
