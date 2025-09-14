const { ComplaintStatusHistory, Status, User } = require('../models');
const { Result, StatusEnum } = require('../utils/result');
const { parseSequelizeErrors } = require('../utils/errorParser');

const {StatusService} = require('./statusService');

class ComplaintStatusHistoryService {

  async getById(id, { transaction } = {}) {
    try {
      const row = await ComplaintStatusHistory.findByPk(id, { transaction });
      if (!row) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'History entry not found' }]);
      return new Result(StatusEnum.OK, 200, row);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  async listByComplaintId(complaintId, { includeDetails = false, transaction } = {}) {
    try {
      const include = includeDetails
        ? [
            { model: Status, as: 'fromStatus', attributes: ['id', 'code', 'name'] },
            { model: Status, as: 'toStatus',   attributes: ['id', 'code', 'name'] },
            { model: User,   as: 'changedBy',  attributes: ['username', 'name', 'surname'] },
          ]
        : [];

      const rows = await ComplaintStatusHistory.findAll({
        where: { complaintId },
        include,
        order: [['changedAt', 'ASC']],
        transaction,
      });

      return new Result(StatusEnum.OK, 200, rows);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }


  async getLatestByComplaintId(complaintId, { includeDetails = false, transaction } = {}) {
    try {
      const include = includeDetails
        ? [
            { model: Status, as: 'fromStatus', attributes: ['id', 'code', 'name'] },
            { model: Status, as: 'toStatus',   attributes: ['id', 'code', 'name'] },
            { model: User,   as: 'changedBy',  attributes: ['username', 'name', 'surname'] },
          ]
        : [];

      const row = await ComplaintStatusHistory.findOne({
        where: { complaintId },
        include,
        order: [['changedAt', 'DESC']],
        transaction,
      });

      return row
        ? new Result(StatusEnum.OK, 200, row)
        : new Result(StatusEnum.OK, 200, null); // nema istorije
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  async createEntry(
    { complaintId, fromStatusId = null, toStatusId, changedAt = new Date(), changedByUsername, note = null },
    { transaction } = {}
  ) {
    try {
      const row = await ComplaintStatusHistory.create(
        { complaintId, fromStatusId, toStatusId, changedAt, changedByUsername, note },
        { transaction }
      );
      return new Result(StatusEnum.OK, 201, row);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }


  async bulkCreate(entries = [], { transaction } = {}) {
    try {
      if (!Array.isArray(entries) || entries.length === 0) {
        return new Result(StatusEnum.OK, 201, []);
      }
      const rows = await ComplaintStatusHistory.bulkCreate(entries, { transaction });
      return new Result(StatusEnum.OK, 201, rows);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }


  async deleteById(id, { transaction } = {}) {
    try {
      const row = await ComplaintStatusHistory.findByPk(id, { transaction });
      if (!row) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'History entry not found' }]);
      await row.destroy({ transaction });
      return new Result(StatusEnum.OK, 200, null);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  async deleteAllForComplaint(complaintId, { transaction } = {}) {
    try {
      await ComplaintStatusHistory.destroy({ where: { complaintId }, transaction });
      return new Result(StatusEnum.OK, 200, null);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }
}

module.exports = new ComplaintStatusHistoryService();
