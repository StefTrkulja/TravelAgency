const {Result, StatusEnum} = require('../utils/result');
const CompensationService = require('../services/compensationService');
const {parseValidationErrors} = require('../utils/errorParser');
const jwtParser = require('../utils/jwtParser');
const ms = require('ms');
const express = require('express');
const router = express.Router();

router.post('/:id/propose', jwtParser.extractTokenUser, async (req, res) => {
	const user = req.user;
	if (!user || user.role !== 'operator') {
		return res.status(403).json({message: 'Forbidden'});
	}
	const complainId = req.params.id;
	console.log("staeovo:", req.body) 
	const compensation = {
		complaintId: complainId,
		currency: req.body.currency,
		type : req.body.type,
		amount: req.body.value,
		note: req.body.note,
		validUntil: req.body.validUntil,
		status : 'PROPOSED',
		createdAt: new Date(),
	}
	const result = await CompensationService.proposeCompensation(compensation);
if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}

		return res.status(result.code).json(result.data);
});


router.get('/:id', jwtParser.extractTokenUser, async (req, res) => {
	const user = req.user;
	if (!user) {
		return res.status(403).json({message: 'Forbidden'});
	}
	const complainId = req.params.id;
	const result = await CompensationService.getCompensationByComplaintId(complainId);
	if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
});


router.post('/:id/reject', jwtParser.extractTokenUser, async (req, res) => {
	const user = req.user;
	if (!user || user.role !== 'manager') {
		return res.status(403).json({message: 'Forbidden'});
	}
	const complainId = req.params.id;
	// Fetch the compensation
	const result = await CompensationService.getCompensationByComplaintId(complainId);
	if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
	const compensation = result.data;
	if (compensation.status !== 'PROPOSED') {
		return res.status(400).json({ message: 'Only proposed compensations can be rejected' });
	}
	compensation.status = 'REJECTED';
	compensation.managerUsername = user.username;
	const saveResult = await CompensationService.updateCompensation(compensation);
	if (saveResult.status === StatusEnum.FAIL) {
		return res.status(saveResult.code).json({ errors: saveResult.errors });
	}
	return res.status(saveResult.code).json(saveResult.data);
});


router.post('/:id/approve', jwtParser.extractTokenUser, async (req, res) => {
	const user = req.user;
	if (!user || user.role !== 'manager') {
		return res.status(403).json({message: 'Forbidden'});
	}
	const complainId = req.params.id;
	// Fetch the compensation
	const result = await CompensationService.getCompensationByComplaintId(complainId);
	if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
	const compensation = result.data;
	if (compensation.status !== 'PROPOSED') {
		return res.status(400).json({ message: 'Only proposed compensations can be approved' });
	}
	compensation.status = 'APPROVED';
	compensation.managerUsername = user.username;
	const saveResult = await CompensationService.updateCompensation(compensation);
	if (saveResult.status === StatusEnum.FAIL) {
		return res.status(saveResult.code).json({ errors: saveResult.errors });
	}
	return res.status(saveResult.code).json(saveResult.data);
});

module.exports = router;