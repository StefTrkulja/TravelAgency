const { Activity, User, TravelArrangement } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class ActivityService {
  async createActivity(payload) {
    try {
      const activity = await Activity.create(payload);
      return new Result(StatusEnum.SUCCESS, 201, activity);
    } catch (error) {
      console.error("Error creating activity:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAllActivities() {
    try {
      const activities = await Activity.findAll({
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: TravelArrangement, as: 'arrangement' }
        ]
      });
      return new Result(StatusEnum.SUCCESS, 200, activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getActivityById(id) {
    try {
      const activity = await Activity.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: TravelArrangement, as: 'arrangement' }
        ]
      });

      if (!activity) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Activity not found' });
      }

      return new Result(StatusEnum.SUCCESS, 200, activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getActivitiesByArrangementId(arrangementId) {
    try {
      const activities = await Activity.findAll({
        where: { arrangement_id: arrangementId },
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: TravelArrangement, as: 'arrangement' }
        ]
      });

      // Always return 200, even if empty
      return new Result(StatusEnum.SUCCESS, 200, activities);
    } catch (error) {
      console.error("Error fetching activities by arrangementId:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async updateActivity(id, updates) {
    try {
      const activity = await Activity.findByPk(id);
      if (!activity) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Activity not found' });
      }

      await activity.update(updates);
      return new Result(StatusEnum.SUCCESS, 200, activity);
    } catch (error) {
      console.error("Error updating activity:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async deleteActivity(id) {
    try {
      const deletedCount = await Activity.destroy({ where: { id } });
      if (deletedCount === 0) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Activity not found' });
      }
      return new Result(StatusEnum.SUCCESS, 200, { deleted: true });
    } catch (error) {
      console.error("Error deleting activity:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

    async updateValue(activityId, newValue) {
  const act = await Activity.findByPk(activityId)
  if (!act) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Activity not found' }])

  act.value = newValue
  await act.save()
  return new Result(StatusEnum.OK, 200, act)
}
}

module.exports = new ActivityService();
