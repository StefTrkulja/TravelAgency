// backend/routes/arrangements.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtParser');
const svc = require('../services/arrangements.service');

// Create arrangement (OPERATOR)
router.post('/', verifyToken('OPERATOR', 'SUPPLIER'), async (req, res) => {
  try {
    const a = await svc.createArrangement(req.user, req.body);
    res.status(201).json(a);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Get all (visibility by role)
router.get('/', verifyToken('OPERATOR', 'SUPPLIER', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const list = await svc.listArrangements(req.user, req.query);
    res.json(list);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Get one
router.get('/:id', verifyToken('OPERATOR', 'SUPPLIER', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const a = await svc.getArrangement(req.user, +req.params.id);
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json(a);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Update (OPERATOR) – verzionisanje unutar servisa
router.put('/:id', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const a = await svc.updateArrangement(req.user, +req.params.id, req.body);
    res.json(a);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Delete (ADMIN only or OPERATOR own DRAFT)
router.delete('/:id', verifyToken('ADMIN', 'OPERATOR'), async (req, res) => {
  try {
    await svc.deleteArrangement(req.user, +req.params.id);
    res.status(204).end();
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Select offer for category (OPERATOR)
router.post('/:id/select-offer', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const out = await svc.selectOffer(req.user, +req.params.id, req.body);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Unselect (optional)
router.post('/:id/unselect-offer', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const out = await svc.unselectOffer(req.user, +req.params.id, req.body);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
