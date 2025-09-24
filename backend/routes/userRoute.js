const { Result, StatusEnum } = require('../utils/result');
const UserService = require('../services/userService');
const { parseValidationErrors } = require('../utils/errorParser');
const { registerValidator, loginValidator } = require('../validators/userValidators');
const { activeUsersGauge } = require('../utils/metrics');
const jwtParser = require('../utils/jwtParser');
const ms = require('ms');
const express = require('express');
const router = express.Router();

router.post('/register',
	...registerValidator,
	parseValidationErrors,
	async (req, res) => {

		const user = req.body;
		const result = await UserService.register(user, 'user');

		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}

		return res.status(201).json({ message: 'User registered successfully!' });
	});

router.post('/login',
	...loginValidator,
	parseValidationErrors,
	async (req, res) => {
		const { email, password } = req.body;

		const result = await UserService.login(email, password);


		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}

		const user = result.data;
		const token = jwtParser.generateToken(user);
		res.cookie('token', token, {
			httpOnly: true,
			maxAge: ms(process.env.COOKIE_EXPIRES_IN)
		});

		activeUsersGauge.inc();
		return res.status(result.code).json({
			message: 'Login successful!',
			username: user.username,
			role: user.role
		});
	});

router.post('/logout',
	async (req, res) => {
		res.clearCookie('token');

		activeUsersGauge.dec();
		return res.status(200).json({ message: 'Logout successful!' });
	});


router.get('/operators',jwtParser.extractTokenUser, async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'manager') {
			return res.status(403).json({ message: 'Forbidden' });
		}

		const result = await UserService.findOperators();
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}

		return res.status(result.code).json(result.data);
	}
);

router.get('/activate/:token',
	async (req, res) => {
		let result;

		const token = req.params.token;
		result = jwtParser.decodeToken(token);
		if (result.status === StatusEnum.FAIL) {
			return res.status(400).json({ message: 'Invalid activation token' });
		}

		const user = result.data;
		result = await UserService.activateUser(user.email);

		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}

		return res.status(result.code).json({ message: 'Account activated successfully!' });
	});
	
module.exports = router;