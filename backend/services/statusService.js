// services/statusService.js
const { Status } = require('../models');
const { Result, StatusEnum } = require('../utils/result');
const { parseSequelizeErrors } = require('../utils/errorParser');

/**
 * Jedan servis = jedan model (Status).
 * Sve metode vraćaju Result<Status | Status[] | null>.
 * Svaka metoda prima opcioni { transaction } da može da učestvuje u već postojećoj TX.
 */
class StatusService {
  /* ---------- READ ---------- */

  async getStatusById(id, { transaction } = {}) {
    try {
      const row = await Status.findByPk(id, { transaction });
      if (!row) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Status not found' }]);
      return new Result(StatusEnum.OK, 200, row);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  async getStatusByCode(code, { transaction } = {}) {
    try {

      const row = await Status.findOne({ where: { code }, transaction });
      if (!row) return new Result(StatusEnum.FAIL, 404, null, [{ message: `Status '${code}' not found` }]);

			return new Result(StatusEnum.OK, 200, row);
    } catch (e) {
      
			return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  async getAllStatuses({ transaction } = {}) {
    try {
      const rows = await Status.findAll({ transaction });
      return new Result(StatusEnum.OK, 200, rows);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  async getManyByIds(ids = [], { transaction } = {}) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return new Result(StatusEnum.OK, 200, []);
      }
      const rows = await Status.findAll({ where: { id: ids }, transaction });
      return new Result(StatusEnum.OK, 200, rows);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  /* ---------- CREATE / UPDATE / DELETE ---------- */

  async createStatus(payload, { transaction } = {}) {
    try {
      const created = await Status.create(payload, { transaction });
      return new Result(StatusEnum.OK, 201, created);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  async updateStatus(id, patch, { transaction } = {}) {
    try {
      const row = await Status.findByPk(id, { transaction });
      if (!row) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Status not found' }]);

      await row.update(patch, { transaction });
      return new Result(StatusEnum.OK, 200, row);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  async deleteStatus(id, { transaction } = {}) {
    try {
      const row = await Status.findByPk(id, { transaction });
      if (!row) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Status not found' }]);

      await row.destroy({ transaction });
      return new Result(StatusEnum.OK, 200, null);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  /* ---------- HELPERS ZA ČESTE CASE-ove ---------- */

  // Ako želiš “inicijalni” status po dogovoru (npr. PENDING)
  async getInitialStatus({ transaction } = {}) {
    return this.getStatusByCode('PENDING', { transaction });
  }

  // Shortcut koji često koristimo pri tranziciji ka IN_PROGRESS
  async getInProgressStatus({ transaction } = {}) {
    return this.getStatusByCode('IN_PROGRESS', { transaction });
  }
}

module.exports = new StatusService();
