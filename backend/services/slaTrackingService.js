const { sequelize, Complaint, SlaTracking, ComplaintStatusHistory, Status } = require('../models');
const { StatusEnum, Result } = require('../utils/result');
const { parseSequelizeErrors } = require('../utils/errorParser');



class SlaTrackingService {



  async getByComplaintId(complaintId, options = {}) {
    try {
      const sla = await SlaTracking.findByPk(complaintId, {
        transaction: options.transaction,
        lock: options.lock ? true : false,
      });
      if (!sla) {
        return new Result(StatusEnum.FAIL, 404, null, [{ message: 'SLA tracking not found' }]);
      }
      return new Result(StatusEnum.OK, 200, sla);
    }
    catch (err) {
      return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
    }
  }


  async createSLATracking(complaintId){
    try {
      const slaTracking = await SlaTracking.create({ id: complaintId }); 

      return new Result(StatusEnum.SUCCESS, slaTracking);
    } catch (error) {
      const parsedErrors = parseSequelizeErrors(error);
      return new Result(StatusEnum.ERROR, null, parsedErrors);
    }
  }

 async ensureTrackingRow(complaintId, options = {}) {
    const { transaction: tx } = options;
    let row = await SlaTracking.findByPk(complaintId, { transaction: tx });
    if (!row) row = await SlaTracking.create({ id: complaintId }, { transaction: tx });
    return row;
  }
async snapshotOnAccept({ complaint, params, changedAt = new Date(), transaction: tx }) {
    try {
      const sla = await this.ensureTrackingRow(complaint.id, { transaction: tx });

      sla.appliedResponseMins   = params.targetResponseMins;
      sla.appliedResolutionMins = params.targetResolutionMins;

      // First response SLA meri od trenutka kreiranja žalbe:
      sla.responseDueAt = new Date(
        new Date(complaint.createdAt).getTime() + params.targetResponseMins * 60 * 1000
      );

      // očisti at-risk markere pri accept-u
      sla.atRiskSince = null;
      sla.atRiskType = null;

      await sla.save({ transaction: tx });

      return new Result(StatusEnum.OK, 200, {
        targetResponseMins: params.targetResponseMins,
        targetResolutionMins: params.targetResolutionMins,
        responseDueAt: sla.responseDueAt,
      });
    } catch (err) {
      return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
    }
  }
async onStartWork({ complaint, changedAt = new Date(), transaction: tx }) {
  try {
    const sla = await SlaTracking.findByPk(complaint.id, { transaction: tx, lock: true });
    if (!sla) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'SLA row not found' }]);

    const changed = new Date(changedAt);
    const created = complaint.createdAt ? new Date(complaint.createdAt) : null;

    // First response
    if (!sla.firstResponseAt) {
      sla.firstResponseAt = changed;

      const due = sla.responseDueAt ? new Date(sla.responseDueAt) : null;
      if (due && changed.getTime() > due.getTime()) {
        sla.responseBreached = true;
        sla.breachReason = sla.breachReason || 'first_response_late';
        sla.breachesCount = (sla.breachesCount || 0) + 1;
      }
      sla.firstResponseMs = created ? Math.max(0, changed.getTime() - created.getTime()) : null;
      sla.responseBreachedChecked = true;
    }

    // Resolution start / due
    if (!sla.resolutionStartedAt) {
      sla.resolutionStartedAt = changed;
      const mins = Number(sla.appliedResolutionMins || 0);
      const paused = Number(sla.totalPausedMs || 0);
      // U startu je paused tipično 0, ali formula je robusna
      sla.resolutionDueAt = new Date(changed.getTime() + mins * 60 * 1000 + paused);
    }

    sla.atRiskSince = null; 
    sla.atRiskType = null;

    await sla.save({ transaction: tx });
    return new Result(StatusEnum.OK, 200, {
      firstResponseAt: sla.firstResponseAt,
      resolutionStartedAt: sla.resolutionStartedAt,
      resolutionDueAt: sla.resolutionDueAt
    });
  } catch (err) {
    return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
  }
}

async onPause({ complaintId, changedAt = new Date(), transaction: tx }) {
  try {
    const sla = await SlaTracking.findByPk(complaintId, { transaction: tx, lock: true });
    if (!sla) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'SLA row not found' }]);

    if (!sla.pauseStartedAt) {
      sla.pauseStartedAt = new Date(changedAt);
      sla.lastCheckedAt = sla.pauseStartedAt;
      await sla.save({ transaction: tx });
    }
    return new Result(StatusEnum.OK, 200, { pauseStartedAt: sla.pauseStartedAt });
  } catch (err) {
    return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
  }
}

async onResume({ complaintId, changedAt = new Date(), transaction: tx }) {
  try {
    const sla = await SlaTracking.findByPk(complaintId, { transaction: tx, lock: true });
    if (!sla) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'SLA row not found' }]);

    if (sla.pauseStartedAt) {
      const started = new Date(sla.pauseStartedAt).getTime();
      const resumed = new Date(changedAt).getTime();
      if (Number.isFinite(started) && Number.isFinite(resumed) && resumed > started) {
        const delta = resumed - started;
        sla.totalPausedMs = Number(sla.totalPausedMs || 0) + delta;
        sla.pauseStartedAt = null;

        // KLJUČ: pomeri due za delta
        if (sla.resolutionDueAt) {
          const dueMs = new Date(sla.resolutionDueAt).getTime();
          sla.resolutionDueAt = new Date(dueMs + delta);
        }
      } else {
        // ako su datumi čudni, resetuj pauzu da ne “truju” stanje
        sla.pauseStartedAt = null;
      }
    }

    sla.lastCheckedAt = new Date(changedAt);
    await sla.save({ transaction: tx });
    return new Result(StatusEnum.OK, 200, { 
      totalPausedMs: sla.totalPausedMs, 
      resolutionDueAt: sla.resolutionDueAt 
    });
  } catch (err) {
    return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
  }
}

async onClose({ complaintId, changedAt = new Date(), transaction: tx }) {
  try {
    const sla = await SlaTracking.findByPk(complaintId, { transaction: tx, lock: true });
    if (!sla) return new Result(StatusEnum.FAIL, 404, null, [{ message: 'SLA row not found' }]);

    const closed = new Date(changedAt);

    // Ako slučajno zatvaramo dok je pauza aktivna — zatvori pauzu pa pomeri due
    if (sla.pauseStartedAt) {
      const started = new Date(sla.pauseStartedAt).getTime();
      const resumed = closed.getTime();
      if (Number.isFinite(started) && resumed > started) {
        const delta = resumed - started;
        sla.totalPausedMs = Number(sla.totalPausedMs || 0) + delta;
        sla.pauseStartedAt = null;
        if (sla.resolutionDueAt) {
          const dueMs = new Date(sla.resolutionDueAt).getTime();
          sla.resolutionDueAt = new Date(dueMs + delta);
        }
      } else {
        sla.pauseStartedAt = null;
      }
    }

    sla.resolvedAt = closed;

    // Efektivno vreme rešavanja
    if (sla.resolutionStartedAt) {
      const started = new Date(sla.resolutionStartedAt).getTime();
      const paused = Number(sla.totalPausedMs || 0);
      sla.effectiveResolutionMs = Math.max(0, closed.getTime() - started - paused);
    }

    // Breach: poredi sa pomerenim due
    if (sla.resolutionDueAt) {
      const due = new Date(sla.resolutionDueAt).getTime();
      if (closed.getTime() > due) {
        sla.resolutionBreached = true;
        sla.breachReason = sla.breachReason || 'resolution_late';
        sla.breachesCount = (sla.breachesCount || 0) + 1;
      }
      sla.resolutionBreachedChecked = true;
    }

    sla.atRiskSince = null; sla.atRiskType = null;
    sla.lastCheckedAt = closed;

    await sla.save({ transaction: tx });

    return new Result(StatusEnum.OK, 200, {
      resolvedAt: sla.resolvedAt,
      resolutionBreached: !!sla.resolutionBreached,
      breachesCount: sla.breachesCount,
      effectiveResolutionMs: sla.effectiveResolutionMs,
      resolutionDueAt: sla.resolutionDueAt
    });
  } catch (err) {
    return new Result(StatusEnum.FAIL, 500, null, [{ message: err.message }]);
  }
}

}module.exports = new SlaTrackingService();



