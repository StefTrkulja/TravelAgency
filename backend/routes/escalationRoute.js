const { Result, StatusEnum } = require('../utils/result');
const jwtParser = require('../utils/jwtParser');
const express = require('express');
const router = express.Router();
const ComplaintService = require('../services/complaintService');
const EscalationService = require('../services/escalationService');



router.get('/manager-escalations', jwtParser.extractTokenUser, async (req, res) => {
	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	if (req.user.role !== 'manager') {
		return res.status(403).json({ message: 'Forbidden' });
	}
	const result = await EscalationService.getAllEscalations();
	if (result.status === StatusEnum.SUCCESS) {
		return res.status(result.code).json(result.data);
	}
	return res.status(result.code).json(result);
	
}
);



router.post('/:id/escalate', jwtParser.extractTokenUser, async (req, res) => {
	const ticketId = req.params.id;
	const user = req.user;
  const note = 'Escalated to manager for review';
	const toCode = 'ESCALATED';
	const complaintResult = ComplaintService.transition(ticketId, 'ESCALATED', user.username,note);

	const result = await EscalationService.createEscalation(ticketId, req.body.reason);

	if (result.status === StatusEnum.SUCCESS) {
		res.status(result.code).json(result);
	} else {
		res.status(result.code).json(result);
	}


});

router.get('/:id', jwtParser.extractTokenUser, async (req, res) => {
	const ticketId = req.params.id;
	const result = await EscalationService.getEscalationByTicketId(ticketId);
	
	const complaintResult = await ComplaintService.findComplaintById(ticketId);
	if (complaintResult.status !== StatusEnum.SUCCESS) {
		return res.status(complaintResult.code).json(complaintResult);
	}
	
	if (result.status === StatusEnum.SUCCESS) {
		const escalation = result.data;
		escalation.dataValues.complaint = complaintResult.data;
		return res.status(result.code).json(escalation);
	}



	return res.status(result.code).json(result.data);
});


module.exports = router;	