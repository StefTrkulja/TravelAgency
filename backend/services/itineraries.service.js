const { Result, StatusEnum } = require('../utils/result');
const { Departure, Itinerary, ItineraryActivity } = require('../models');

class ItinerariesService {
  async create(departureId, payload) {
    const dep = await Departure.findByPk(departureId);
    if (!dep) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]);

    const it = await Itinerary.create({
      departureId,
      dayNo: payload.dayNo,
      title: payload.title,
      description: payload.description,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      location: payload.location
    });
    return new Result(StatusEnum.OK, 201, it);
  }

  async get(id) {
    const it = await Itinerary.findByPk(id, { include: [{ model: ItineraryActivity, as: 'activities' }] });
    if (!it) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Itinerary not found' }]);
    return new Result(StatusEnum.OK, 200, it);
  }

  async list(departureId) {
    const items = await Itinerary.findAll({
      where: { departureId },
      order: [['dayNo','ASC'], ['startTime','ASC']]
    });
    return new Result(StatusEnum.OK, 200, items);
  }

  async update(id, payload) {
    const it = await Itinerary.findByPk(id);
    if (!it) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Itinerary not found' }]);

    const updatable = ['dayNo','title','description','date','startTime','endTime','location'];
    for (const k of updatable) if (payload[k] !== undefined) it[k] = payload[k];
    await it.save();
    return new Result(StatusEnum.OK, 200, it);
  }

  async remove(id) {
    const it = await Itinerary.findByPk(id);
    if (!it) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Itinerary not found' }]);
    await ItineraryActivity.destroy({ where: { itineraryId: id } });
    await it.destroy();
    return new Result(StatusEnum.OK, 200, { deleted: id });
  }
}

module.exports = new ItinerariesService();
