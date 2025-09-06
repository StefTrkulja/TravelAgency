const {Complaint} = require('../models');
const { StatusEnum, Result} = require('../utils/result');
const { body, param } = require('express-validator');
const jwtParser = require('../utils/jwtParser');
const {parseSequelizeErrors} = require('../utils/errorParser');	
const sequelize = require('../models/index').sequelize;
const StatusService = require('../services/statusService');
const { Op } = require('sequelize');

class ComplaintService {

	async findComplaintsByUsername(username) {
		const complaints = await Complaint.findAll({
			where: { createdByUsername: username }});


			const statuses = await Promise.all(complaints.map(c => StatusService.getStatusById(c.statusId)));
			complaints.forEach((c, index) => {
				if (statuses[index].status === StatusEnum.OK) {
					c.dataValues.status = statuses[index].data;
				} else {
					c.dataValues.status = null;
				}
			});
	
		return new Result(StatusEnum.OK, 200, complaints);
	}
	async createComplaint(complaintData) {
		try{
			const complaint = await Complaint.create(complaintData);


			return new Result(StatusEnum.OK, 201, complaint);
		}catch (exception) {
			const errors = parseSequelizeErrors(exception);
			return new Result(StatusEnum.FAIL, 500, null, errors);
		}
	}

	async assignToOperator(complaintId, assigneeUsername) {
	
		const transaction = await sequelize.transaction();
		try {
			const complaint = await Complaint.findByPk(complaintId, { transaction, lock: transaction.LOCK.UPDATE });
			if (!complaint) {

				await transaction.rollback();
				return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Complaint not found' }]);
			}
			if (complaint.statusId != 1) { // Assuming statusId 1 is 'pending'
				await transaction.rollback();
				return new Result(StatusEnum.FAIL, 400, null, [{ message: 'Complaint is not in a pending state' }]);
			}
			complaint.statusId = 2; // Assuming statusId 2 is 'in progress'
			complaint.assigneeUsername = assigneeUsername;
			await complaint.save({ transaction });
			await transaction.commit();
			return new Result(StatusEnum.OK, 200, complaint);
		} catch (exception) {
			await transaction.rollback();
			const errors = parseSequelizeErrors(exception);
			return new Result(StatusEnum.FAIL, 500, null, errors);
		}	
	}

	async findForOperator(operatorUsername) {
    // Hocu da napravim funkciju kojca ce da mi vraca sve zalbe koje su dodeljene operateru ili im je status pending
		const complaints = await Complaint.findAll({
			where: {
				[Op.or]: [
					{ assigneeUsername: operatorUsername },
					{ statusId: 1 } // Assuming statusId 1 is 'pending'
				]
			}
		});
		const statuses = await Promise.all(complaints.map(c => StatusService.getStatusById(c.statusId)));
			complaints.forEach((c, index) => {
				if (statuses[index].status === StatusEnum.OK) {
					c.dataValues.status = statuses[index].data;
				} else {
					c.dataValues.status = null;
				}
			});
		return new Result(StatusEnum.OK, 200, complaints);
		}
  }


module.exports = new ComplaintService();