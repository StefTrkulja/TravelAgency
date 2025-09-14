const {Complaint} = require('../models');
const { StatusEnum, Result} = require('../utils/result');
const { body, param } = require('express-validator');
const jwtParser = require('../utils/jwtParser');
const {parseSequelizeErrors} = require('../utils/errorParser');	
const sequelize = require('../models/index').sequelize;
const StatusService = require('../services/statusService');
const ComplaintMessageService = require('../services/complaintMessageService');
const { Op } = require('sequelize');
const AttachmentService = require('../services/attachmentService');
const ReservationService = require('../services/reservationService');
const UserService = require('../services/userService');
const StatusTransitionService = require('../services/statusTransitionService');
const ComplaintStatusHistoryService = require('../services/complaintStatusHistoryService');
const SlaTrackingService = require('../services/slaTrackingService');
class ComplaintService {

	async findComplaintsByUsername(username) {
		const complaints = await Complaint.findAll({
			where: { createdByUsername: username }});


			const statuses = await Promise.all(complaints.map(c => StatusService.getStatusById(c.statusId)));
			complaints.forEach((c, index) => {
				if (statuses[index].status === StatusEnum.OK) {
					c.dataValues.status = statuses[index].data;
				} else {
					c.dataValues.status = null;
				}
			});
	
		return new Result(StatusEnum.OK, 200, complaints);
	}
	async createComplaint(complaintData) {
		try{
			const complaint = await Complaint.create(complaintData);


			return new Result(StatusEnum.OK, 201, complaint);
		}catch (exception) {
			const errors = parseSequelizeErrors(exception);
			return new Result(StatusEnum.FAIL, 500, null, errors);
		}
	}

async assignToOperator(complaintId, assigneeUsername) {
    const tx = await sequelize.transaction();
    try {
      // 0) Validacija ulaza
      if (!complaintId || !assigneeUsername) {
        await tx.rollback();
        return new Result(StatusEnum.FAIL, 400, null, [{ message: 'complaintId i assigneeUsername su obavezni' }]);
      }

      // 1) Učitaj complaint i zaključa ga u istoj transakciji (FOR UPDATE)
      const complaint = await Complaint.findByPk(complaintId, {
        transaction: tx,
        lock: true,                 // ← jednostavno i portabilno; izbegavaj transaction.LOCK.UPDATE
        skipLocked: false,
      });

      if (!complaint) {
        await tx.rollback();
        return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Complaint not found' }]);
      }

      // 2) from/to statusi
      const fromStatusRes = await StatusService.getStatusById(complaint.statusId, { transaction: tx });
      if (fromStatusRes.status !== StatusEnum.OK) {
        await tx.rollback();
        return fromStatusRes;
      }
      const fromStatus = fromStatusRes.data; // { id, code, name, ... }
			const toStatusRes = await StatusService.getStatusByCode('IN_PROGRESS', { transaction: tx });
      if (toStatusRes.status !== StatusEnum.OK || !toStatusRes.data) {
        await tx.rollback();
        return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Target status IN_PROGRESS not found' }]);
      }
      const toStatus = toStatusRes.data;
      // 3) validacija tranzicije — dozvoljeno?


			const allowedRes = await StatusTransitionService.isAllowed(fromStatus.id, toStatus.id, { transaction: tx });
			if (allowedRes.status !== StatusEnum.OK || !allowedRes.data?.allowed) {
				await tx.rollback();
				return new Result(StatusEnum.FAIL, 400, null, [{
					message: `Transition ${fromStatus.code} -> ${toStatus.code} is not allowed`,
				}]);
				}	
				      // 4) update complaint
      complaint.statusId = toStatus.id;
      complaint.assigneeUsername = assigneeUsername;
      await complaint.save({ transaction: tx });
      // 5) history
      const changedAt = new Date();
      const history = await ComplaintStatusHistoryService.createEntry({
        complaintId,
        fromStatusId: fromStatus?.id || null,  // prvi prelaz može imati null fromStatusId
        toStatusId: toStatus.id,
        changedAt,
        changedByUsername: assigneeUsername,
        note: 'Assigned to operator',
      }, { transaction: tx });
			
      // 6) SLA tracking u istoj transakciji (isti timestamp)
      const slaRes = await SlaTrackingService.onStatusTransition({
        complaintId,
        fromCode: fromStatus.code, // npr. 'PENDING'
        toCode: toStatus.code,     // 'IN_PROGRESS'
        changedAt,
      }, { transaction: tx });
      if (slaRes.status !== StatusEnum.OK) {

        await tx.rollback();
        return slaRes; // već je Result sa kodom i porukom
      }
      await tx.commit();
      return new Result(StatusEnum.OK, 200, {
        complaint,
        history,
        sla: slaRes.data,
      });

    } catch (e) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
    }
  }

	
	async findComplaintByIdForUser(complaintId, username) {
		const complaint = await Complaint.findByPk(complaintId);
		if (!complaint) {
			return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Complaint not found' }]);
		}
		if (complaint.createdByUsername !== username) {
			return new Result(StatusEnum.FAIL, 403, null, [{ message: 'Forbidden' }]);
		}
		const statusResult = await StatusService.getStatusById(complaint.statusId);
		if (statusResult.status === StatusEnum.OK) {
			complaint.dataValues.status = statusResult.data;
		} else {
			complaint.dataValues.status = null;
		}

		const messages = await ComplaintMessageService.findMessagesByComplaintId(complaintId);
		if (messages.status === StatusEnum.OK) {
			complaint.dataValues.messages = messages.data;
		} else {
			complaint.dataValues.messages = [];
		}
		const attachments = await AttachmentService.findByComplaintId(complaintId);
		if (attachments.status === StatusEnum.OK) {
			complaint.dataValues.attachments = attachments.data;
		} else {
			complaint.dataValues.attachments = [];
		}	
		const reservationResult = await ReservationService.findReservationById(complaint.reservationId);
		if (reservationResult.status === StatusEnum.OK) {
			complaint.dataValues.reservation = reservationResult.data;
		} else {
			complaint.dataValues.reservation = null;
		}
		const userResult = await UserService.findByUsername(complaint.assigneeUsername);
		if (userResult.status === StatusEnum.OK) {
			complaint.dataValues.user = {
				username: userResult.data.username,
				name: userResult.data.name,
				surname: userResult.data.surname,	
			}
		}


		return new Result(StatusEnum.OK, 200, complaint);
	}


	// services/complaintService.js (dodaj metodu)
async transition(complaintId, toCode, actorUsername, note = null) {
  const tx = await sequelize.transaction();
  try {
    const complaint = await Complaint.findByPk(complaintId, { transaction: tx, lock: tx.LOCK.UPDATE });
    if (!complaint) { await tx.rollback(); return new Result(StatusEnum.FAIL, 404, null, [{ message:'Complaint not found' }]); }
    const fromStatusRes = await StatusService.getStatusById(complaint.statusId, { transaction: tx });
    if (fromStatusRes.status !== StatusEnum.OK) { await tx.rollback(); return fromStatusRes; }
    const fromStatus = fromStatusRes.data;
		console.log("To je: ", toCode);	
    const toStatusRes = await StatusService.getStatusByCode(toCode, { transaction: tx });

		console.log("Trenutni status: ", toStatusRes, ", trazeni status: ", toCode);	
    if (toStatusRes.status !== StatusEnum.OK) { await tx.rollback(); return toStatusRes; }
    const toStatus = toStatusRes.data;
    

    complaint.statusId = toStatus.id;

    await complaint.save({ transaction: tx });

    const changedAt = new Date();
    const histRes = await ComplaintStatusHistoryService.createEntry({
      complaintId, fromStatusId: fromStatus?.id ?? null, toStatusId: toStatus.id,
      changedAt, changedByUsername: actorUsername, note
    }, { transaction: tx });
    if (histRes.status !== StatusEnum.OK) { await tx.rollback(); return histRes; }

    // SLA
    // const slaRes = await SlaTrackingService.onStatusTransition({ complaintId, fromCode: fromStatus.code, toCode: toStatus.code, changedAt }, { transaction: tx });
    // if (slaRes.status !== StatusEnum.OK) { await tx.rollback(); return slaRes; }

    await tx.commit();
    return new Result(StatusEnum.OK, 200, { complaint, history: histRes.data /*, sla: slaRes.data */ });
  } catch (e) {
    await tx.rollback();
    return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
  }
}

	async findComplaintByIdForOperator(complaintId) {

		const complaint = await Complaint.findByPk(complaintId);
		if (!complaint) {
			return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Complaint not found' }]);
		}
	
		const statusResult = await StatusService.getStatusById(complaint.statusId);
		if (statusResult.status === StatusEnum.OK) {
			complaint.dataValues.status = statusResult.data;
		} else {
			complaint.dataValues.status = null;
		}
		const messages = await ComplaintMessageService.findMessagesByComplaintId(complaintId);
		if (messages.status === StatusEnum.OK) {
			complaint.dataValues.messages = messages.data;
		} else {
			complaint.dataValues.messages = [];
		}
		const attachments = await AttachmentService.findByComplaintId(complaintId);
		if (attachments.status === StatusEnum.OK) {
			complaint.dataValues.attachments = attachments.data;
		} else {
			complaint.dataValues.attachments = [];
		}	
		const reservationResult = await ReservationService.findReservationById(complaint.reservationId);
		if (reservationResult.status === StatusEnum.OK) {
			complaint.dataValues.reservation = reservationResult.data;
		} else {
			complaint.dataValues.reservation = null;
		}
		const userResult = await UserService.findByUsername(complaint.createdByUsername);
		if (userResult.status === StatusEnum.OK) {
			complaint.dataValues.user = {
				username: userResult.data.username,
				name: userResult.data.name,
				surname: userResult.data.surname,	
			}
	}
		return new Result(StatusEnum.OK, 200, complaint);
}

	async findComplaintById(complaintId) {
		const complaint = await Complaint.findByPk(complaintId);
		if (!complaint) {
			return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Complaint not found' }]);
		}
		const statusResult = await StatusService.getStatusById(complaint.statusId);
		if (statusResult.status === StatusEnum.OK) {
			complaint.dataValues.status = statusResult.data;
		} else {
			complaint.dataValues.status = null;
		}
		return new Result(StatusEnum.OK, 200, complaint);
	}

 async findForManager() {
		const complaints = await Complaint.findAll();
		const statuses = await Promise.all(complaints.map(c => StatusService.getStatusById(c.statusId)));
			complaints.forEach((c, index) => {
				if (statuses[index].status === StatusEnum.OK) {
					c.dataValues.status = statuses[index].data;
				} else {
					c.dataValues.status = null;
				}
			});
			const passengers = await Promise.all(complaints.map(c => UserService.findByUsername(c.createdByUsername)));
			complaints.forEach((c, index) => {
				if (passengers[index].status === StatusEnum.OK) {
					c.dataValues.user = passengers[index].data;
				} else {
					c.dataValues.user = null;
				}
			});
			const operators = await Promise.all(complaints.map(c => UserService.findByUsername(c.assigneeUsername)));
			complaints.forEach((c, index) => {
				if (operators[index].status === StatusEnum.OK) {
					c.dataValues.operator = operators[index].data;
				} else {
					c.dataValues.operator = null;
				}
			});

		return new Result(StatusEnum.OK, 200, complaints);
	}
	async findForOperator(operatorUsername) {
		const complaints = await Complaint.findAll({
			where: {
				[Op.or]: [
					{ assigneeUsername: operatorUsername },
					{ statusId: 1 } 
				]
			}
		});
		const statuses = await Promise.all(complaints.map(c => StatusService.getStatusById(c.statusId)));
			complaints.forEach((c, index) => {
				if (statuses[index].status === StatusEnum.OK) {
					c.dataValues.status = statuses[index].data;
				} else {
					c.dataValues.status = null;
				}
			});
		return new Result(StatusEnum.OK, 200, complaints);
		}
  async updatePriority(complaintId, newPriority) {
  try {
    const complaint = await Complaint.findByPk(complaintId);
    if (!complaint) {
      return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Complaint not found' }]);
    }

    // Normalizacija iz FE u DB ENUM
    const mapToEnum = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'urgent': 'CRITICAL', // ← FE "Urgent" == DB "CRITICAL"
      'critical': 'CRITICAL',
    };
    const norm = mapToEnum[String(newPriority).trim().toLowerCase()];

    const allowed = new Set(['LOW','MEDIUM','HIGH','CRITICAL']);
    if (!norm || !allowed.has(norm)) {
      return new Result(StatusEnum.FAIL, 400, null, [{ message: 'Invalid priority value' }]);
    }

    complaint.priority = norm;
    await complaint.save(); // sada neće pucati
    return new Result(StatusEnum.OK, 200, complaint);
  } catch (exception) {
    console.error('updatePriority error:', exception);
    const errors = parseSequelizeErrors(exception);
    return new Result(StatusEnum.FAIL, 500, null, errors);
  }
}

	}
module.exports = new ComplaintService();