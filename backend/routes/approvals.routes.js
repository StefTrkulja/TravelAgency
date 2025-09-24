// backend/routes/approvals.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtParser');
const approvalSvc = require('../services/approvalService.services'); // ispravljeno ime

// OPERATOR šalje na odobrenje (READY → PENDING)
router.post('/send', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const out = await approvalSvc.sendForApproval(req.user, req.body); // { arrangementId }
    res.status(201).json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// MANAGER odlučuje: APPROVE / REJECT / CHANGES_REQUESTED
router.post('/decide', verifyToken('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const out = await approvalSvc.decide(req.user, req.body); // { approvalRequestId, decision, comment }
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// MANAGER/OPERATOR – list pregleda
router.get('/', verifyToken('MANAGER', 'OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const out = await approvalSvc.list(req.user, req.query);
    res.json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
