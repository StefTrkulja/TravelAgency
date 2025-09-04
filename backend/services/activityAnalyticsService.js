const { ActivityAnalytics, User } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class ActivityAnalyticsService {
  async createAnalytics(payload) {
    try {
      // optional: check if user exists
      if (payload.user_id) {
        const user = await User.findByPk(payload.user_id);
        if (!user) {
          return new Result(StatusEnum.FAIL, 400, null, { message: 'Invalid user_id' });
        }
      }

      const analytics = await ActivityAnalytics.create(payload);
      return new Result(StatusEnum.SUCCESS, 201, analytics);
    } catch (error) {
      console.error("Error creating booking analytics:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAllAnalytics() {
    try {
      const analytics = await ActivityAnalytics.findAll({
        include: [{ model: User, as: 'user' }]
      });
      return new Result(StatusEnum.SUCCESS, 200, analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAnalyticsById(id) {
    try {
      const analytics = await ActivityAnalytics.findByPk(id, {
        include: [{ model: User, as: 'user' }]
      });
      if (!analytics) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Analytics not found' });
      }
      return new Result(StatusEnum.SUCCESS, 200, analytics);
    } catch (error) {
      console.error("Error fetching analytics by id:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAnalyticsByUserId(userId) {
    try {
      const analytics = await ActivityAnalytics.findAll({
        where: { user_id: userId },
        include: [{ model: User, as: 'user' }]
      });
      if (!analytics || analytics.length === 0) {
        return new Result(StatusEnum.FAIL, 404, [], { message: 'No analytics found for this user' });
      }
      return new Result(StatusEnum.SUCCESS, 200, analytics);
    } catch (error) {
      console.error("Error fetching analytics by userId:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async updateAnalytics(id, updates) {
    try {
      const analytics = await ActivityAnalytics.findByPk(id);
      if (!analytics) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Analytics not found' });
      }
      await analytics.update(updates);
      return new Result(StatusEnum.SUCCESS, 200, analytics);
    } catch (error) {
      console.error("Error updating analytics:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async deleteAnalytics(id) {
    try {
      const deleted = await ActivityAnalytics.destroy({ where: { id } });
      if (deleted === 0) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Analytics not found' });
      }
      return new Result(StatusEnum.SUCCESS, 200, { deleted: true });
    } catch (error) {
      console.error("Error deleting analytics:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }
}

module.exports = new ActivityAnalyticsService();
