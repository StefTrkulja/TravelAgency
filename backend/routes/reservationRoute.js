const { Result, StatusEnum } = require('../utils/result');
const ReservationService = require('../services/reservationService');
const jwtParser = require('../utils/jwtParser');

const express = require('express');
const router = express.Router();

router.get('/myreservations',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (req.user === null) {
			return res.status(401).json({ message: 'Unauthorized' });
		}
		const username = req.user.username;	
		const result = await ReservationService.findReservationsByUsername(username);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	})






module.exports = router;