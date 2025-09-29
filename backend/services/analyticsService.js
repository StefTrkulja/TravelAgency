const { sequelize, Complaint, SlaTracking, Status, User, CustomerSatisfaction } = require('../models');
const { StatusEnum, Result } = require('../utils/result');
const { Op } = require('sequelize');

class AnalyticsService {

  // SLA Targets Achievement %
  async getSlaTargetsAchievement(options = {}) {
    try {
      const { timeRange = '30d' } = options;
      const whereClause = this.buildTimeRangeFilter(timeRange);

      // Total complaints with SLA tracking
      const totalComplaints = await SlaTracking.count({
        include: [{
          model: Complaint,
          as: 'complaint',
          where: whereClause,
          required: true
        }]
      });

      if (totalComplaints === 0) {
        return new Result(StatusEnum.OK, 200, {
          percentage: 0,
          total: 0,
          achieved: 0,
          timeRange
        });
      }

      // Complaints that met both response and resolution SLA
      const achievedCount = await SlaTracking.count({
        where: {
          responseBreached: false,
          resolutionBreached: false,
          responseBreachedChecked: true,
          resolutionBreachedChecked: true
        },
        include: [{
          model: Complaint,
          as: 'complaint',
          where: whereClause,
          required: true
        }]
      });

      const percentage = Math.round((achievedCount / totalComplaints) * 100);

      return new Result(StatusEnum.OK, 200, {
        percentage,
        total: totalComplaints,
        achieved: achievedCount,
        timeRange
      });
    } catch (err) {
      return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
    }
  }

  // Tickets nearing SLA breach
  async getTicketsNearingBreach() {
    try {
      const now = new Date();
      const warningThreshold = 30 * 60 * 1000; // 30 minutes before due

      const nearingBreach = await SlaTracking.findAll({
        where: {
          [Op.or]: [
            // Response SLA at risk
            {
              responseDueAt: {
                [Op.between]: [now, new Date(now.getTime() + warningThreshold)]
              },
              firstResponseAt: null,
              responseBreached: false
            },
            // Resolution SLA at risk
            {
              resolutionDueAt: {
                [Op.between]: [now, new Date(now.getTime() + warningThreshold)]
              },
              resolvedAt: null,
              resolutionBreached: false
            }
          ]
        },
        include: [{
          model: Complaint,
          as: 'complaint',
          include: [
            { model: Status, as: 'status' },
            { model: User, as: 'assignee', attributes: ['name', 'surname'] }
          ]
        }],
        order: [['responseDueAt', 'ASC'], ['resolutionDueAt', 'ASC']]
      });

      const formattedTickets = nearingBreach.map(sla => {
        const complaint = sla.complaint;
        const assigneeName = complaint.assignee ? 
          `${complaint.assignee.name} ${complaint.assignee.surname}` : 'Unassigned';
        
        // Determine which SLA is at risk
        let riskType = 'Response';
        let dueAt = sla.responseDueAt;
        if (sla.firstResponseAt && sla.resolutionDueAt) {
          riskType = 'Resolution';
          dueAt = sla.resolutionDueAt;
        }

        return {
          ticketId: complaint.id,
          priority: complaint.priority,
          assignee: assigneeName,
          riskType,
          dueAt: dueAt,
          category: complaint.category
        };
      });

      return new Result(StatusEnum.OK, 200, formattedTickets);
    } catch (err) {
      return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
    }
  }

  // Active tickets count
  async getActiveTicketsCount() {
    try {
      // Get active status IDs (not CLOSED, RESOLVED)
      const activeStatuses = await Status.findAll({
        where: {
          code: {
            [Op.notIn]: ['CLOSED', 'RESOLVED']
          }
        }
      });

      const activeStatusIds = activeStatuses.map(s => s.id);

      // Get all active tickets with their SLA status
      const activeTickets = await Complaint.findAll({
        where: {
          statusId: {
            [Op.in]: activeStatusIds
          }
        },
        include: [{
          model: SlaTracking,
          as: 'sla',
          required: false // Include tickets even if no SLA tracking
        }]
      });

      let breachedCount = 0;
      let unbreachedCount = 0;

      activeTickets.forEach(ticket => {
        if (ticket.sla) {
          // Check if any SLA is breached
          if (ticket.sla.responseBreached || ticket.sla.resolutionBreached) {
            breachedCount++;
          } else {
            unbreachedCount++;
          }
        } else {
          // Tickets without SLA tracking are considered unbreached
          unbreachedCount++;
        }
      });

      return new Result(StatusEnum.OK, 200, {
        unbreached: unbreachedCount,
        breached: breachedCount
      });
    } catch (err) {
      return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
    }
  }

  // Customer Satisfaction - updated to use real data
  async getCustomerSatisfaction(options = {}) {
    try {
      const { timeRange = '30d' } = options;
      const whereClause = this.buildTimeRangeFilter(timeRange);

      // Get actual customer satisfaction records within the time range
      const satisfactionRecords = await CustomerSatisfaction.findAll({
        where: {
          createdAt: {
            [Op.gte]: whereClause.createdAt[Op.gte]
          }
        },
        include: [
          {
            model: Complaint,
            as: 'complaint',
            attributes: ['id', 'subject', 'category', 'priority', 'createdAt'],
            include: [{
              model: Status,
              as: 'status',
              attributes: ['name', 'code']
            }]
          },
          {
            model: User,
            as: 'customer',
            attributes: ['name', 'surname', 'username']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 20
      });

      const formattedData = satisfactionRecords.map(satisfaction => {
        const customerName = satisfaction.customer ? 
          `${satisfaction.customer.name} ${satisfaction.customer.surname}` : 'Unknown';
        
        return {
          ticketId: satisfaction.complaint.id,
          customerName,
          rating: satisfaction.rating,
          feedback: satisfaction.comment || 'No comment provided',
          createdAt: satisfaction.createdAt,
          resolvedAt: satisfaction.createdAt, // When satisfaction was given
          priority: satisfaction.complaint.priority || 'MEDIUM',
          category: satisfaction.complaint.category
        };
      });

      return new Result(StatusEnum.OK, 200, formattedData);
    } catch (err) {
      console.error('AnalyticsService.getCustomerSatisfaction error:', err);
      return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
    }
  }

  // SLA targets achieved today
  async getSlaTargetsToday() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Get all SLA tracking records for tickets created today
      const todayTracking = await SlaTracking.findAll({
        include: [{
          model: Complaint,
          as: 'complaint',
          where: {
            createdAt: {
              [Op.between]: [startOfDay, endOfDay]
            }
          },
          required: true
        }]
      });

      let breachedCount = 0;
      let unbreachedCount = 0;

      todayTracking.forEach(sla => {
        if (sla.responseBreached || sla.resolutionBreached) {
          breachedCount++;
        } else {
          unbreachedCount++;
        }
      });

      return new Result(StatusEnum.OK, 200, {
        breached: breachedCount,
        unbreached: unbreachedCount,
        total: breachedCount + unbreachedCount
      });
    } catch (err) {
      return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
    }
  }

  // Get tickets count per day for the given time range
  async getTicketsPerDay(options = {}) {
    try {
      const { timeRange = '30d' } = options;
      
      // Calculate date range
      const now = new Date();
      let days, startDate;

      switch (timeRange) {
        case '7d':
          days = 7;
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          days = 30;
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          days = 90;
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          days = 30;
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get tickets grouped by day
      const ticketsPerDay = await Complaint.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        },
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      // Create array with all days (fill missing days with 0)
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const dayData = ticketsPerDay.find(item => item.date === dateStr);
        result.push({
          date: dateStr,
          day: date.getDate(),
          month: date.getMonth() + 1,
          count: dayData ? parseInt(dayData.count) : 0
        });
      }

      return new Result(StatusEnum.OK, 200, result);
    } catch (err) {
      return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
    }
  }

  // Helper method to build time range filters
  buildTimeRangeFilter(timeRange) {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      createdAt: {
        [Op.gte]: startDate
      }
    };
  }
}

module.exports = new AnalyticsService();