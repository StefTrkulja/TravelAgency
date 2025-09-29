const { CustomerSatisfaction, Complaint } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class CustomerSatisfactionService {

  // Kreiranje CSAT ocene
  async create(csatData) {
    try {
      // Validacija da li žalba postoji i pripada korisniku
      const complaint = await Complaint.findOne({
        where: {
          id: csatData.complaintId,
          createdByUsername: csatData.customerUsername
        },
        include: [{
          model: require('../models').Status,
          as: 'status'
        }]
      });

      if (!complaint) {
        return new Result(StatusEnum.FAIL, 404, null, [
          { message: 'Complaint not found or access denied' }
        ]);
      }

      // Proveriti da li je žalba zatvorena
      if (complaint.status.code !== 'CLOSED') {
        return new Result(StatusEnum.FAIL, 400, null, [
          { message: 'Can only rate closed complaints' }
        ]);
      }

      // Proveriti da li već postoji ocena
      const existingRating = await CustomerSatisfaction.findOne({
        where: { complaintId: csatData.complaintId }
      });

      if (existingRating) {
        return new Result(StatusEnum.FAIL, 409, null, [
          { message: 'This complaint has already been rated' }
        ]);
      }

      // Kreirati novu ocenu
      const satisfaction = await CustomerSatisfaction.create({
        complaintId: csatData.complaintId,
        customerUsername: csatData.customerUsername,
        rating: csatData.rating,
        comment: csatData.comment || null,
        createdAt: new Date()
      });

      return new Result(StatusEnum.OK, 201, satisfaction);

    } catch (error) {
      console.error('CustomerSatisfactionService.create error:', error);
      return new Result(StatusEnum.FAIL, 500, null, [
        { message: error.message }
      ]);
    }
  }

  // Dobijanje CSAT ocene za žalbu
  async getByComplaintId(complaintId) {
    try {
      const satisfaction = await CustomerSatisfaction.findOne({
        where: { complaintId },
        include: [{
          model: require('../models').User,
          as: 'customer',
          attributes: ['name', 'surname', 'username']
        }]
      });

      return new Result(StatusEnum.OK, 200, satisfaction);

    } catch (error) {
      console.error('CustomerSatisfactionService.getByComplaintId error:', error);
      return new Result(StatusEnum.FAIL, 500, null, [
        { message: error.message }
      ]);
    }
  }

  // Lista CSAT ocena (za analytics)
  async getAll(options = {}) {
    try {
      const { limit = 50, offset = 0, rating = null, dateFrom = null, dateTo = null } = options;
      
      const whereClause = {};
      
      if (rating !== null) {
        whereClause.rating = rating;
      }
      
      if (dateFrom && dateTo) {
        whereClause.createdAt = {
          [require('sequelize').Op.between]: [new Date(dateFrom), new Date(dateTo)]
        };
      }

      const satisfactions = await CustomerSatisfaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: require('../models').Complaint,
            as: 'complaint',
            attributes: ['id', 'subject', 'category', 'createdAt'],
            include: [{
              model: require('../models').Status,
              as: 'status',
              attributes: ['name', 'code']
            }]
          },
          {
            model: require('../models').User,
            as: 'customer',
            attributes: ['name', 'surname', 'username']
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return new Result(StatusEnum.OK, 200, {
        rows: satisfactions.rows,
        count: satisfactions.count,
        limit,
        offset
      });

    } catch (error) {
      console.error('CustomerSatisfactionService.getAll error:', error);
      return new Result(StatusEnum.FAIL, 500, null, [
        { message: error.message }
      ]);
    }
  }

  // Statistike zadovoljstva
  async getStatistics(options = {}) {
    try {
      const { dateFrom = null, dateTo = null } = options;
      
      const whereClause = {};
      if (dateFrom && dateTo) {
        whereClause.createdAt = {
          [require('sequelize').Op.between]: [new Date(dateFrom), new Date(dateTo)]
        };
      }

      const stats = await CustomerSatisfaction.findAll({
        where: whereClause,
        attributes: [
          'rating',
          [require('sequelize').fn('COUNT', require('sequelize').col('rating')), 'count']
        ],
        group: ['rating'],
        order: [['rating', 'ASC']]
      });

      const totalCount = stats.reduce((sum, stat) => sum + parseInt(stat.dataValues.count), 0);
      const averageRating = stats.reduce((sum, stat) => 
        sum + (stat.dataValues.rating * parseInt(stat.dataValues.count)), 0) / (totalCount || 1);

      return new Result(StatusEnum.OK, 200, {
        distribution: stats.map(stat => ({
          rating: stat.dataValues.rating,
          count: parseInt(stat.dataValues.count),
          percentage: totalCount > 0 ? Math.round((parseInt(stat.dataValues.count) / totalCount) * 100) : 0
        })),
        totalCount,
        averageRating: Math.round(averageRating * 100) / 100
      });

    } catch (error) {
      console.error('CustomerSatisfactionService.getStatistics error:', error);
      return new Result(StatusEnum.FAIL, 500, null, [
        { message: error.message }
      ]);
    }
  }
}

module.exports = new CustomerSatisfactionService();