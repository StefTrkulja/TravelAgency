const {Result, StatusEnum} = require('../utils/result');
const express = require('express');
const jwtParser = require('../utils/jwtParser');
const router = express.Router();
const slaParamService =  require('../services/slaParameterService');
const SlaTrackingService = require('../services/slaTrackingService');

router.get('/parameters',jwtParser.extractTokenUser, async (req, res) => {
	if (!req.user) return res.status(401).json(new Result(StatusEnum.ERROR, 'Unauthorized'));
	if (req.user.role !== 'operator') {
		return res.status(403).json(new Result(StatusEnum.ERROR, 'Forbidden'));
	}
	const priority = req.query.priority;
  const result = await slaParamService.getSlaParametersByPriority(priority);
	if (result.status === StatusEnum.ERROR) {
		return res.status(400).json(result);
	}
	return res.status(200).json(result.data);
});

router.get('/tracking/:id',jwtParser.extractTokenUser, async (req, res) => {
	if (!req.user) return res.status(401).json(new Result(StatusEnum.ERROR, 'Unauthorized'));
	if (req.user.role !== 'manager') {
		return res.status(403).json(new Result(StatusEnum.ERROR, 'Forbidden'));
	}
	const complaintId = req.params.id;
	const result = await SlaTrackingService.getByComplaintId(complaintId);
	if (result.status === StatusEnum.ERROR) {
		return res.status(400).json(result);
	}
	return res.status(200).json(result.data);
});




module.exports = router