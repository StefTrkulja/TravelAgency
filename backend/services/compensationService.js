const { Compensation } = require('../models');
const { Result, StatusEnum } = require('../utils/result');
const { parseSequelizeErrors } = require('../utils/errorParser');
const sequelize = require('../models/index').sequelize;
const { Op } = require('sequelize');
class CompensationService {


	async proposeCompensation(compensation) {
		console.log("Propose compensation service", compensation)
		const transaction = await sequelize.transaction();
		try {
			const newCompensation = await Compensation.create(compensation, {
				transaction,
				lock: transaction.LOCK.UPDATE
			});
			await transaction.commit();
			return new Result(StatusEnum.OK, 201, newCompensation);
		} catch (error) {
			await transaction.rollback();
			return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(error));
		}
	}

	async updateCompensation(payload) {
		try {
			const updated = await sequelize.transaction(async (t) => {
				const comp = await Compensation.findByPk(payload.id, { transaction: t });
				if (!comp) throw new Error('Compensation not found');

				comp.status = payload.status ?? comp.status;
				comp.managerUsername = payload.managerUsername ?? comp.managerUsername;

				await comp.save({ transaction: t });
				return comp;
			});

			return new Result(StatusEnum.OK, 200, updated);
		} catch (err) {
			return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(err));
		}
	}

	async getCompensationById(id) {

		try {
			const compensation = await Compensation.findByPk(id);
			if (!compensation) {
				return new Result(StatusEnum.FAIL, 404, null, { message: 'Compensation not found' });
			}
			return new Result(StatusEnum.SUCCESS, 200, compensation);
		} catch (error) {
			console.error('Error fetching compensation:', error);
			return new Result(StatusEnum.FAIL, 500, null, { message: 'Internal server error' });
		}

	}


	async getCompensationsByComplaintId(complaintId) {
		try {
			const compensation = await Compensation.findAll({
				where: { complaintId }
			});
			if (!compensation) {
				return new Result(StatusEnum.FAIL, 404, null, { message: 'Compensation not found' });
			}
			return new Result(StatusEnum.SUCCESS, 200, compensation);
		} catch (error) {
			console.error('Error fetching compensation:', error);
			return new Result(StatusEnum.FAIL, 500, null, { message: 'Internal server error' });
		}
	}

	

	async getAllCompensations() {
		try {
			const compensations = await Compensation.findAll();

			return new Result(StatusEnum.SUCCESS, 200, compensations);
		} catch (error) {
			console.error('Error fetching compensations:', error);
			return new Result(StatusEnum.FAIL, 500, null, { message: 'Internal server error' });
		}
	}

}
module.exports = new CompensationService();
