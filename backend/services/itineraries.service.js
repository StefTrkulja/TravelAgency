'use strict';
const { Result, StatusEnum } = require('../utils/result');
const { sequelize, Departure, TravelArrangement, Itinerary, ItineraryActivity } = require('../models');

/** Dozvoljene faze za editovanje planova po danima */
const EDITABLE_STATUSES = ['DRAFT', 'READY', 'CHANGES_REQUESTED'];

/** Provera vlasništva i statusa aranžmana */
function canEditArrangement(arrangement, user) {
  if (!arrangement) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role !== 'OPERATOR') return false;
  if (arrangement.createdByUsername !== user.username) return false;
  if (!EDITABLE_STATUSES.includes(arrangement.status)) return false;
  return true;
}

async function loadDepartureWithArrangement(departureId, tx) {
  let dep = await Departure.findByPk(departureId, {
    include: [{ model: TravelArrangement, as: 'arrangement' }],
    transaction: tx
  });
  if (!dep) return { dep: null, arr: null };

  let arr = dep.arrangement;
  if (!arr && dep.arrangementId) {
    arr = await TravelArrangement.findByPk(dep.arrangementId, { transaction: tx });
  }
  return { dep, arr };
}

class ItinerariesService {
  /** Kreiraj stavku itinerera za dati polazak */
  async create(user, departureId, payload) {
    return await sequelize.transaction(async (tx) => {
      const { dep, arr } = await loadDepartureWithArrangement(departureId, tx);
      if (!dep)   return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]);
      if (!canEditArrangement(arr, user)) {
        return new Result(StatusEnum.FAIL, 403, null, [{ message: 'Forbidden' }]);
      }

      if (payload.startTime && payload.endTime && payload.startTime >= payload.endTime) {
        return new Result(StatusEnum.FAIL, 400, null, [{ message: 'startTime must be before endTime' }]);
      }
      if (payload.date && (dep.startDate || dep.endDate)) {
        const d = new Date(payload.date);
        if (dep.startDate && d < new Date(dep.startDate)) {
          return new Result(StatusEnum.FAIL, 400, null, [{ message: 'date is before departure startDate' }]);
        }
        if (dep.endDate && d > new Date(dep.endDate)) {
          return new Result(StatusEnum.FAIL, 400, null, [{ message: 'date is after departure endDate' }]);
        }
      }

      const it = await Itinerary.create({
        departureId,
        dayNo: payload.dayNo,
        title: payload.title,
        description: payload.description,
        date: payload.date,
        startTime: payload.startTime,
        endTime: payload.endTime,
        location: payload.location
      }, { transaction: tx });

      return new Result(StatusEnum.OK, 201, it);
    });
  }

  async get(id) {
    const it = await Itinerary.findByPk(id, {
      include: [{ model: ItineraryActivity, as: 'activities' }]
    });
    if (!it) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Itinerary not found' }]);
    return new Result(StatusEnum.OK, 200, it);
  }

  async list(departureId) {
    const items = await Itinerary.findAll({
      where: { departureId },
      include: [{ model: ItineraryActivity, as: 'activities' }],
      order: [['dayNo', 'ASC'], ['startTime', 'ASC']]
    });
    return new Result(StatusEnum.OK, 200, items);
  }

  async update(user, id, payload) {
    return await sequelize.transaction(async (tx) => {
      const it = await Itinerary.findByPk(id, { transaction: tx });
      if (!it) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Itinerary not found' }]);

      const { dep, arr } = await loadDepartureWithArrangement(it.departureId, tx);
      if (!dep) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]);
      if (!canEditArrangement(arr, user)) {
        return new Result(StatusEnum.FAIL, 403, null, [{ message: 'Forbidden' }]);
      }

      if (payload.startTime && payload.endTime && payload.startTime >= payload.endTime) {
        return new Result(StatusEnum.FAIL, 400, null, [{ message: 'startTime must be before endTime' }]);
      }
      if (payload.date && (dep.startDate || dep.endDate)) {
        const d = new Date(payload.date);
        if (dep.startDate && d < new Date(dep.startDate)) {
          return new Result(StatusEnum.FAIL, 400, null, [{ message: 'date is before departure startDate' }]);
        }
        if (dep.endDate && d > new Date(dep.endDate)) {
          return new Result(StatusEnum.FAIL, 400, null, [{ message: 'date is after departure endDate' }]);
        }
      }

      const updatable = ['dayNo', 'title', 'description', 'date', 'startTime', 'endTime', 'location'];
      for (const k of updatable) if (payload[k] !== undefined) it[k] = payload[k];
      await it.save({ transaction: tx });

      return new Result(StatusEnum.OK, 200, it);
    });
  }

  async remove(user, id) {
    return await sequelize.transaction(async (tx) => {
      const it = await Itinerary.findByPk(id, { transaction: tx });
      if (!it) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Itinerary not found' }]);

      const { dep, arr } = await loadDepartureWithArrangement(it.departureId, tx);
      if (!dep) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Departure not found' }]);
      if (!canEditArrangement(arr, user)) {
        return new Result(StatusEnum.FAIL, 403, null, [{ message: 'Forbidden' }]);
      }

      await ItineraryActivity.destroy({ where: { itineraryId: id }, transaction: tx });
      await it.destroy({ transaction: tx });

      return new Result(StatusEnum.OK, 200, { deleted: id });
    });
  }
}

module.exports = new ItinerariesService();
