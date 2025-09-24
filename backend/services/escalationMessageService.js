const {EscalationMessage} = require('../models');	
const { StatusEnum, Result} = require('../utils/result');
const { parseSequelizeErrors } = require('../utils/errorParser');
const sequelize = require('../models/index').sequelize;


const { Op } = require('sequelize');	

class EscalationMessageService {

	async findMessagesByEscalationId(escalationId) {
		const messages = await EscalationMessage.findAll({
			where: { escalationId: escalationId },
			order: [['createdAt', 'ASC']]
		});
		return new Result(StatusEnum.OK, 200, messages);
	}
	async createMessage(message) {
		const createdMessage = await EscalationMessage.create(message);
		return new Result(StatusEnum.OK, 201, createdMessage);
	}
}

module.exports = new EscalationMessageService();