'use strict';

const { Op, fn, col } = require('sequelize');
const {
  sequelize,
  Supplier,
  Destination,
  TravelArrangement,
  OfferInquiry,
  OfferInquiryRecipient,
  SupplierOffer,
} = require('../models');

/**
 * OPERATOR kreira upit (destinacija + okvirni datumi (+ opcionalno notes, supplierIds))
 * body: { destinationId, dateFrom (YYYY-MM-DD), dateTo (YYYY-MM-DD), notes?, supplierIds?: number[] }
 */
async function sendInquiries(user, body = {}) {
  if (!user || !['OPERATOR', 'ADMIN'].includes(user.role)) throw new Error('Forbidden');

  const { destinationId, dateFrom, dateTo, notes, supplierIds } = body;

  if (!destinationId) throw new Error('destinationId is required');
  if (!dateFrom || !dateTo) throw new Error('dateFrom/dateTo are required');

  const dest = await Destination.findByPk(destinationId);
  if (!dest) throw new Error('Destination not found');

  return await sequelize.transaction(async (tx) => {
    // 1) kreiraj upit
    const inquiry = await OfferInquiry.create(
      {
        destinationId,
        requestedByUsername: user.username,
        dateFrom,            // DATEONLY string je OK
        dateTo,              // DATEONLY string je OK
        notes: notes || null,
      },
      { transaction: tx }
    );

    // 2) odredi primaoce
    let suppliers = [];
    if (Array.isArray(supplierIds) && supplierIds.length) {
      suppliers = await Supplier.findAll({
        where: { id: { [Op.in]: supplierIds.map(Number) } },
        transaction: tx,
      });
    } else {
      suppliers = await Supplier.findAll({ transaction: tx }); // šaljemo svima
    }
    if (!suppliers.length) throw new Error('No suppliers to notify');

    // 3) bulk recipients
    const rows = suppliers.map((s) => ({
      inquiryId: inquiry.id,
      supplierId: s.id,
      status: 'SENT',
      deliveredAt: new Date(),
    }));
    await OfferInquiryRecipient.bulkCreate(rows, { transaction: tx });

    return { inquiryId: inquiry.id, recipients: suppliers.length };
  });
}

/**
 * SUPPLIER vidi svoje upite + svoje ponude
 */
async function listMyOffersAndInquiries(user, query = {}) {
  if (!user || !['SUPPLIER', 'ADMIN'].includes(user.role)) throw new Error('Forbidden');

  const supplier = await Supplier.findOne({ where: { accountUsername: user.username } });
  if (!supplier) throw new Error('Supplier account not found');

  const recs = await OfferInquiryRecipient.findAll({
    where: { supplierId: supplier.id },
    include: [
      {
        model: OfferInquiry,
        as: 'inquiry',
        include: [{ model: Destination, as: 'destination' }],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const offers = await SupplierOffer.findAll({
    where: { supplierId: supplier.id },
    order: [['createdAt', 'DESC']],
  });

  return {
    inquiries: recs.map((r) => ({
      id: r.inquiry.id,
      destinationId: r.inquiry.destinationId,
      destination: r.inquiry.destination?.name || null,
      dateFrom: r.inquiry.dateFrom,
      dateTo: r.inquiry.dateTo,
      notes: r.inquiry.notes,
      status: r.status,
    })),
    offers,
  };
}

/**
 * SUPPLIER šalje ponudu kao odgovor na upit
 * body: { inquiryId, offerType, title?, terms?, currency?, priceTotal?, capacityTotal?,
 *         availabilityStart?, availabilityEnd?, ... (polja po tipu) }
 */
async function supplierSubmitOffer(user, body = {}) {
  if (!user || !['SUPPLIER', 'ADMIN'].includes(user.role)) throw new Error('Forbidden');

  const { inquiryId, offerType } = body;
  if (!inquiryId) throw new Error('inquiryId is required');
  if (!offerType) throw new Error('offerType is required');

  const supplier = await Supplier.findOne({ where: { accountUsername: user.username } });
  if (!supplier) throw new Error('Supplier account not found');

  const inquiry = await OfferInquiry.findByPk(inquiryId);
  if (!inquiry) throw new Error('Inquiry not found');

  const payload = {
    inquiryId,
    supplierId: supplier.id,
    offerType,
    title: body.title || null,
    terms: body.terms || null,
    currency: body.currency || 'EUR',
    priceTotal: body.priceTotal ?? 0,
    capacityTotal: body.capacityTotal ?? 0,
    availabilityStart: body.availabilityStart || inquiry.dateFrom,
    availabilityEnd: body.availabilityEnd || inquiry.dateTo,

    // HOTEL
    hotelName: body.hotelName ?? null,
    hotelStars: body.hotelStars ?? null,
    board: body.board ?? null,

    // TRANSPORT
    transportCompany: body.transportCompany ?? null,
    transportMode: body.transportMode ?? null,
    fromLocation: body.fromLocation ?? null,
    toLocation: body.toLocation ?? null,

    // GUIDE/TOUR
    guideName: body.guideName ?? null,
    guideLanguage: body.guideLanguage ?? null,
    durationHours: body.durationHours ?? null,

    meta: body.meta || null,

    status: 'RECEIVED',
    receivedAt: new Date(),
  };

  return await sequelize.transaction(async (tx) => {
    const offer = await SupplierOffer.create(payload, { transaction: tx });

    // status recipient-a → RESPONDED
    await OfferInquiryRecipient.update(
      { status: 'RESPONDED', respondedAt: new Date() },
      { where: { inquiryId, supplierId: supplier.id }, transaction: tx }
    );

    return offer;
  });
}

/**
 * Kompatibilno: OPERATOR/ADMIN – sve ponude za konkretan aranžman (ako taj koncept i dalje postoji)
 */
// Vraća ponude VEĆ VEZANE uz aranžman + (opciono) i ponude pristigle na upite za taj aranžman.


async function listOffersForArrangement(user, arrangementId, { includeInquiryOffers = false } = {}) {
  // 0) provjera aranžmana
  const a = await TravelArrangement.findByPk(arrangementId);
  if (!a) throw new Error('Arrangement not found');

  // 1) dozvole
  if (user.role !== 'ADMIN' && user.role !== 'OPERATOR') {
    throw new Error('Forbidden');
  }
  if (user.role === 'OPERATOR' && a.createdByUsername !== user.username) {
    throw new Error('Forbidden');
  }

  // 2) već ATTACH-ovane na aranžman
  const attached = await SupplierOffer.findAll({
    where: { arrangementId },
    include: [{ model: OfferInquiry, as: 'inquiry' }],
    order: [['createdAt', 'DESC']]
  });

  if (!includeInquiryOffers) return attached;

  // 3) Ponude iz POVEZANIH upita po heuristici:
  //    - isti destination kao aranžman
  //    - period upita se preklapa sa periodom aranžmana
  const inquiries = await OfferInquiry.findAll({
    where: {
      destinationId: a.destinationId,
      // overlap: (inq.dateFrom <= a.dateTo) AND (inq.dateTo >= a.dateFrom)
      dateFrom: { [Op.lte]: a.dateTo },
      dateTo:   { [Op.gte]: a.dateFrom }
    },
    attributes: ['id']
  });
  const inquiryIds = inquiries.map(i => i.id);

  let fromInquiries = [];
  if (inquiryIds.length) {
    fromInquiries = await SupplierOffer.findAll({
      where: {
        arrangementId: null,
        inquiryId: { [Op.in]: inquiryIds }
      },
      include: [{ model: OfferInquiry, as: 'inquiry' }],
      order: [['createdAt', 'DESC']]
    });
  }

  // 4) merge bez duplikata
  const map = new Map();
  [...attached, ...fromInquiries].forEach(o => map.set(o.id, o));
  return Array.from(map.values());
}



/**
 * OPERATOR/ADMIN – lista upita (za OPERATORA samo njegovi)
 * Vraća: [{ id, destinationId, destination: {id, name}, dateFrom, dateTo, notes, offerCount }]
 */
async function listInquiries(user, query = {}) {
  if (!['OPERATOR', 'ADMIN'].includes(user.role)) throw new Error('Forbidden');

  // 1) upiti (za operatora samo njegovi)
  const where = {};
  if (user.role === 'OPERATOR') where.requestedByUsername = user.username;

  const inquiries = await OfferInquiry.findAll({
    where,
    include: [{ model: Destination, as: 'destination' }],
    order: [['createdAt', 'DESC']],
  });
  if (!inquiries.length) return [];

  // 2) prebroj ponude po inquiryId
  const counts = await SupplierOffer.findAll({
    attributes: ['inquiryId', [fn('COUNT', col('*')), 'cnt']],
    where: { inquiryId: inquiries.map((i) => i.id) },
    group: ['inquiryId'],
    raw: true,
  });
  const countMap = Object.fromEntries(counts.map((r) => [r.inquiryId, Number(r.cnt)]));

  // 3) format za tabelu
  return inquiries.map((i) => ({
    id: i.id,
    destinationId: i.destinationId,
    destination: i.destination ? { id: i.destination.id, name: i.destination.name } : null,
    dateFrom: i.dateFrom,
    dateTo: i.dateTo,
    notes: i.notes || null,
    offerCount: countMap[i.id] || 0,
  }));
}
/*
 * OPERATOR/ADMIN – sve ponude za jedan upit (inquiryId)
 * - OPERATOR sme samo svoje upite (provera requestedByUsername)
 * - vraća niz SupplierOffer zapisa (uz osnovne podatke o supplier-u)
 */
async function listOffersForInquiry(user, inquiryId) {
  if (!['OPERATOR', 'ADMIN'].includes(user.role)) throw new Error('Forbidden');
  if (!inquiryId) throw new Error('inquiryId is required');

  const inquiry = await OfferInquiry.findByPk(inquiryId, {
    include: [{ model: Destination, as: 'destination' }]
  });
  if (!inquiry) throw new Error('Inquiry not found');

  if (user.role === 'OPERATOR' && inquiry.requestedByUsername !== user.username) {
    throw new Error('Forbidden');
  }

  const rows = await SupplierOffer.findAll({
    where: { inquiryId: Number(inquiryId) },
    include: [{ model: Supplier, as: 'supplier', attributes: ['id','companyName','accountUsername'] }],
    order: [['createdAt', 'DESC']]
  });

  // Mapiraj u čist, front-friendly format
  return rows.map(r => ({
    id: r.id,
    inquiryId: r.inquiryId,
    offerType: r.offerType,              // 'HOTEL' | 'BUS' | 'AIRLINE' | 'GUIDE' | 'OTHER'
    title: r.title,
    terms: r.terms,
    currency: r.currency,
    priceTotal: Number(r.priceTotal || 0),
    capacityTotal: r.capacityTotal,
    availabilityStart: r.availabilityStart,
    availabilityEnd: r.availabilityEnd,

    // HOTEL
    hotelName: r.hotelName,
    hotelStars: r.hotelStars,
    board: r.board,

    // TRANSPORT
    transportCompany: r.transportCompany,
    transportMode: r.transportMode,
    fromLocation: r.fromLocation,
    toLocation: r.toLocation,

    // TOUR/GUIDE
    guideName: r.guideName,
    guideLanguage: r.guideLanguage,
    durationHours: r.durationHours,

    supplier: r.supplier ? {
      id: r.supplier.id,
      name: r.supplier.companyName,
      username: r.supplier.accountUsername
    } : null
  }));
}

module.exports = {
  sendInquiries,
  listMyOffersAndInquiries,
  supplierSubmitOffer,
  listOffersForArrangement,
  listInquiries,
  listOffersForInquiry
};
