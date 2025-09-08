// backend/services/arrangements.service.js
'use strict';

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

// -------------------- Status machine guards --------------------
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
  if (from === to) return;
  if (!Allowed[from]?.includes(to)) {
    throw new Error(`Transition ${from}→${to} not allowed`);
  }
}

// -------------------- Kategorije i tipovi ponuda --------------------
const CategoryMap = {
  TRANSPORT: ['BUS', 'AIRLINE'],
  ACCOMMODATION: ['HOTEL'],
  TOUR: ['TOUR', 'GUIDE', 'OTHER']
};
function categoryMatchesOfferType(category, offerType) {
  const arr = CategoryMap[category] || [];
  return arr.includes(offerType);
}
function offerTypeToCategory(offerType) {
  if (offerType === 'HOTEL') return 'ACCOMMODATION';
  if (offerType === 'BUS' || offerType === 'AIRLINE') return 'TRANSPORT';
  return 'TOUR';
}

// -------------------- Helperi za READY/DRAFT automatski --------------------
function requiredCatsFor(type) {
  return type === 'DAY_TRIP'
    ? ['TRANSPORT', 'TOUR']
    : ['TRANSPORT', 'ACCOMMODATION', 'TOUR'];
}

async function selectionsCoverRequired(arrangementId, type, tx) {
  const need = new Set(requiredCatsFor(type));
  const rows = await OfferSelection.findAll({
    where: { arrangementId },
    attributes: ['category'],
    transaction: tx
  });
  for (const r of rows) need.delete(r.category);
  return need.size === 0;
}

/**
 * Ako su sve kategorije pokrivene → READY.
 * Ako nisu, a status je bio READY → DRAFT.
 * Ako je CHANGES_REQUESTED i nije pokriveno sve → ostaje CHANGES_REQUESTED
 *   (po tvojoj tablici dozvoljeno je samo CHANGES_REQUESTED -> READY).
 */
async function maybeUpdateReady(a, tx) {
  const full = await selectionsCoverRequired(a.id, a.type, tx);

  if (full) {
    if (a.status !== 'READY') {
      // iz bilo kog dozvoljenog (DRAFT/QUOTING/CHANGES_REQUESTED) u READY
      if (['DRAFT', 'QUOTING', 'CHANGES_REQUESTED'].includes(a.status)) {
        assertTransition(a.status, 'READY');
        a.status = 'READY';
        await a.save({ transaction: tx });
      }
    }
  } else {
    if (a.status === 'READY') {
      // READY -> DRAFT
      assertTransition('READY', 'DRAFT');
      a.status = 'DRAFT';
      await a.save({ transaction: tx });
    }
    // CHANGES_REQUESTED ostavljamo takav dok ne bude full (tada gore dižemo u READY)
  }

  return a;
}

// -------------------- Permisije --------------------
function ensureOperatorOrAdminOnArrangement(user, arrangement) {
  if (user.role === 'ADMIN') return;
  if (user.role !== 'OPERATOR' || arrangement.createdByUsername !== user.username) {
    throw new Error('Forbidden');
  }
}

// -------------------- CRUD --------------------
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
    type: payload.type                            // DAY_TRIP | MULTI_DAY
    // status default: DRAFT
  });

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
    const sup = await Supplier.findOne({ where: { accountUsername: user.username } });
    if (!sup) return [];
    include.push({
      model: SupplierOffer,
      as: 'offers',
      where: { supplierId: sup.id },
      required: true
    });
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

    // ovde ne diramo status; status se rešava izborom/brisanje ponuda
    return a;
  });
}
async function deleteArrangement(user, id) {
  return await sequelize.transaction(async (tx) => {
    const a = await TravelArrangement.findByPk(id, { transaction: tx });
    if (!a) throw new Error('Not found');

    // ADMIN može sve; OPERATOR – samo svoje (bez obzira na status)
   // if (user.role !== 'ADMIN') {
     // ensureOperatorOrAdminOnArrangement(user, a); // baca 'Forbidden' ako nije vlasnik
    //}

    // Clean child data (kao i do sada)
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

// -------------------- Selekcija ponuda --------------------
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

    // Upsert selection
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

    // automatski podigni/spusti status po izboru
    await maybeUpdateReady(a, tx);

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

    // ako je bio READY i sad nema sve kategorije -> DRAFT
    await maybeUpdateReady(a, tx);

    return { ok: true };
  });
}

// -------------------- Povezivanje ponuda uz aranžman --------------------
/**
 * Poveži JEDNU ponudu uz aranžman (i opcionalno selektuj)
 * body: { offerId, inquiryId? }
 */
async function attachOfferToArrangement(user, arrangementId, body = {}) {
  const { offerId, inquiryId } = body;
  if (!offerId) throw new Error('offerId required');

  const a = await TravelArrangement.findByPk(arrangementId);
  if (!a) throw new Error('Arrangement not found');
  if (user.role !== 'ADMIN' && a.createdByUsername !== user.username) throw new Error('Forbidden');

  const so = await SupplierOffer.findByPk(offerId);
  if (!so) throw new Error('Offer not found');
  if (inquiryId && so.inquiryId !== Number(inquiryId)) {
    throw new Error('Offer does not belong to this inquiry');
  }

  so.arrangementId = a.id;
  await so.save();

  const category = offerTypeToCategory(so.offerType);
  await selectOffer(user, a.id, { offerId: so.id, category });

  return { ok: true, offerId: so.id, arrangementId: a.id, categorySelected: category };
}

/**
 * Poveži VIŠE ponuda odjednom
 * body: { offerIds: number[], inquiryId? }
 */
async function attachOffersToNewArrangement(user, arrangementId, body = {}) {
  return await sequelize.transaction(async (tx) => {
    const a = await TravelArrangement.findByPk(arrangementId, { transaction: tx });
    if (!a) throw new Error('Arrangement not found');
    ensureOperatorOrAdminOnArrangement(user, a);

    const { offerIds, inquiryId } = body;
    if (!Array.isArray(offerIds) || !offerIds.length) {
      return { attached: 0, selectionsCreated: 0 };
    }

    const offers = await SupplierOffer.findAll({
      where: { id: { [Op.in]: offerIds.map(Number) } },
      transaction: tx
    });
    if (!offers.length) return { attached: 0, selectionsCreated: 0 };

    await SupplierOffer.update(
      { arrangementId },
      { where: { id: { [Op.in]: offers.map(o => o.id) } }, transaction: tx }
    );

    const picks = {
      TRANSPORT: offers.find(o => ['BUS','AIRLINE'].includes(o.offerType))?.id || null,
      ACCOMMODATION: offers.find(o => o.offerType === 'HOTEL')?.id || null,
      TOUR: offers.find(o => ['GUIDE','TOUR','OTHER'].includes(o.offerType))?.id || null,
    };

    let selectionsCreated = 0;
    for (const [category, offerId] of Object.entries(picks)) {
      if (!offerId) continue;
      await OfferSelection.upsert(
        { arrangementId, category, offerId, selectedByUsername: user.username },
        { transaction: tx }
      );
      selectionsCreated++;
    }

    // posle batch-a takođe proveri READY/DRAFT
    await maybeUpdateReady(a, tx);

    if (inquiryId) {
      await ArrangementVersion.create({
        arrangementId,
        versionNo: (await ArrangementVersion.max('versionNo', { where:{ arrangementId }, transaction: tx }) || 0) + 1,
        changeNote: `Offers attached automatically for inquiry #${inquiryId}`
      }, { transaction: tx });
    }

    return { attached: offers.length, selectionsCreated };
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
  assertTransition,
  attachOffersToNewArrangement,
};
