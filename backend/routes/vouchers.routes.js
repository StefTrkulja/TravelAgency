
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../utils/jwtParser');
const svc = require('../services/vouchers.service');


router.post(
  '/',
  verifyToken('ADMIN'),
  async (req, res) => {
    try {
      // body: { code, discountType, discountValue, validFrom?, validTo?, userUsername?, reservationId? }
      const v = await svc.createVoucher(req.user, req.body);
      res.status(201).json(v);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);



 
router.get(
  '/',
  verifyToken(['CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN']),
  async (req, res) => {
    try {
      const list = await svc.listVouchers(req.user, req.query);
      res.json(list);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

router.get(
  '/lookup',
  verifyToken(['CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN']),
  async (req, res) => {
    try {
      // Vrati { id, code } za brze dropdown-e; CUSTOMER samo svoje
      const data = await svc.lookupVouchers(req.user, req.query);
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

router.get(
  '/:id',
  verifyToken(['CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN']),
  async (req, res) => {
    try {
      const v = await svc.getVoucher(req.user, +req.params.id, { include: req.query.include });
      if (!v) return res.status(404).json({ error: 'Not found' });
      res.json(v);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

router.put(
  '/:id',
  verifyToken('ADMIN'),
  async (req, res) => {
    try {
      const updated = await svc.updateVoucher(req.user, +req.params.id, req.body);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

router.delete(
  '/:id',
  verifyToken('ADMIN'),
  async (req, res) => {
    try {
      await svc.deleteVoucher(req.user, +req.params.id);
      res.status(204).end();
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);



module.exports = router;
