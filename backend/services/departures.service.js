const { Result, StatusEnum } = require('../utils/result');
const { TravelArrangement, Departure, Itinerary, ItineraryActivity } = require('../models');
const sequelize = require('../models').sequelize;
const { Op } = require('sequelize');

class DeparturesService {
  async create(arrangementId, payload) {
    const a = await TravelArrangement.findByPk(arrangementId);
    if (!a) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Arrangement not found' }]);

    const dep = await Departure.create({
      arrangementId,
      startDate: payload.startDate,
      endDate: payload.endDate ?? (a.type === 'DAY_TRIP' ? payload.startDate : null),
      capacityTotal: payload.capacityTotal ?? 0,
      status: payload.status || 'SCHEDULED'
    });
    return new Result(StatusEnum.OK, 201, dep);
  }

  async get(id) {
    const dep = await Departure.findByPk(id, { include: [{ model: Itinerary, as: 'itinerary' }] });
    if (!dep) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]);
    return new Result(StatusEnum.OK, 200, dep);
  }

  async list(arrangementId) {
    const deps = await Departure.findAll({ where: { arrangementId }, order: [['startDate','ASC']] });
    return new Result(StatusEnum.OK, 200, deps);
  }

  async update(id, payload) {
    const dep = await Departure.findByPk(id);
    if (!dep) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]);

    const updatable = ['startDate','endDate','capacityTotal','status'];
    for (const k of updatable) if (payload[k] !== undefined) dep[k] = payload[k];
    await dep.save();
    return new Result(StatusEnum.OK, 200, dep);
  }

  async remove(id) {
    const tx = await sequelize.transaction();
    try {
      const dep = await Departure.findByPk(id, { transaction: tx });
      if (!dep) { await tx.rollback(); return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]); }

      const its = await Itinerary.findAll({ where: { departureId: id }, transaction: tx });
      const itIds = its.map(i => i.id);
      if (itIds.length) {
        await ItineraryActivity.destroy({ where: { itineraryId: { [Op.in]: itIds } }, transaction: tx });
        await Itinerary.destroy({ where: { id: { [Op.in]: itIds } }, transaction: tx });
      }
      await dep.destroy({ transaction: tx });
      await tx.commit();
      return new Result(StatusEnum.OK, 200, { deleted: id });
    } catch (e) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 500, null, [{ message: e.message }]);
    }
  }
}

module.exports = new DeparturesService();
