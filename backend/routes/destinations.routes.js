// backend/routes/destinations.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtParser');
const svc = require('../services/destinations.service');

const auth = verifyToken(); // samo validira token i puni req.user

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized access' });
  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// prvo autentikacija za sve rute u ovom routeru
router.use(auth);

// CREATE
router.post('/', allowRoles('ADMIN'), async (req, res) => {
  try { res.status(201).json(await svc.create(req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// LIST (ako želiš da OPERATOR vidi spisak, dodaj i njega)
router.get('/', allowRoles('ADMIN', 'OPERATOR','TRAVELER'), async (req, res) => {
  try { res.json(await svc.list(req.query)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// >>> UPDATE — OVO TI JE TRAŽENO <<<
router.put('/:id', allowRoles('OPERATOR', 'ADMIN','TRAVELER'), async (req, res) => {
  try { res.json(await svc.update(+req.params.id, req.body)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE
router.delete('/:id', allowRoles('ADMIN'), async (req, res) => {
  try { await svc.remove(+req.params.id); res.status(204).end(); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
