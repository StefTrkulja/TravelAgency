
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../utils/jwtParser');
const svc = require('../services/vouchers.service');

const auth = verifyToken();

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized access' });
  if (roles.length && !roles.includes(req.user.role)) {
    console.log(roles);
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};



// ✅ CREATE (ADMIN)
router.post('/', auth, allowRoles('ADMIN'), async (req, res) => {
  try {
    const v = await svc.createVoucher(req.user, req.body);
    res.status(201).json(v);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ✅ LIST (CUSTOMER, OPERATOR, MANAGER, ADMIN)
router.get('/', auth, allowRoles('TRAVELER', 'OPERATOR', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const list = await svc.listVouchers(req.user, req.query);
    res.json(list);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ✅ LOOKUP (CUSTOMER, OPERATOR, MANAGER, ADMIN)
router.get('/lookup', auth, allowRoles('TRAVELER', 'OPERATOR', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const data = await (svc.lookupVouchers
      ? svc.lookupVouchers(req.user, req.query)
      : svc.listVouchers(req.user, { ...req.query, limit: 50 }).then(rows =>
          rows.map(v => ({ id: v.id, code: v.code }))
        ));
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ✅ GET BY ID (CUSTOMER, OPERATOR, MANAGER, ADMIN)
router.get('/:id', auth, allowRoles('TRAVELER', 'OPERATOR', 'MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const v = await svc.getVoucher(req.user, +req.params.id, { include: req.query.include });
    if (!v) return res.status(404).json({ error: 'Not found' });
    res.json(v);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ✅ UPDATE (ADMIN)
router.put('/:id', auth, allowRoles('ADMIN'), async (req, res) => {
  try {
    const updated = await svc.updateVoucher(req.user, +req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ✅ DELETE (ADMIN)
router.delete('/:id', auth, allowRoles('ADMIN'), async (req, res) => {
  try {
    await svc.deleteVoucher(req.user, +req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;