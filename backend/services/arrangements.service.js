// backend/services/arrangements.service.js
const {
  sequelize,
  TravelArrangement,
  Destination,
  OfferSelection,
  SupplierOffer,
  Supplier,
  SupplierOfferOption,
  SupplierOfferItineraryItem,
  ArrangementVersion,
  ApprovalRequest,
  Departure,
  Itinerary,
  ItineraryActivity,
  User
} = require('../models');

const { Op } = require('sequelize');

// Status machine guards
const Allowed = {
  DRAFT: ['QUOTING', 'READY'],
  QUOTING: ['READY'],
  READY: ['PENDING', 'DRAFT'],
  PENDING: ['ACTIVE', 'CHANGES_REQUESTED'],
  CHANGES_REQUESTED: ['READY'],
  ACTIVE: ['INACTIVE'],
  INACTIVE: []
};
function assertTransition(from, to) {
  if (!Allowed[from]?.includes(to)) {
    throw new Error(`Transition ${from}→${to} not allowed`);
  }
}

// Category ↔ OfferType map (aligned to your enums)
const CategoryMap = {
  TRANSPORT: ['BUS', 'AIRLINE'],
  ACCOMMODATION: ['HOTEL'], // dodaj APT/HOSTEL ako uvedeš u OfferType
  TOUR: ['TOUR', 'GUIDE']
};
function categoryMatchesOfferType(category, offerType) {
  const arr = CategoryMap[category] || [];
  return arr.includes(offerType);
}

function ensureOperatorOrAdminOnArrangement(user, arrangement) {
  if (user.role === 'ADMIN') return;
  if (user.role !== 'OPERATOR' || arrangement.createdByUsername !== user.username) {
    throw new Error('Forbidden');
  }
}

async function createArrangement(user, payload) {
  if (!['OPERATOR', 'ADMIN'].includes(user.role)) throw new Error('Forbidden');

  const required = ['destinationId', 'title', 'basePricePerPerson', 'transportType', 'accommodationType', 'type'];
  required.forEach(k => { if (payload[k] === undefined || payload[k] === null || payload[k] === '') throw new Error(`Missing ${k}`); });

  const dest = await Destination.findByPk(payload.destinationId);
  if (!dest) throw new Error('Destination not found');

  const a = await TravelArrangement.create({
    destinationId: payload.destinationId,
    createdByUsername: user.username,
    title: payload.title,
    summary: payload.summary || null,
    basePricePerPerson: payload.basePricePerPerson,
    transportType: payload.transportType,        // BUS | PLANE | OWN
    accommodationType: payload.accommodationType,// HOTEL | APT | HOSTEL | OTHER
    type: payload.type,                          // DAY_TRIP | MULTI_DAY
    // status default: DRAFT
  });

  // Optionally create initial version
  await ArrangementVersion.create({
    arrangementId: a.id,
    versionNo: 1,
    changeNote: 'Initial creation'
  });

  return a;
}

async function listArrangements(user, query = {}) {
  const where = {};
  const include = [{ model: Destination, as: 'destination' }];

  if (user.role === 'OPERATOR') {
    where.createdByUsername = user.username;
  } else if (user.role === 'SUPPLIER') {
    // Supplier vidi aranžmane za koje postoji bar jedan SupplierOffer prema njemu
    const sup = await Supplier.findOne({ where: { accountUsername: user.username } });
    if (!sup) return [];
    include.push({
      model: SupplierOffer,
      as: 'offers',
      where: { supplierId: sup.id },
      required: true
    });
  } else {
    // MANAGER/ADMIN – bez posebnog filtera
  }

  return await TravelArrangement.findAll({ where, include, order: [['createdAt', 'DESC']] });
}

async function getArrangement(user, id) {
  const a = await TravelArrangement.findByPk(id, {
    include: [
      { model: Destination, as: 'destination' },
      {
        model: OfferSelection,
        as: 'selections',
        include: [{ model: SupplierOffer, as: 'offer' }]
      },
      {
        model: Departure,
        as: 'departures',
        include: [{ model: Itinerary, as: 'Itineraries', include: [{ model: ItineraryActivity, as: 'ItineraryActivities' }] }]
      },
      { model: ArrangementVersion, as: 'versions' },
      { model: ApprovalRequest, as: 'approvals' }
    ]
  });
  if (!a) return null;

  if (user.role === 'OPERATOR' && a.createdByUsername !== user.username) throw new Error('Forbidden');
  if (user.role === 'SUPPLIER') {
    const sup = await Supplier.findOne({ where: { accountUsername: user.username } });
    if (!sup) throw new Error('Forbidden');
    const count = await SupplierOffer.count({ where: { arrangementId: a.id, supplierId: sup.id } });
    if (!count) throw new Error('Forbidden');
  }
  return a;
}

async function updateArrangement(user, id, payload) {
  return await sequelize.transaction(async (tx) => {
    const a = await TravelArrangement.findByPk(id, { transaction: tx });
    if (!a) throw new Error('Not found');

    ensureOperatorOrAdminOnArrangement(user, a);

    if (!['DRAFT', 'READY', 'CHANGES_REQUESTED'].includes(a.status)) {
      throw new Error(`Cannot edit arrangement in status ${a.status}`);
    }

    const fields = ['title', 'summary', 'basePricePerPerson', 'transportType', 'accommodationType', 'type'];
    fields.forEach(f => { if (payload[f] !== undefined) a[f] = payload[f]; });
    await a.save({ transaction: tx });

    const lastVersion = await ArrangementVersion.max('versionNo', { where: { arrangementId: a.id }, transaction: tx }) || 1;
    await ArrangementVersion.create({
      arrangementId: a.id,
      versionNo: Number(lastVersion) + 1,
      changeNote: payload._changeNote || 'Update'
    }, { transaction: tx });

    return a;
  });
}

async function deleteArrangement(user, id) {
  return await sequelize.transaction(async (tx) => {
    const a = await TravelArrangement.findByPk(id, { transaction: tx });
    if (!a) throw new Error('Not found');

    if (user.role !== 'ADMIN') {
      ensureOperatorOrAdminOnArrangement(user, a);
      if (a.status !== 'DRAFT') throw new Error('Only DRAFT can be deleted by operator');
    }

    // Clean child data
    await OfferSelection.destroy({ where: { arrangementId: id }, transaction: tx });

    const offers = await SupplierOffer.findAll({ where: { arrangementId: id }, transaction: tx });
    const offerIds = offers.map(o => o.id);
    if (offerIds.length) {
      await SupplierOfferOption.destroy({ where: { offerId: { [Op.in]: offerIds } }, transaction: tx });
      await SupplierOfferItineraryItem.destroy({ where: { offerId: { [Op.in]: offerIds } }, transaction: tx });
      await SupplierOffer.destroy({ where: { id: { [Op.in]: offerIds } }, transaction: tx });
    }

    await Departure.destroy({ where: { arrangementId: id }, transaction: tx });
    await ArrangementVersion.destroy({ where: { arrangementId: id }, transaction: tx });
    await ApprovalRequest.destroy({ where: { arrangementId: id }, transaction: tx });

    await a.destroy({ transaction: tx });
    return { ok: true };
  });
}

/**
 * Select a supplier offer for a given category.
 * body: { offerId, category: 'TRANSPORT'|'ACCOMMODATION'|'TOUR' }
 */
async function selectOffer(user, arrangementId, body) {
  return await sequelize.transaction(async (tx) => {
    const a = await TravelArrangement.findByPk(arrangementId, { transaction: tx });
    if (!a) throw new Error('Arrangement not found');
    ensureOperatorOrAdminOnArrangement(user, a);

    if (!['DRAFT', 'QUOTING', 'READY', 'CHANGES_REQUESTED'].includes(a.status)) {
      throw new Error(`Cannot select offers in status ${a.status}`);
    }

    const { offerId, category } = body || {};
    if (!offerId || !category) throw new Error('offerId and category are required');

    const offer = await SupplierOffer.findByPk(offerId, { transaction: tx });
    if (!offer || offer.arrangementId !== a.id) throw new Error('Offer not found for this arrangement');

    if (!categoryMatchesOfferType(category, offer.offerType)) {
      throw new Error(`Offer type ${offer.offerType} cannot be used for category ${category}`);
    }

    // Upsert selection (unique (arrangementId, category))
    const existing = await OfferSelection.findOne({ where: { arrangementId, category }, transaction: tx });
    if (existing) {
      existing.offerId = offerId;
      existing.selectedByUsername = user.username;
      existing.selectedAt = new Date();
      await existing.save({ transaction: tx });
    } else {
      await OfferSelection.create({
        arrangementId,
        offerId,
        category,
        selectedByUsername: user.username
      }, { transaction: tx });
    }

    // Move to READY if required categories are all chosen
    const requiredCats = a.type === 'DAY_TRIP' ? ['TRANSPORT', 'TOUR'] : ['TRANSPORT', 'ACCOMMODATION', 'TOUR'];
    const count = await OfferSelection.count({
      where: { arrangementId, category: { [Op.in]: requiredCats } },
      transaction: tx
    });
    if (count === requiredCats.length && a.status !== 'READY') {
      if (['DRAFT', 'QUOTING', 'CHANGES_REQUESTED'].includes(a.status)) {
        assertTransition(a.status, 'READY');
        a.status = 'READY';
        await a.save({ transaction: tx });
      }
    }

    return { ok: true };
  });
}

/**
 * Unselect (remove) the selection for a given category.
 * body: { category }
 */
async function unselectOffer(user, arrangementId, body) {
  return await sequelize.transaction(async (tx) => {
    const a = await TravelArrangement.findByPk(arrangementId, { transaction: tx });
    if (!a) throw new Error('Arrangement not found');
    ensureOperatorOrAdminOnArrangement(user, a);

    const { category } = body || {};
    if (!category) throw new Error('category is required');

    await OfferSelection.destroy({ where: { arrangementId, category }, transaction: tx });

    return { ok: true };
  });
}

module.exports = {
  createArrangement,
  listArrangements,
  getArrangement,
  updateArrangement,
  deleteArrangement,
  selectOffer,
  unselectOffer,
  assertTransition
};
