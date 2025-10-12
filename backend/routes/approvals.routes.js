// backend/routes/approvals.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtParser');
const approvalSvc = require('../services/approvalService.services'); // ispravljeno ime
const { ApprovalRequest, TravelArrangement } = require('../models');
// OPERATOR šalje na odobrenje (READY -PENDING)
router.post('/send', verifyToken('OPERATOR', 'ADMIN'), async (req, res) => {
  try {
    const out = await approvalSvc.sendForApproval(req.user, req.body); // { arrangementId }
    res.status(201).json(out);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// MANAGER : APPROVE / REJECT / CHANGES_REQUESTED
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




// GET /api/approvals/pending-count
router.get('/pending-count', verifyToken('ADMIN', 'MANAGER', 'OPERATOR'), async (req, res) => {
  try {
    const { scope } = req.query;

    // ❗ koristimo decision, ne status
    const where = { decision: 'PENDING' };

    // samo “moji” za operatora
    if (scope === 'mine' && req.user?.role === 'OPERATOR') {
      const count = await ApprovalRequest.count({
        where,
        include: [{
          model: TravelArrangement,
          as: 'arrangement',
          required: true,
          where: { createdByUsername: req.user.username }
        }]
      });
      return res.json({ success: true, count });
    }

    // svi pending
    const count = await ApprovalRequest.count({ where });
    res.json({ success: true, count });
  } catch (e) {
    console.error('[APPROVALS:pending-count] error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
