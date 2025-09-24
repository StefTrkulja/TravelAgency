const {Escalation} = require('../models');
const { Result, StatusEnum } = require('../utils/result');
const { Op } = require('sequelize');
const sequelize = require('../models/index').sequelize;
const {parseSequelizeErrors} = require('../utils/errorParser');
const e = require('express');
const status = require('../models/status');
const ComplaintService = require('./complaintService');

class EscalationService {
 
	async createEscalation(complaintId, reason) {
		
		const escalation = {
			complaintId,
			reason,
			escalatedAt: new Date(),
			status: 'PENDING'
		}
		
		
		try {
			const newEscalation = await Escalation.create(escalation);
				
		
			return new Result(StatusEnum.SUCCESS, 201, newEscalation);
		}
		catch (error) {
			console.error('Error creating escalation:', error);
			const parsedError = parseSequelizeErrors(error);
			return new Result(StatusEnum.FAIL, 400, null, parsedError);
	}
	}

	async getEscalationByTicketId(complaintId) {
		try {
			const escalation = await Escalation.findOne({
				where: { complaintId }
			});
			if (!escalation) {
				return new Result(StatusEnum.FAIL, 404, null, { message: 'Escalation not found' });
			}
			return new Result(StatusEnum.SUCCESS, 200, escalation);
		} catch (error) {
			console.error('Error fetching escalation:', error);
			return new Result(StatusEnum.FAIL, 500, null, { message: 'Internal server error' });
		}	
	}

	async updateEscalation(escalation) {
		try {
			await escalation.save();
			return new Result(StatusEnum.SUCCESS, 200, escalation);
		} catch (error) {
			console.error('Error updating escalation:', error);
			const parsedError = parseSequelizeErrors(error);
			return new Result(StatusEnum.FAIL, 400, null, parsedError);
		}
	}


	async getAllEscalations() {
		try {
			const escalations = await Escalation.findAll({
				order: [['escalatedAt', 'DESC']]
			});
			return new Result(StatusEnum.SUCCESS, 200, escalations);
		} catch (error) {
			console.error('Error fetching escalations:', error);
			return new Result(StatusEnum.FAIL, 500, null, { message: 'Internal server error' });
		}
}
}
module.exports = new EscalationService();