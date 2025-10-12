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

// auth & role guard
const auth = verifyToken();
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized access' });
  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

// --- AUX: ping da potvrdiš da je router baš ovaj
router.get('/__ping', (_req, res) => res.json({ ok: true, where: 'arrangements router' }));

// --- LIST
router.get('/',
  auth, allowRoles('OPERATOR','SUPPLIER','MANAGER','ADMIN','TRAVELER'),
  async (req, res) => {
    try {
      const list = await svc.getAllArrangements(req.query);
      res.json(list);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
);

// --- CREATE
router.post('/',
  auth, allowRoles('OPERATOR','ADMIN','TRAVELER'),
  async (req, res) => {
    try {
      const a = await svc.createArrangement(req.user, req.body);
      res.status(201).json(a);
    } catch (e) {
      console.error('[ARR CREATE] error:', e);
      res.status(400).json({ error: e.message });
    }
  }
);

// --- EXTRAS (MORA biti prije generičnog "/:id")
router.get('/:id/extras',
  auth, allowRoles('TRAVELER','OPERATOR','SUPPLIER','MANAGER','ADMIN'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const rows = await svc.listExtrasForArrangement(id);
      res.json(rows); // [] ako nema
    } catch (e) {
      console.error('[GET /arrangements/:id/extras] error:', e);
      res.status(400).json({ error: e.message });
    }
  }
);

// --- DETAIL
router.get('/:id',
  auth, allowRoles('MANAGER','ADMIN','OPERATOR','SUPPLIER','TRAVELER'),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'Invalid id' });

      const a = await svc.getArrangement(req.user, id);
      if (!a) return res.status(404).json({ error: 'Not found' });
      res.json(a);
    } catch (e) {
      console.error('[GET /arrangements/:id] error:', e?.message || e);
      const msg = e?.message || 'Error';
      if (msg === 'Forbidden') return res.status(403).json({ error: msg });
      return res.status(400).json({ error: msg });
    }
  }
);

// --- UPDATE / DELETE
router.put('/:id',
  auth, allowRoles('OPERATOR','ADMIN','MANAGER','TRAVELER'),
  async (req, res) => {
    try {
      const a = await svc.updateArrangement(req.user, +req.params.id, req.body);
      res.json(a);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
);

router.delete('/:id',
  auth, allowRoles('ADMIN','OPERATOR','MANAGER','TRAVELER'),
  async (req, res) => {
    try {
      await svc.deleteArrangement(req.user, +req.params.id);
      res.status(204).end();
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
);

// --- SELECT / UNSELECT
router.post('/:id/select-offer',
  auth, allowRoles('OPERATOR','ADMIN','MANAGER','TRAVELER'),
  async (req, res) => {
    try {
      const out = await svc.selectOffer(req.user, +req.params.id, req.body);
      res.json(out);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
);

router.post('/:id/unselect-offer',
  auth, allowRoles('OPERATOR','ADMIN','MANAGER','TRAVELER'),
  async (req, res) => {
    try {
      const out = await svc.unselectOffer(req.user, +req.params.id, req.body);
      res.json(out);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
);

// --- BATCH ATTACH
router.post('/:arrangementId/attach-offers',
  auth, allowRoles('OPERATOR','ADMIN','TRAVELER'),
  async (req, res) => {
    try {
      const out = await svc.attachOffersToNewArrangement(
        req.user, Number(req.params.arrangementId), req.body
      );
      res.json(out);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }
);

module.exports = router;
