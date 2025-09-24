const { Result, StatusEnum } = require('../utils/result');
const jwtParser = require('../utils/jwtParser');
const  StatusService  = require('../services/statusService');
const express = require('express');
const router = express.Router();

router.get('/',
	jwtParser.extractTokenUser,
	async (req, res) => {
		console.log("req.user", req.user);
		if (!req.user) {
			return res.status(401).json({ message: 'Unauthorized' });
		}

		if(req.user.role == 'user'){
			return res.status(403).json({ message: 'Forbidden' });
		}
		const result = await StatusService.getAllStatuses();
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}

		return res.json(result.data);
	});

	module.exports = router;