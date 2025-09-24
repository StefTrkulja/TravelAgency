const { Status} = require('../models');
const { Result, StatusEnum } = require('../utils/result');
const { parseSequelizeErrors } = require('../utils/errorParser');
const sequelize = require('../models/index').sequelize;
const { raw } = require('express');
const BloomFilter = require('../utils/bloomFilter');
const { Op } = require('sequelize');


class StatusService {

	async getStatusById(id) {
		try {
			const status = await Status.findByPk(id);
			if (!status) {
				return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Status not found' }]);
			}
			return new Result(StatusEnum.OK, 200, status);
		} catch (exception) {
			const errors = parseSequelizeErrors(exception);
			return new Result(StatusEnum.FAIL, 500, null, errors);
		}
	}

	async getAllStatuses() {
		try {
			const statuses = await Status.findAll();
			return new Result(StatusEnum.OK, 200, statuses);

		} catch (exception) {
			const errors = parseSequelizeErrors(exception);
			return new Result(StatusEnum.FAIL, 500, null, errors);
		}

	}




}
module.exports = new StatusService();