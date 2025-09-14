const {ComplaintMessage} = require('../models');	
const { StatusEnum, Result} = require('../utils/result');
const { parseSequelizeErrors } = require('../utils/errorParser');
const sequelize = require('../models/index').sequelize;


const { Op } = require('sequelize');	

class ComplaintMessageService {

	async findMessagesByComplaintId(complaintId) {
		const messages = await ComplaintMessage.findAll({
			where: { complaintId: complaintId },
			order: [['createdAt', 'ASC']]
		});
		return new Result(StatusEnum.OK, 200, messages);
	}
	async createMessage(message) {
		const createdMessage = await ComplaintMessage.create(message);
		return new Result(StatusEnum.OK, 201, createdMessage);
	}
}

module.exports = new ComplaintMessageService();