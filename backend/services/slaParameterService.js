const {Result, StatusEnum} = require('../utils/result');
const sequelize = require('../models/index').sequelize;
const {parseSequelizeErrors} = require('../utils/errorParser');	
const { slaParameter } = require('../models');

class SlaParameterService {

	async getSlaParametersByPriority(prior) {
		try {
			const params = await slaParameter.findAll({
				where: {priority: prior}
			});
			if (!params || params.length === 0) {
				return new Result(StatusEnum.ERROR, 'No SLA parameters found for the given priority');
			}
			return new Result(StatusEnum.SUCCESS, 'SLA parameters retrieved successfully', params);
		} catch (error) {
			console.error('Error fetching SLA parameters:', error);
			return new Result(StatusEnum.ERROR, 'Database error while fetching SLA parameters');
		}
	}

	 async getActiveByPriority(priority, options = {}) {
    try {
      const pri = String(priority || '').toUpperCase();
      			
      const params = await slaParameter.findOne({
        where: { priority: pri, isActive: true },
        transaction: options.transaction,
      });


      if (!params) {
        return new Result(StatusEnum.FAIL, 404, null, [{ message: `No SLA parameters for priority ${pri}` }]);
      }

      return new Result(StatusEnum.OK, 200, params);
    } catch (err) {
      return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
    }
  }

}
module.exports = new SlaParameterService();