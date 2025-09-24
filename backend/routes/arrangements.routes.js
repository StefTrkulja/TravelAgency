// backend/routes/arrangements.routes.js
'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtParser');
const svc = require('../services/arrangements.service');

const {
  TravelArrangement,
  Destination,
  OfferSelection,
  SupplierOffer
} = require('../models');

// ------------------ CRUD preko servisa (ostavljam kako je bilo)
router.post('/', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const a = await svc.createArrangement(req.user, req.body);
    res.status(201).json(a);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/', verifyToken('OPERATOR', 'SUPPLIER', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const list = await svc.listArrangements(req.user, req.query);
    res.json(list);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/:id', verifyToken('OPERATOR', 'ADMIN','MANAGER'), async (req, res) => {
  try {
    const a = await svc.updateArrangement(req.user, +req.params.id, req.body);
    res.json(a);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', verifyToken('ADMIN', 'OPERATOR', 'MANAGER'), async (req, res) => {
  try {
    await svc.deleteArrangement(req.user, +req.params.id);
    res.status(204).end();
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ------------------ GET detalj: vrati destinaciju + selections + kompletne ponude
router.get('/:id', verifyToken('OPERATOR', 'SUPPLIER', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const a = await TravelArrangement.findByPk(id, {
      include: [
        { model: Destination, as: 'destination' },
        { model: OfferSelection, as: 'selections', include: [{ model: SupplierOffer, as: 'offer' }] }
      ]
    });
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json(a);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ------------------ Select / Unselect (ostavljam tvoj unselect preko servisa)
router.post('/:id/select-offer', verifyToken('OPERATOR', 'ADMIN','MANAGER'), async (req, res) => {
  try {
    const arrangementId = Number(req.params.id);
    const { category, offerId } = req.body || {};
    if (!category || !offerId) throw new Error('category and offerId required');

    const a = await TravelArrangement.findByPk(arrangementId);
    if (!a) throw new Error('Arrangement not found');

    // upsert izbor
    await OfferSelection.upsert({ arrangementId, category, offerId });

    // ako su sve obavezne kategorije pokrivene -> READY
    const required = a.type === 'DAY_TRIP'
      ? ['TRANSPORT', 'TOUR']
      : ['TRANSPORT', 'ACCOMMODATION', 'TOUR'];

    const all = await OfferSelection.findAll({ where: { arrangementId } });
    const complete = required.every(c => all.find(s => s.category === c));

    if (complete && (a.status === 'DRAFT' || a.status === 'CHANGES_REQUESTED')) {
      a.status = 'READY';
      await a.save();
    }

    res.json({ ok: true, status: a.status });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/unselect-offer', verifyToken('OPERATOR', 'ADMIN','MANAGER'), async (req, res) => {
  try {
    const out = await svc.unselectOffer(req.user, +req.params.id, req.body);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Batch attach (ostavljam preko servisa)
router.post('/:arrangementId/attach-offers', verifyToken('OPERATOR','ADMIN'), async (req,res)=>{
  try {
    const out = await svc.attachOffersToNewArrangement(
      req.user,
      Number(req.params.arrangementId),
      req.body   // { offerIds: number[], inquiryId?: number }
    );
    res.json(out);
  } catch(e){ res.status(400).json({ error: e.message }); }
});

module.exports = router;
