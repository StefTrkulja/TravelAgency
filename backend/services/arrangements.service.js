const { Result, StatusEnum } = require('../utils/result');
const {
  TravelArrangement, Destination, ArrangementVersion,
  Departure, Itinerary, ItineraryActivity,
  SupplierOffer, OfferSelection, ApprovalRequest 
} = require('../models');
const sequelize = require('../models').sequelize;
const { Op } = require('sequelize');

class ArrangementsService {
  async create(payload, operatorUsername) {
    const tx = await sequelize.transaction();
    try {
      const dest = await Destination.findByPk(payload.destinationId, { transaction: tx });
      if (!dest) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Destination not found' }]);

      const a = await TravelArrangement.create({
        destinationId: payload.destinationId,
        createdByUsername: operatorUsername,
        title: payload.title,
        summary: payload.summary,
        basePricePerPerson: payload.basePricePerPerson,
        transportType: payload.transportType,
        accommodationType: payload.accommodationType,
        type: payload.type,
        status: 'DRAFT'
      }, { transaction: tx });

      await ArrangementVersion.create({
        arrangementId: a.id, versionNo: 1, changeNote: 'Initial'
      }, { transaction: tx });

      if (payload.startDate) {
        await Departure.create({
          arrangementId: a.id,
          startDate: payload.startDate,
          endDate: (payload.type === 'DAY_TRIP') ? payload.startDate : (payload.endDate || null),
          capacityTotal: payload.capacityTotal ?? 0,
          status: 'SCHEDULED'
        }, { transaction: tx });
      }

      await tx.commit();
      return new Result(StatusEnum.OK, 201, a);
    } catch (e) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 500, null, [{ message: e.message }]);
    }
  }

  async getById(id, withRelations = true) {
    const include = withRelations ? [
      { model: Destination, as: 'destination' },
      { model: ArrangementVersion, as: 'versions' },
      { model: Departure, as: 'departures' },
      { model: SupplierOffer, as: 'offers' },
      { model: OfferSelection, as: 'selection' },
      { model: ApprovalRequest, as: 'approvals' }
    ] : [];
    const a = await TravelArrangement.findByPk(id, { include });
    if (!a) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Arrangement not found' }]);
    return new Result(StatusEnum.OK, 200, a);
  }
 async list(query = {}) {
    const {
      status, // može biti "DRAFT" ili "DRAFT,PENDING"
      type, destinationId, createdByUsername, search,
      page = 1, size = 10, sort = 'createdAt', order = 'DESC'
    } = query;

    const where = {};
    // ➜ podrška za više statusa
    if (status) {
      const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
      where.status = statuses.length > 1 ? { [Op.in]: statuses } : statuses[0];
    }

    if (type) where.type = type;
    if (destinationId) where.destinationId = destinationId;
    if (createdByUsername) where.createdByUsername = createdByUsername;
    if (search) where.title = { [Op.iLike]: `%${search}%` };

    const limit = Math.min(Number(size) || 10, 100);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const { rows, count } = await TravelArrangement.findAndCountAll({
      where,
      order: [[sort, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
      limit,
      offset,
      include: [{ model: Destination, as: 'destination' }]
    });

    return new Result(StatusEnum.OK, 200, { items: rows, page: Number(page)||1, size: limit, total: count });
  }

  // ➜ potpuno odvojeno grupisanje po statusima
  async listGrouped() {
    const [draft, pending, active] = await Promise.all([
      TravelArrangement.findAll({
        where: { status: 'DRAFT' },
        include: [{ model: Destination, as: 'destination' }],
        order: [['createdAt', 'DESC']]
      }),
      TravelArrangement.findAll({
        where: { status: 'PENDING' },
        include: [{ model: Destination, as: 'destination' }],
        order: [['createdAt', 'DESC']]
      }),
      TravelArrangement.findAll({
        where: { status: 'ACTIVE' },
        include: [{ model: Destination, as: 'destination' }],
        order: [['createdAt', 'DESC']]
      }),
    ]);

    return new Result(StatusEnum.OK, 200, { draft, pending, active });
  }

  async update(id, payload, operatorUsername) {
    const tx = await sequelize.transaction();
    try {
      const a = await TravelArrangement.findByPk(id, { transaction: tx });
      if (!a) { await tx.rollback(); return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Arrangement not found' }]); }

      const changed = [];
      const updatable = [
        'title','summary','basePricePerPerson','transportType','accommodationType','type','status','destinationId'
      ];
      for (const k of updatable) {
        if (payload[k] !== undefined && payload[k] !== a[k]) {
          changed.push(`${k}: ${a[k]} -> ${payload[k]}`);
          a[k] = payload[k];
        }
      }
      await a.save({ transaction: tx });

      const last = await ArrangementVersion.findOne({
        where: { arrangementId: a.id }, order: [['versionNo','DESC']], transaction: tx
      });
      await ArrangementVersion.create({
        arrangementId: a.id,
        versionNo: (last ? last.versionNo + 1 : 1),
        changeNote: payload.changeNote || (changed.length ? changed.join('; ') : 'No changes note')
      }, { transaction: tx });

      await tx.commit();
      return new Result(StatusEnum.OK, 200, a);
    } catch (e) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 500, null, [{ message: e.message }]);
    }
  }

  async remove(id) {
    const tx = await sequelize.transaction();
    try {
      const a = await TravelArrangement.findByPk(id, { transaction: tx });
      if (!a) { await tx.rollback(); return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Arrangement not found' }]); }

      // kaskade ručno
      const deps = await Departure.findAll({ where: { arrangementId: id }, transaction: tx });
      const depIds = deps.map(d => d.id);
      if (depIds.length) {
        const its = await Itinerary.findAll({ where: { departureId: { [Op.in]: depIds } }, transaction: tx });
        const itIds = its.map(i => i.id);
        if (itIds.length) {
          await ItineraryActivity.destroy({ where: { itineraryId: { [Op.in]: itIds } }, transaction: tx });
          await Itinerary.destroy({ where: { id: { [Op.in]: itIds } }, transaction: tx });
        }
        await Departure.destroy({ where: { id: { [Op.in]: depIds } }, transaction: tx });
      }

      await OfferSelection.destroy({ where: { arrangementId: id }, transaction: tx });
      await SupplierOffer.destroy({ where: { arrangementId: id }, transaction: tx });
      await ApprovalRequest.destroy({ where: { arrangementId: id }, transaction: tx });
      await ArrangementVersion.destroy({ where: { arrangementId: id }, transaction: tx });

      await a.destroy({ transaction: tx });
      await tx.commit();
      return new Result(StatusEnum.OK, 200, { deleted: id });
    } catch (e) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 500, null, [{ message: e.message }]);
    }
  }
}

module.exports = new ArrangementsService();
