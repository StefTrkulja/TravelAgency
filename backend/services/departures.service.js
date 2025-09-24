'use strict';
const { Result, StatusEnum } = require('../utils/result');
const { sequelize, TravelArrangement, Departure, Itinerary, ItineraryActivity } = require('../models');
const { Op } = require('sequelize');

class DeparturesService {
  async create(arrangementId, payload) {
    const a = await TravelArrangement.findByPk(+arrangementId);
    if (!a) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Arrangement not found' }]);

    const dep = await Departure.create({
      arrangementId: +arrangementId,
      startDate: payload.startDate,
      endDate: payload.endDate ?? (a.type === 'DAY_TRIP' ? payload.startDate : null),
      capacityTotal: payload.capacity ?? payload.capacityTotal ?? 0,
      status: payload.status || 'SCHEDULED'
    });
    return new Result(StatusEnum.OK, 201, dep);
  }

  async get(id) {
    const dep = await Departure.findByPk(+id);
    if (!dep) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]);
    return new Result(StatusEnum.OK, 200, dep);
  }

  async list(arrangementId) {
    const deps = await Departure.findAll({ where: { arrangementId: +arrangementId }, order: [['startDate','ASC']] });
    return new Result(StatusEnum.OK, 200, deps);
  }

  async update(id, payload) {
    const dep = await Departure.findByPk(+id);
    if (!dep) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]);

    const updatable = ['startDate','endDate','capacityTotal','status'];
    for (const k of updatable) if (payload[k] !== undefined) dep[k] = payload[k];
    await dep.save();
    return new Result(StatusEnum.OK, 200, dep);
  }

  async remove(id) {
    return await sequelize.transaction(async (tx) => {
      const dep = await Departure.findByPk(+id, { transaction: tx });
      if (!dep) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]);

      const its = await Itinerary.findAll({ where: { departureId: +id }, transaction: tx });
      const itIds = its.map(i => i.id);
      if (itIds.length) {
        await ItineraryActivity.destroy({ where: { itineraryId: { [Op.in]: itIds } }, transaction: tx });
        await Itinerary.destroy({ where: { id: { [Op.in]: itIds } }, transaction: tx });
      }
      await dep.destroy({ transaction: tx });
      return new Result(StatusEnum.OK, 200, { deleted: +id });
    });
  }
}
module.exports = new DeparturesService();
