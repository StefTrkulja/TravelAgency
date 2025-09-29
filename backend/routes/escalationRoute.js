const { Result, StatusEnum } = require('../utils/result');
const jwtParser = require('../utils/jwtParser');
const express = require('express');
const router = express.Router();
const ComplaintService = require('../services/complaintService');
const EscalationService = require('../services/escalationService');
const EscalationMessageService = require('../services/escalationMessageService');


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


router.post('/:id/accept', jwtParser.extractTokenUser, async (req, res) => {
	const ticketId = req.params.id;
	const user = req.user;
	const note = 'Manager accepted the escalation';


	const escalationResult = await EscalationService.getEscalationByTicketId(ticketId);

	if (escalationResult.status !== StatusEnum.OK) {
		return res.status(escalationResult.code).json(escalationResult);
	}
	const escalation = escalationResult.data;
	escalation.status = 'ACCEPTED';
	escalation.managerUsername = user.username;
	const updateResult = await EscalationService.updateEscalation(escalation);

	if (updateResult.status !== StatusEnum.OK) {
		return res.status(updateResult.code).json(updateResult);
	}
	return res.status(updateResult.code).json(updateResult);
});

// Get escalation by complaint/ticket ID
router.get('/:id', jwtParser.extractTokenUser, async (req, res) => {
	const ticketId = req.params.id;
	const result = await EscalationService.getEscalationByTicketId(ticketId);
	const complaintResult = await ComplaintService.findComplaintById(ticketId);
	
	if (complaintResult.status !== StatusEnum.OK) {
		return res.status(complaintResult.code).json(complaintResult);
	}

		const escalation = result.data;
		escalation.dataValues.complaint = complaintResult.data;
		return res.status(result.code).json(escalation);

});

// Get escalation with messages by complaint/ticket ID
router.get('/by-complaint/:complaintId', 
	jwtParser.extractTokenUser, 
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'operator' && req.user.role !== 'manager') {
			return res.status(403).json({ message: 'Forbidden' });
		}
		
		const complaintId = req.params.complaintId;
		
		try {
			// Prvo dobij escalation
			const escalationResult = await EscalationService.getEscalationByTicketId(complaintId);
			
			if (escalationResult.status !== StatusEnum.OK) {
				return res.status(escalationResult.code).json({ escalation: null, messages: [] });
			}
			
			const escalation = escalationResult.data;
			
			// Zatim dobij poruke
			const messagesResult = await EscalationMessageService.findMessagesByEscalationId(escalation.id);
			const messages = messagesResult.status === StatusEnum.OK ? messagesResult.data : [];
			
			return res.status(200).json({
				escalation: escalation,
				messages: messages
			});
			
		} catch (error) {
			console.error('Error fetching escalation by complaint:', error);
			return res.status(500).json({ message: 'Internal server error' });
		}
	}
);

router.get('/:id/messages',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'operator' && req.user.role !== 'manager') {
			return res.status(403).json({ message: 'Forbidden' });
		}
		const escalationId = req.params.id;
		const result = await EscalationMessageService.findMessagesByEscalationId(escalationId);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
)
router.post('/:id/messages',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'operator' && req.user.role !== 'manager') {
			return res.status(403).json({ message: 'Forbidden' });
		}
		const escalationId = req.params.id;
		const  text  = req.body.text;
		const authorUsername = req.user.username;
		const message = {
			escalationId: escalationId,
			content: text,
			authorUsername: authorUsername,
			createdAt: new Date()
		};
		const result = await EscalationMessageService.createMessage(message);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
)



module.exports = router;	