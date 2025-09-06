// backend/routes/offers.routes.js
'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtParser');
const offerSvc = require('../services/offerService.service');

// OPERATOR šalje upite dobavljačima (minimalni payload)
router.post('/inquiries', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.sendInquiries(req.user, req.body);
    res.status(201).json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

//  OPERATOR – lista svojih upita 
router.get('/inquiries', verifyToken('OPERATOR','ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.listInquiries(req.user, req.query);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

//  OPERATOR – sve ponude pristigle na jedan upit
router.get('/inquiries/:inquiryId/offers', verifyToken('OPERATOR','ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.listOffersForInquiry(req.user, +req.params.inquiryId);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
// SUPPLIER submit ponude na osnovu upita
router.post('/submit', verifyToken('SUPPLIER', 'ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.supplierSubmitOffer(req.user, req.body);
    res.status(201).json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// SUPPLIER inbox (upiti + njegove ponude)
router.get('/my', verifyToken('SUPPLIER', 'ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.listMyOffersAndInquiries(req.user, req.query);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// (opciono) OPERATOR/ADMIN – ponude vezane za aranžman (ako ih ima)
router.get('/for-arrangement/:arrangementId', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const out = await offerSvc.listOffersForArrangement(req.user, +req.params.arrangementId);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
