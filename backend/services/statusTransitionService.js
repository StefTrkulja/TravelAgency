// services/statusTransitionService.js
const { StatusTransition } = require('../models');
const { Result, StatusEnum } = require('../utils/result');
const { parseSequelizeErrors } = require('../utils/errorParser');
class StatusTransitionService {
  /** Da li je tranzicija dozvoljena? */
  async isAllowed(fromStatusId, toStatusId, { transaction } = {}) {
    try {
      const row = await StatusTransition.findOne({
        where: { fromStatusId, toStatusId },
        transaction,
      });
      return new Result(StatusEnum.OK, 200, { allowed: !!row });
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  /** Vrati sve dozvoljene naredne statuse za dati fromStatusId */
  async getAllowedNext(fromStatusId, { transaction } = {}) {
    try {
      console.log("Ulazim u servis za tranziciju sa fromStatusId: ", fromStatusId);
      const rows = await StatusTransition.findAll({
        where: { fromStatusId },
        transaction,
      });
      console.log("Nadjene tranzicije: ", rows);  
      return new Result(StatusEnum.OK, 200, rows);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  /** (opciono) Dodaj novu tranziciju */
  async create(fromStatusId, toStatusId, { transaction } = {}) {
    try {
      const created = await StatusTransition.create({ fromStatusId, toStatusId }, { transaction });
      return new Result(StatusEnum.OK, 201, created);
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

  /** (opciono) Obriši tranziciju */
  async remove(fromStatusId, toStatusId, { transaction } = {}) {
    try {
      const cnt = await StatusTransition.destroy({
        where: { fromStatusId, toStatusId },
        transaction,
      });
      return new Result(StatusEnum.OK, 200, { removed: cnt });
    } catch (e) {
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }
}

module.exports = new StatusTransitionService();
