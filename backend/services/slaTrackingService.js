// services/slaTrackingService.js
const { sequelize, Complaint, SlaTracking, ComplaintStatusHistory, Status } = require('../models');
const { StatusEnum, Result } = require('../utils/result');
const { parseSequelizeErrors } = require('../utils/errorParser');

// Zakucani targeti (uvek isti)
const RESPONSE_TARGET_MINS   = 240;   // 4h
const RESOLUTION_TARGET_MINS = 4320;  // 72h

const CODES = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_INFO: 'WAITING_INFO',
  ESCALATED: 'ESCALATED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
};

const addMinutes = (ts, mins) => new Date(new Date(ts).getTime() + mins * 60 * 1000);

// Helper: koristi postojeću TX ili otvori novu
async function _withTx(passedTx, fn) {
  if (passedTx) return fn(passedTx);
  return sequelize.transaction(async (tx) => fn(tx));
}

class SlaTrackingService {
  /* ================= PUBLIC API (ComplaintService stil) ================= */

  /** Vrati SLA red (PK = complaint.id) */
  async getByComplaintId(complaintId) {
    try {
      const row = await SlaTracking.findByPk(complaintId);
      return new Result(StatusEnum.OK, 200, row);
    } catch (exception) {
      console.error('[SLA:getByComplaintId] error:', exception);
      const errors = parseSequelizeErrors(exception);
      return new Result(StatusEnum.FAIL, 500, null, errors);
    }
  }

  /**
   * Pozovi POSLE svake promene statusa (u istoj TX u kojoj menjaš status & history).
   * fromCode/toCode su stringovi (npr. 'PENDING' -> 'IN_PROGRESS').
   */
  async onStatusTransition({ complaintId, fromCode, toCode, changedAt = new Date() }, { transaction } = {}) {
    try {
      const resData = await _withTx(transaction, async (tx) => {
        // 1) Postoje li complaint i SLA red?
        const complaint = await Complaint.findByPk(complaintId, { transaction: tx, lock: tx.LOCK.UPDATE });
        if (!complaint) {
          // Vrati shape koji ćemo posle pretvoriti u Result
          return { ok: false, code: 404, err: [{ message: 'Complaint not found' }] };
        }

        const sla = await this._ensureRowById(complaintId, tx);
        const t = new Date(changedAt);

        // 2) First Response due (jednom)
        this._ensureFirstResponseDue(complaint, sla);

        // 3) First Response stop — izlazak iz PENDING
        this._maybeStopFirstResponse(sla, fromCode, toCode, t);

        // 4) Resolution tok (start/pause/resume/stop)
        this._handleResolutionFlow(sla, fromCode, toCode, t);

        // 5) Breach check (first-response & resolution)
        this._checkBreaches(sla);

        // 6) Save
        sla.lastCheckedAt = new Date();
        await sla.save({ transaction: tx });

        return { ok: true, data: sla };
      });

      if (!resData.ok) {
        return new Result(StatusEnum.FAIL, resData.code || 500, null, resData.err || [{ message: 'SLA transition failed' }]);
      }
      return new Result(StatusEnum.OK, 200, resData.data);
    } catch (exception) {
      console.error('[SLA:onStatusTransition] error:', exception);
      const errors = parseSequelizeErrors(exception);
      return new Result(StatusEnum.FAIL, 500, null, errors);
    }
  }

  /**
   * (Opcionalno) Ako prva agentska poruka treba da stopira First Response,
   * pozovi ovo iz servisa za poruke (u istoj TX gde čuvaš poruku).
   */
  async onAgentFirstReply({ complaintId, repliedAt = new Date() }, { transaction } = {}) {
    try {
      const data = await _withTx(transaction, async (tx) => {
        const sla = await this._ensureRowById(complaintId, tx);
        if (!sla.firstResponseAt) {
          sla.firstResponseAt = new Date(repliedAt);
          this._checkBreaches(sla);
          sla.lastCheckedAt = new Date();
          await sla.save({ transaction: tx });
        }
        return sla;
      });

      return new Result(StatusEnum.OK, 200, data);
    } catch (exception) {
      console.error('[SLA:onAgentFirstReply] error:', exception);
      const errors = parseSequelizeErrors(exception);
      return new Result(StatusEnum.FAIL, 500, null, errors);
    }
  }

  /**
   * Backfill iz istorije — prođi kroz history i rekalkuliši SLA.
   * Korisno posle import-a ili promene pravila.
   */
  async recomputeFromHistory(complaintId) {
    try {
      await sequelize.transaction(async (tx) => {
        // 1) reset/create SLA reda
        const sla = await this._ensureRowById(complaintId, tx);
        this._resetRow(sla);
        await sla.save({ transaction: tx });

        // 2) istorija, hronološki
        const history = await ComplaintStatusHistory.findAll({
          where: { complaintId },
          include: [
            { model: Status, as: 'fromStatus', attributes: ['code'] },
            { model: Status, as: 'toStatus',   attributes: ['code'] },
          ],
          order: [['changedAt', 'ASC']],
          transaction: tx,
        });

        for (const h of history) {
          const fromCode = h.fromStatus?.code || CODES.PENDING; // fallback
          const toCode   = h.toStatus?.code;
          const r = await this.onStatusTransition(
            { complaintId, fromCode, toCode, changedAt: h.changedAt },
            { transaction: tx }
          );
          if (r.status !== StatusEnum.OK) {
            // prekini i izazovi rollback
            throw new Error(r?.errors?.[0]?.message || 'Failed to recompute SLA');
          }
        }
      });

      const fresh = await SlaTracking.findByPk(complaintId);
      return new Result(StatusEnum.OK, 200, fresh);
    } catch (exception) {
      console.error('[SLA:recomputeFromHistory] error:', exception);
      const errors = parseSequelizeErrors(exception);
      return new Result(StatusEnum.FAIL, 500, null, errors);
    }
  }

  /* ================= PRIVATE HELPERS ================= */

  async _ensureRowById(id, tx) {
    let row = await SlaTracking.findOne({ where: { id }, transaction: tx, lock: tx?.LOCK?.UPDATE });
    if (!row) row = await SlaTracking.create({ id }, { transaction: tx });
    // Inicijalizuj numerička polja ako su null
    if (row.totalPausedMs == null) row.totalPausedMs = 0;
    return row;
  }

  _resetRow(sla) {
    sla.responseDueAt = null;
    sla.firstResponseAt = null;
    sla.responseBreachedChecked = false;

    sla.resolutionStartedAt = null;
    sla.resolutionDueAt = null;
    sla.pauseStartedAt = null;
    sla.totalPausedMs = 0;
    sla.resolvedAt = null;
    sla.resolutionBreachedChecked = false;

    sla.breachesCount = 0;
    sla.lastCheckedAt = null;
  }

  _ensureFirstResponseDue(complaint, sla) {
    if (!sla.responseDueAt && complaint.createdAt) {
      sla.responseDueAt = addMinutes(complaint.createdAt, RESPONSE_TARGET_MINS);
    }
  }

  _maybeStopFirstResponse(sla, fromCode, toCode, t) {
    if (!sla.firstResponseAt && fromCode === CODES.PENDING && toCode !== CODES.PENDING) {
      sla.firstResponseAt = t;
    }
  }

  _handleResolutionFlow(sla, fromCode, toCode, t) {
    // start
    if (!sla.resolutionStartedAt && toCode === CODES.IN_PROGRESS) {
      sla.resolutionStartedAt = t;
      sla.resolutionDueAt = addMinutes(t, RESOLUTION_TARGET_MINS);
    }
    // pause
    if (toCode === CODES.WAITING_INFO && !sla.pauseStartedAt) {
      sla.pauseStartedAt = t;
    }
    // resume
    if (fromCode === CODES.WAITING_INFO && sla.pauseStartedAt) {
      const pausedMs = t - new Date(sla.pauseStartedAt);
      sla.totalPausedMs = (sla.totalPausedMs || 0) + Math.max(0, pausedMs);
      sla.pauseStartedAt = null;
    }
    // stop
    if (!sla.resolvedAt && (toCode === CODES.CLOSED || toCode === CODES.REJECTED)) {
      if (sla.pauseStartedAt) {
        const pausedMs = t - new Date(sla.pauseStartedAt);
        sla.totalPausedMs = (sla.totalPausedMs || 0) + Math.max(0, pausedMs);
        sla.pauseStartedAt = null;
      }
      sla.resolvedAt = t;
    }
  }

  _checkBreaches(sla) {
    let breaches = sla.breachesCount || 0;

    // First-response breach — jednom
    if (sla.firstResponseAt && sla.responseDueAt && !sla.responseBreachedChecked) {
      if (new Date(sla.firstResponseAt) > new Date(sla.responseDueAt)) breaches++;
      sla.responseBreachedChecked = true;
    }

    // Resolution breach — jednom, efektivno vreme = resolvedAt - totalPausedMs
    if (sla.resolvedAt && sla.resolutionDueAt && !sla.resolutionBreachedChecked) {
      const effectiveResolvedAt = new Date(new Date(sla.resolvedAt) - (sla.totalPausedMs || 0));
      if (effectiveResolvedAt > new Date(sla.resolutionDueAt)) breaches++;
      sla.resolutionBreachedChecked = true;
    }

    sla.breachesCount = breaches;
  }
}

module.exports = new SlaTrackingService();
