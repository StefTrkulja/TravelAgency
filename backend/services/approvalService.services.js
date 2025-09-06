const { Result, StatusEnum } = require('../utils/result');
const { ApprovalRequest, TravelArrangement } = require('../models');

class ApprovalService {
  async sendForApproval(operatorUsername, { arrangementId }) {
    const a = await TravelArrangement.findByPk(arrangementId);
    if (!a) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Arrangement not found' }]);

    a.status = 'PENDING';
    await a.save();

    const req = await ApprovalRequest.create({
      arrangementId, requestedByUsername: operatorUsername, decision: 'PENDING'
    });
    return new Result(StatusEnum.OK, 201, req);
  }

  async decide(managerUsername, { approvalRequestId, decision, comment }) {
    const ar = await ApprovalRequest.findByPk(approvalRequestId);
    if (!ar) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Approval request not found' }]);

    ar.decision = decision; // APPROVED | REJECTED
    ar.approvedByUsername = managerUsername;
    ar.decidedAt = new Date();
    ar.comment = comment ?? null;
    await ar.save();

    const a = await TravelArrangement.findByPk(ar.arrangementId);
    a.status = (decision === 'APPROVED') ? 'ACTIVE' : 'DRAFT';
    await a.save();

    return new Result(StatusEnum.OK, 200, ar);
  }
}
module.exports = new ApprovalService();
