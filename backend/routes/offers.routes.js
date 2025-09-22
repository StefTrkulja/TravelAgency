// backend/routes/offers.routes.js
'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtParser');
const offerSvc = require('../services/offerService.service');
const { Op } = require('sequelize');
// NA VRHU FAJLA dodaj import Supplier:
const { Supplier, SupplierOffer, OfferInquiry } = require('../models');

// ------------------------------
// OPERATOR šalje upite dobavljačima (ostaje preko servisa)
router.post('/inquiries', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.sendInquiries(req.user, req.body);
    res.status(201).json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// OPERATOR – lista svojih upita (ostaje preko servisa)
router.get('/inquiries', verifyToken('OPERATOR','ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.listInquiries(req.user, req.query);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// OPERATOR – sve ponude pristigle na jedan upit (ostaje preko servisa)
router.get('/inquiries/:inquiryId/offers', verifyToken('OPERATOR','ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.listOffersForInquiry(req.user, +req.params.inquiryId);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// SUPPLIER submit ponude — postavi supplierId iz prijavljenog korisnika
router.post('/submit', verifyToken('SUPPLIER', 'ADMIN'), async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.inquiryId) throw new Error('inquiryId required');
    if (!body.offerType) throw new Error('offerType required');

    // 1) pronadji upit da izvučeš arrangementId
    const inquiry = await OfferInquiry.findByPk(Number(body.inquiryId));
    if (!inquiry) throw new Error('Inquiry not found');

    // 2) odredi supplierId iz tokena ili baze
    //    - ako tvoj jwt sadrži supplierId: req.user.supplierId
    //    - fallback: pronalazak Supplier reda koji pripada ovom useru
    let supplierId = req.user.supplierId || null;
    if (!supplierId) {
      // prilagodi polje u where-u ako se drugačije zove (npr. ownerUsername/userUsername)
      const sup = await Supplier.findOne({ where: { accountUsername: req.user.username } });
      if (!sup) throw new Error('Supplier profile not found for this user');
      supplierId = sup.id;
    }

    // 3) tip-specifična validacija (isti uslovi kao malopre)
    const t = body.offerType;
    if (t === 'HOTEL') {
      if (!body.hotelName) throw new Error('hotelName required for HOTEL');
      if (!body.board) throw new Error('board required for HOTEL');
    } else if (t === 'AIRLINE' || t === 'BUS') {
      if (!body.transportCompany) throw new Error('transportCompany required for transport');
      if (!body.fromLocation) throw new Error('fromLocation required for transport');
      if (!body.toLocation) throw new Error('toLocation required for transport');
      body.transportMode = t === 'AIRLINE' ? 'PLANE' : 'BUS';
    } else {
      if (!body.title && !body.guideName) {
        throw new Error('title or guideName required for GUIDE/TOUR/OTHER');
      }
    }

    // 4) defaulti + normalizacija
    body.currency = body.currency || 'EUR';
    body.priceTotal = Number(body.priceTotal || 0);
    body.capacityTotal = Number(body.capacityTotal || 0);
    body.status = 'RECEIVED';

    // *uvek* setuj iz backenda:
    body.supplierId = supplierId;
    body.arrangementId = inquiry.arrangementId || null;
    body.inquiryId = inquiry.id;

    // (opciono) pretvori datume ako ih šalješ kao string
    if (body.availabilityStart) body.availabilityStart = new Date(body.availabilityStart);
    if (body.availabilityEnd) body.availabilityEnd = new Date(body.availabilityEnd);

    const saved = await SupplierOffer.create(body);
    res.status(201).json(saved);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


// SUPPLIER inbox (ostaje preko servisa)
router.get('/my', verifyToken('SUPPLIER', 'ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.listMyOffersAndInquiries(req.user, req.query);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// OPERATOR/ADMIN – sve ponude za aranžman
router.get('/for-arrangement/:arrangementId', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
   try {
     const includeInquiryOffers = (req.query.scope === 'all'); // ?scope=all -> i ponude iz upita
     const rows = await offerSvc.listOffersForArrangement(
       req.user,
       Number(req.params.arrangementId),
       { includeInquiryOffers }
     );
     res.json(rows);
   } catch (e) {
     res.status(400).json({ error: e.message });
   }
 });
module.exports = router;
