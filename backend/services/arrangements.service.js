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

// ---------- Helpers (koercija i fallbackovi) ----------
function toDecimal(v, fallback = 0) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(v, fallback = 0) {
  if (v === '' || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isInteger(n) ? n : Math.round(Number(n) || fallback);
}


function pickEnum(v, allowed = [], fallback) {
  const s = v != null ? String(v) : '';
  return allowed.includes(s) ? s : fallback;
}

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

function toLocalDayStart(val) {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  // lokalna ponoć (ne UTC) – izbjegava “oduzima dan”
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function toLocalDayEnd(val) {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
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
 */
async function maybeUpdateReady(a, tx) {
  const full = await selectionsCoverRequired(a.id, a.type, tx);

  if (full) {
    if (a.status !== 'READY') {
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
  }

  return a;
}

function ensureOperatorOrAdminOnArrangement(user, arrangement) {
  if (user.role === 'ADMIN') return;
  if (user.role !== 'OPERATOR' || arrangement.createdByUsername !== user.username) {
    throw new Error('Forbidden');
  }
}

// ---------- CREATE (liberalno, bez Missing-validacija, sa defaultovima) ----------
async function createArrangement(user, payload) {
  // Ako želiš tvrdu kontrolu uloge, odkomentariši naredni red:
  // if (!['ADMIN','OPERATOR'].includes(user.role)) throw new Error('Forbidden');

  // destinationId: ako ne dođe, pokušaj uzeti neku destinaciju ili fallback na 1
  let destinationId = Number(payload?.destinationId);
  if (!Number.isFinite(destinationId)) {
    const anyDest = await Destination.findOne({ attributes: ['id'] });
    destinationId = anyDest?.id ?? 1;
  }

  const title   = (payload?.title ?? 'Novi aranžman').toString();
  const summary = payload?.summary ?? null;

  const basePricePerPerson = toDecimal(payload?.basePricePerPerson, 0);

  const transportType = pickEnum(payload?.transportType, ['BUS','PLANE','OWN'], 'OWN');
  const accommodationType = pickEnum(payload?.accommodationType, ['HOTEL','APT','HOSTEL','OTHER'], 'OTHER');
  const type = pickEnum(payload?.type, ['DAY_TRIP','MULTI_DAY'], 'MULTI_DAY');

  // Datumi: ako ne dođu, stavi danas i +1 dan
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24*60*60*1000);
  const dateFrom = payload?.dateFrom ? new Date(payload.dateFrom) : now;
  const dateTo   = payload?.dateTo   ? new Date(payload.dateTo)   : tomorrow;

  // kidsDicount – prihvati oba naziva i uvijek pošalji broj (0 default)
  const kidsDiscountRaw = payload?.kidsDiscount ?? payload?.kidsDicount ?? payload?.kids_discount;

  const kidsDiscount = toDecimal(kidsDiscountRaw, 0);
  // DEBUG
  console.log('[ARR CREATE] payload:', {
    destinationId, title, basePricePerPerson, transportType, accommodationType, type,
    dateFrom, dateTo,
    kidsDiscount_in: payload?.kidsDiscount,
    computed_kidsDiscount: kidsDiscount
  });
  const occupancy = toInt(payload?.occupancy, 1);

  const a = await TravelArrangement.create({
    destinationId,
    createdByUsername: user?.username ?? 'system',
    title,
    summary,
    basePricePerPerson,
    transportType,
    accommodationType,
    type,
    dateFrom,
    dateTo,
    kidsDiscount,
    occupancy
  });

  await ArrangementVersion.create({
    arrangementId: a.id,
    versionNo: 1,
    changeNote: 'Initial creation'
  });

  return a;
}

async function  getAllArrangements(query = {}) {
  // Destrukturiranje i normalizacija ulaza
  const {
    destinationId,
    countryId,
    transportType,
    accommodationType,
    type,
    dateFrom,
    dateTo,
    priceFrom: priceFromRaw,
    priceTo:   priceToRaw,
    priceMax:  priceMaxRaw,
    sortBy,
    sortDir,
    travelers      
  } = query;

   // ✅ ako dođe priceMax, tretiraj ga kao priceTo
  const priceFrom = priceFromRaw;
  const priceTo   = (priceToRaw ?? priceMaxRaw);

  // ✅ parsiranje cijena u brojeve
  const priceFromNum = (priceFrom !== undefined && priceFrom !== null) ? Number(priceFrom) : null;
  const priceToNum   = (priceTo   !== undefined && priceTo   !== null) ? Number(priceTo)   : null;


  const dateFromVal = toLocalDayStart(dateFrom);
  const dateToVal   = toLocalDayEnd(dateTo);
  // WHERE za glavnu tabelu
  const whereClause = {};

  if (transportType)     whereClause.transportType     = transportType;
  if (accommodationType) whereClause.accommodationType = accommodationType;
  if (type)              whereClause.type              = type;


  const minPeople = Number(travelers);
  if (Number.isFinite(minPeople) && minPeople > 0) {
    whereClause.occupancy = { [Op.gte]: minPeople };
  }

  // Opseg datuma: polje u bazi je dateFrom, treba da bude u [dateFromVal, dateToVal]
  if (dateFromVal || dateToVal) {
    whereClause[Op.and] = whereClause[Op.and] || [];
    if (dateToVal)   whereClause[Op.and].push({ dateFrom: { [Op.lte]: dateToVal } });
    if (dateFromVal) whereClause[Op.and].push({ dateTo:   { [Op.gte]: dateFromVal } });
  }

  // Opseg cijene: basePricePerPerson ∈ [priceFromNum, priceToNum]
  if (Number.isFinite(priceFromNum) || Number.isFinite(priceToNum)) {
    whereClause.basePricePerPerson = {};
    if (Number.isFinite(priceFromNum)) whereClause.basePricePerPerson[Op.gte] = priceFromNum;
    if (Number.isFinite(priceToNum))   whereClause.basePricePerPerson[Op.lte] = priceToNum;
  }

  // INCLUDE za destination (+ country) sa opcionalnim filterima i INNER JOIN-om kada filtriraš
  const destinationInclude = {
    association: 'destination',
    attributes: ['id', 'name'],
    required: !!destinationId || !!countryId, // INNER JOIN ako filtriramo
    ...(destinationId ? { where: { id: destinationId } } : {}),
    include: [
      {
        association: 'country',
        attributes: ['id', 'name'],
        required: !!countryId, // INNER JOIN ako filtriramo po country
        ...(countryId ? { where: { id: countryId } } : {}),
      },
    ],
  };
  // SORT mapa i default
  const sortMap = {
    createdAt: ['createdAt'],
    dateFrom:  ['dateFrom'],
    price:     ['basePricePerPerson']
  };
  const sortKey = sortMap[sortBy] ? sortBy : 'createdAt';
  const direction = (String(sortDir || 'DESC').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
  const order = [[sortMap[sortKey][0], direction]];

  try {
    const arrangements = await TravelArrangement.findAll({
      where: whereClause,
      include: [destinationInclude],
      order,
    });

    return { success: true, data: arrangements };
  } catch (error) {
    return { success: false, error: error.message };
  }
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
        include: [
          {
            model: Itinerary,
            as: 'itinerary',       // ← matchuje Departure.hasMany(Itinerary, as: 'itineraries')
            include: [
              {
                model: ItineraryActivity,
                as: 'activities'     // ← matchuje Itinerary.hasMany(ItineraryActivity, as: 'activities')
              }
            ]
          }
        ]
      },
      { model: ArrangementVersion, as: 'versions' },
      { model: ApprovalRequest, as: 'approvals' }
    ]
  });

  if (!a) return null;
  return a;
}

async function updateArrangement(user, id, payload) {
  return await sequelize.transaction(async (tx) => {
    const a = await TravelArrangement.findByPk(id, { transaction: tx });
    if (!a) throw new Error('Not found');

    // Ako želiš dozvoliti edit bez obzira na status, komentariši sljedeći blok:
    if (!['DRAFT', 'READY', 'CHANGES_REQUESTED'].includes(a.status)) {
      throw new Error(`Cannot edit arrangement in status ${a.status}`);
    }

    ensureOperatorOrAdminOnArrangement(user, a);

    // koercija i fallbackovi
    const numeric = ['basePricePerPerson', 'occupancy'];
    const textual = ['title', 'summary', 'transportType', 'accommodationType', 'type'];

    textual.forEach(f => {
      if (payload[f] !== undefined && payload[f] !== null) a[f] = String(payload[f]);
    });
    numeric.forEach(f => {
      if (payload[f] !== undefined && payload[f] !== null) a[f] = toDecimal(payload[f], a[f] ?? 0);
    });

    if (payload.dateFrom !== undefined) a.dateFrom = payload.dateFrom ? new Date(payload.dateFrom) : a.dateFrom;
    if (payload.dateTo   !== undefined) a.dateTo   = payload.dateTo   ? new Date(payload.dateTo)   : a.dateTo;

    // kidsDicount pod dva naziva
    if (payload.kidsDiscount !== undefined || payload.kidsDicount !== undefined) {
      a.kidsDiscount = toDecimal(payload.kidsDiscount ?? payload.kidsDicount, a.kidsDiscount ?? 0);
    }

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

    // ADMIN može sve; OPERATOR – samo svoje (bez obzira na status)
    // if (user.role !== 'ADMIN') {
    //   ensureOperatorOrAdminOnArrangement(user, a);
    // }

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

    await maybeUpdateReady(a, tx);

    return { ok: true };
  });
}

async function unselectOffer(user, arrangementId, body) {
  return await sequelize.transaction(async (tx) => {
    const a = await TravelArrangement.findByPk(arrangementId, { transaction: tx });
    if (!a) throw new Error('Arrangement not found');
    ensureOperatorOrAdminOnArrangement(user, a);

    const { category } = body || {};
    if (!category) throw new Error('category is required');

    await OfferSelection.destroy({ where: { arrangementId, category }, transaction: tx });

    await maybeUpdateReady(a, tx);

    return { ok: true };
  });
}

// -------------------- Povezivanje ponuda uz aranžman --------------------
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



// --- EXTRAS (itinerary activities sa dodatnim troškovima) ---
async function listExtrasForArrangement(arrangementId) {
  const deps = await Departure.findAll({
    where: { arrangementId },
    attributes: ['id'],
  });
  const depIds = deps.map(d => d.id);
  if (!depIds.length) return [];

  const its = await Itinerary.findAll({
    where: { departureId: { [Op.in]: depIds } },
    attributes: ['id'],
  });
  const itIds = its.map(i => i.id);
  if (!itIds.length) return [];

  const acts = await ItineraryActivity.findAll({
    where: {
      itineraryId: { [Op.in]: itIds },
      extraCost: { [Op.gt]: 0 }      // tvoje polje
    },
    attributes: ['id', 'activityTitle', 'activityDescription', 'extraCost'],
    order: [['id','ASC']],
  });

  return acts.map(a => ({
    id: a.id,
    title: a.activityTitle || 'Dodatna usluga',
    description: a.activityDescription || '',
    extraCost: Number(a.extraCost || 0),
    // Pretpostavka: cijena je per-person; ako ikad dodaš "perBooking", lako ćemo proširiti.
    perPerson: true
  }));
}




module.exports = {
  createArrangement,
  getAllArrangements,
  getArrangement,
  updateArrangement,
  deleteArrangement,
  selectOffer,
  unselectOffer,
  assertTransition,
  attachOffersToNewArrangement,
  listExtrasForArrangement
};
