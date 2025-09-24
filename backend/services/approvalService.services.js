// backend/services/approvalService.services.js
const {
  sequelize,
  TravelArrangement,
  ApprovalRequest,
  OfferSelection,
  SupplierOffer
} = require('../models');
const { assertTransition } = require('./arrangements.service');
const { Op } = require('sequelize');

/**
 * OPERATOR sends arrangement for approval (READY -> PENDING)
 * body: { arrangementId, comment? }
 */
async function sendForApproval(user, body) {
  return await sequelize.transaction(async (tx) => {
    if (!['OPERATOR', 'ADMIN'].includes(user.role)) throw new Error('Forbidden');

    const { arrangementId, comment } = body || {};
    if (!arrangementId) throw new Error('arrangementId required');

    const a = await TravelArrangement.findByPk(arrangementId, { transaction: tx });
    if (!a) throw new Error('Arrangement not found');
    if (user.role !== 'ADMIN' && a.createdByUsername !== user.username) throw new Error('Forbidden');

    if (a.status !== 'READY') throw new Error('Arrangement must be in READY to send');

    assertTransition('READY', 'PENDING');
    a.status = 'PENDING';
    await a.save({ transaction: tx });

    // Snapshot (basic + chosen offers)
    const selections = await OfferSelection.findAll({ where: { arrangementId }, transaction: tx, include: [{ model: SupplierOffer, as: 'offer' }] });
    const snapshot = {
      arrangement: {
        title: a.title,
        summary: a.summary,
        basePricePerPerson: a.basePricePerPerson,
        transportType: a.transportType,
        accommodationType: a.accommodationType,
        type: a.type
      },
      selections: selections.map(s => ({
        category: s.category,
        offerId: s.offerId,
        offerType: s.offer?.offerType || null,
        priceTotal: s.offer?.priceTotal || null
      }))
    };

    const ar = await ApprovalRequest.create({
      arrangementId: a.id,
      requestedByUsername: user.username,
      decision: 'PENDING',
      comment: comment || null,
      requestedSnapshot: snapshot
    }, { transaction: tx });

    return { ok: true, approvalRequestId: ar.id };
  });
}

/**
 * MANAGER decides on approval: APPROVED | REJECTED | CHANGES_REQUESTED
 * body: { approvalRequestId, decision, comment? }
 */
async function decide(user, body) {
  return await sequelize.transaction(async (tx) => {
    if (!['MANAGER', 'ADMIN'].includes(user.role)) throw new Error('Forbidden');

    const { approvalRequestId, decision, comment } = body || {};
    if (!approvalRequestId) throw new Error('approvalRequestId required');
    if (!['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(decision)) throw new Error('Invalid decision');

    const ar = await ApprovalRequest.findByPk(approvalRequestId, { transaction: tx });
    if (!ar) throw new Error('ApprovalRequest not found');

    const a = await TravelArrangement.findByPk(ar.arrangementId, { transaction: tx });
    if (!a) throw new Error('Arrangement not found');

    if (ar.decision !== 'PENDING' || a.status !== 'PENDING') throw new Error('Not pending');

    ar.decision = decision;
    ar.comment = comment || null;
    ar.approvedByUsername = user.username;
    ar.decidedAt = new Date();
    await ar.save({ transaction: tx });

    if (decision === 'APPROVED') {
      assertTransition('PENDING', 'ACTIVE');
      a.status = 'ACTIVE';
    } else {
      // For both REJECTED and CHANGES_REQUESTED → push back to CHANGES_REQUESTED
      assertTransition('PENDING', 'CHANGES_REQUESTED');
      a.status = 'CHANGES_REQUESTED';
    }
    await a.save({ transaction: tx });

    return { ok: true };
  });
}

/**
 * List approval requests (MANAGER sees all; OPERATOR sees only his)
 */
async function list(user, query = {}) {
  const where = {};
  const include = [];

  if (user.role === 'OPERATOR') {
    // filter by arrangements owned by operator
    include.push({
      model: TravelArrangement,
      as: 'arrangement',
      where: { createdByUsername: user.username },
      required: true
    });
  } else if (user.role === 'MANAGER' || user.role === 'ADMIN') {
    // no special filter
    include.push({ model: TravelArrangement, as: 'arrangement', required: false });
  } else {
    throw new Error('Forbidden');
  }

  const rows = await ApprovalRequest.findAll({
    where,
    include,
    order: [['createdAt', 'DESC']]
  });
  return rows;
}

module.exports = { sendForApproval, decide, list };
