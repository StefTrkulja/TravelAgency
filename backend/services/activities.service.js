const { Result, StatusEnum } = require('../utils/result');
const { Itinerary, ItineraryActivity } = require('../models');

class ActivitiesService {
  async create(itineraryId, payload) {
    const it = await Itinerary.findByPk(itineraryId);
    if (!it) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Itinerary not found' }]);

    const act = await ItineraryActivity.create({
      itineraryId,
      startTime: payload.startTime,
      endTime: payload.endTime,
      activityTitle: payload.activityTitle,
      activityDescription: payload.activityDescription,
      extraCost: payload.extraCost,
      providerNote: payload.providerNote
    });
    return new Result(StatusEnum.OK, 201, act);
  }

  async get(id) {
    const act = await ItineraryActivity.findByPk(id);
    if (!act) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Activity not found' }]);
    return new Result(StatusEnum.OK, 200, act);
  }

  async list(itineraryId) {
    const acts = await ItineraryActivity.findAll({
      where: { itineraryId },
      order: [['startTime','ASC']]
    });
    return new Result(StatusEnum.OK, 200, acts);
  }

  async update(id, payload) {
    const act = await ItineraryActivity.findByPk(id);
    if (!act) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Activity not found' }]);

    const updatable = ['startTime','endTime','activityTitle','activityDescription','extraCost','providerNote'];
    for (const k of updatable) if (payload[k] !== undefined) act[k] = payload[k];
    await act.save();
    return new Result(StatusEnum.OK, 200, act);
  }

  async remove(id) {
    const act = await ItineraryActivity.findByPk(id);
    if (!act) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Activity not found' }]);
    await act.destroy();
    return new Result(StatusEnum.OK, 200, { deleted: id });
  }
}

module.exports = new ActivitiesService();
