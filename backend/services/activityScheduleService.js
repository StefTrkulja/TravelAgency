const { ActivitySchedule, Activity } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class ActivityScheduleService {
  async createSchedule(payload) {
    try {
      
      const activity = await Activity.findByPk(payload.activity_id);
      if (!activity) {
        return new Result(StatusEnum.FAIL, 400, null, { message: 'Invalid activity_id' });
      }

      const schedule = await ActivitySchedule.create(payload);
      return new Result(StatusEnum.SUCCESS, 201, schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAllSchedules() {
    try {
      const schedules = await ActivitySchedule.findAll({
        include: [
          { model: Activity, as: 'activity' }
        ]
      });
      return new Result(StatusEnum.SUCCESS, 200, schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getScheduleById(id) {
    try {
      const schedule = await ActivitySchedule.findByPk(id, {
        include: [
          { model: Activity, as: 'activity' }
        ]
      });

      if (!schedule) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Schedule not found' });
      }

      return new Result(StatusEnum.SUCCESS, 200, schedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getSchedulesByActivityId(activityId) {
    try {
      const schedules = await ActivitySchedule.findAll({
        where: { activity_id: activityId },
        include: [
          { model: Activity, as: 'activity' }
        ]
      });

      if (!schedules || schedules.length === 0) {
        return new Result(StatusEnum.FAIL, 404, [], { message: 'No schedules found for this activity' });
      }

      return new Result(StatusEnum.SUCCESS, 200, schedules);
    } catch (error) {
      console.error("Error fetching schedules by activityId:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async updateSchedule(id, updates) {
    try {
      const schedule = await ActivitySchedule.findByPk(id);
      if (!schedule) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Schedule not found' });
      }

      await schedule.update(updates);
      return new Result(StatusEnum.SUCCESS, 200, schedule);
    } catch (error) {
      console.error("Error updating schedule:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async deleteSchedule(id) {
    try {
      const deletedCount = await ActivitySchedule.destroy({ where: { id } });
      if (deletedCount === 0) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Schedule not found' });
      }
      return new Result(StatusEnum.SUCCESS, 200, { deleted: true });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }
}

module.exports = new ActivityScheduleService();
