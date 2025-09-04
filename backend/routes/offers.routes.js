const express = require('express');
const router = express.Router();
const offerSvc = require('../services/offer.service');
const { StatusEnum } = require('../utils/result');

// operator šalje upite
router.post('/inquiries', async (req, res) => {
  const r = await offerSvc.sendInquiries(req.body, req.user?.username || req.body.operatorUsername);
  res.status(r.code).json(r.status === StatusEnum.FAIL ? {errors:r.errors} : r.data);
});

// supplier šalje konkretnu ponudu (sa opcijama/itinerarom)
router.post('/submit', async (req, res) => {
  const r = await offerSvc.supplierSubmitOffer(req.user?.username || req.body.supplierUsername, req.body);
  res.status(r.code).json(r.status === StatusEnum.FAIL ? {errors:r.errors} : r.data);
});

// operator bira ponudu
router.post('/select', async (req, res) => {
  const r = await offerSvc.selectOffer(req.user?.username || req.body.operatorUsername, req.body);
  res.status(r.code).json(r.status === StatusEnum.FAIL ? {errors:r.errors} : r.data);
});

// pregled svih ponuda za aranžman
router.get('/arrangement/:arrangementId', async (req, res) => {
  const r = await offerSvc.listOffersByArrangement(req.params.arrangementId);
  res.status(r.code).json(r.status === StatusEnum.FAIL ? {errors:r.errors} : r.data);
});

module.exports = router;
