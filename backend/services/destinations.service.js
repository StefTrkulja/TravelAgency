// backend/services/destinations.service.js
'use strict';

const { Destination, Country, TravelArrangement, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- helpers ---
function pickAllowedPayload(payload, allowedKeys) {
  const out = {};
  for (const k of allowedKeys) if (payload[k] !== undefined) out[k] = payload[k];
  return out;
}
function toInt(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pokušaj da iz payload-a izvučeš countryId na jedan od načina:
 *  - payload.countryId (number ili string)
 *  - payload.countryId ugniježđen (npr. payload.country?.id)
 *  - payload.country kao string naziva države -> findOrCreate
 */
async function resolveCountryId(payload, tx) {
  // 1) direktan countryId (preferirano)
  const id1 = toInt(payload?.countryId);
  if (id1) return id1;

  // 2) ugniježđeno: { country: { id: 3, name: '...' } }
  const id2 = toInt(payload?.country?.id);
  if (id2) return id2;

  // 3) country kao ime (string) -> findOrCreate
  const countryName = (typeof payload?.country === 'string') ? payload.country.trim() : '';
  if (countryName) {
    const [row] = await Country.findOrCreate({
      where: { name: countryName },
      defaults: { name: countryName },
      transaction: tx
    });
    return row.id;
  }

  // ništa od navedenog
  return null;
}

// ----------------- CREATE -----------------
async function create(payload) {
  if (!payload?.name) throw new Error('name is required');

  const attrs = Destination.rawAttributes;

  return await sequelize.transaction(async (tx) => {
    // izbaci samo dozvoljena polja iz payload-a
    const data = pickAllowedPayload(payload, Object.keys(attrs));

    // obavezno (ako kolona postoji na modelu) pribavi countryId
    if (attrs.countryId) {
      const cid = await resolveCountryId(payload, tx);
      if (!cid && attrs.countryId.allowNull === false) {
        // umjesto da DB baci notNull Violation, vrati jasnu poruku
        throw new Error('countryId is required (send countryId or country name)');
      }
      if (cid) data.countryId = cid;
    }

    // ako model ima createdAt/updatedAt ili druga polja, Sequelize će ih sam popuniti

    const dest = await Destination.create(data, { transaction: tx });
    return dest;
  });
}

// ----------------- LIST -----------------
async function list(query = {}) {
  const where = {};
  if (query.q && Destination.rawAttributes.name) {
    where.name = { [Op.iLike]: `%${query.q}%` };
  }
  if (query.countryId && Destination.rawAttributes.countryId) {
    const cid = toInt(query.countryId);
    if (cid) where.countryId = cid;
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

// ----------------- UPDATE -----------------
async function update(id, payload) {
  return await sequelize.transaction(async (tx) => {
    const dest = await Destination.findByPk(id, { transaction: tx });
    if (!dest) throw new Error('Destination not found');

    const attrs = Destination.rawAttributes;
    const data = pickAllowedPayload(payload, Object.keys(attrs));

    if (attrs.countryId) {
      // dozvoli promjenu države preko countryId ili country name
      let cid = toInt(payload?.countryId);
      if (!cid && payload?.country) {
        // ako je prosleđen naziv države
        const name = typeof payload.country === 'string' ? payload.country.trim() : '';
        if (name) {
          const [row] = await Country.findOrCreate({
            where: { name },
            defaults: { name },
            transaction: tx
          });
          cid = row.id;
        } else {
          // ugniježđeno country.id
          cid = toInt(payload.country?.id);
        }
      }
      if (cid) data.countryId = cid;
    }

    Object.assign(dest, data);
    await dest.save({ transaction: tx });
    return dest;
  });
}

// ----------------- DELETE -----------------
async function remove(id) {
  return await sequelize.transaction(async (tx) => {
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
