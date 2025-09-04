const express = require('express');
const router = express.Router();
const approvalSvc = require('../services/approval.service');
const { ApprovalRequest } = require('../models');
const { StatusEnum } = require('../utils/result');
const { verifyToken } = require('../utils/jwtParser');

// Operator šalje aranžman na odobrenje
router.post('/send', verifyToken("OPERATOR"), async (req, res) => {
  const r = await approvalSvc.sendForApproval(
    req.user.username,   // username dobijen iz tokena
    req.body             // sadrži arrangementId
  );

  res.status(r.code).json(
    r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data
  );
});

// Menadžer odlučuje (APPROVED / REJECTED)
router.post('/decide', verifyToken("MANAGER"), async (req, res) => {
  const r = await approvalSvc.decide(
    req.user.username,   // managerUsername iz tokena
    req.body             // { approvalRequestId, decision, comment }
  );

  res.status(r.code).json(
    r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data
  );
});

// Lista svih approval requestova
router.get('/', verifyToken("MANAGER"), async (req, res) => {
  const requests = await ApprovalRequest.findAll({
    order: [['createdAt', 'DESC']]
  });
  res.json(requests);
});

module.exports = router;
