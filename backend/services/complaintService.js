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
const slaParameterService = require('../services/slaParameterService');
const slaTrackingService = require('../services/slaTrackingService');
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
			await SlaTrackingService.createSLATracking(complaint.id);
			return new Result(StatusEnum.OK, 201, complaint);
		}catch (exception) {
			const errors = parseSequelizeErrors(exception);
			return new Result(StatusEnum.FAIL, 500, null, errors);
		}
	}

async assignToOperator(complaintId, assigneeUsername, priority) {
  const tx = await sequelize.transaction();
  try {
    if (!complaintId || !assigneeUsername || !priority) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 400, null, [{ message: 'complaintId, assigneeUsername i priority su obavezni' }]);
    }

    // 1) Učitaj i zaključa complaint
    const complaint = await Complaint.findByPk(complaintId, { transaction: tx, lock: true });
    if (!complaint) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Complaint not found' }]);
    }

    // 2) Mora biti iz NEW -> PENDING
    const fromRes = await StatusService.getStatusById(complaint.statusId, { transaction: tx });
    if (fromRes.status !== StatusEnum.OK) { await tx.rollback(); return fromRes; }
    const from = fromRes.data;
    if (from.code !== 'NEW') {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 409, null, [{ message: `Accept dozvoljen samo iz NEW (trenutno: ${from.code})` }]);
    }

    const toRes = await StatusService.getStatusByCode('PENDING', { transaction: tx });
    if (toRes.status !== StatusEnum.OK || !toRes.data) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Target status PENDING not found' }]);
    }
    const to = toRes.data;

    const allowedRes = await StatusTransitionService.isAllowed(from.id, to.id, { transaction: tx });
    if (allowedRes.status !== StatusEnum.OK || !allowedRes.data?.allowed) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 400, null, [{ message: `Transition ${from.code} -> ${to.code} is not allowed` }]);
    }


    // 3) Dohvati aktivne SLA parametre za dati priority
    const slaParamRes = await slaParameterService.getActiveByPriority(priority, { transaction: tx });
    if (slaParamRes.status !== StatusEnum.OK) {
      await tx.rollback();
      return slaParamRes;
    }
    const params = slaParamRes.data;

    // 4) Updatuj complaint (zakucaj priority, assign, status)
    complaint.priority = String(priority).toUpperCase();
    complaint.assigneeUsername = assigneeUsername;
    complaint.acceptedAt = complaint.acceptedAt ?? new Date(); // opciono polje
    complaint.statusId = to.id;
    await complaint.save({ transaction: tx });

    // 5) History
    const changedAt = new Date();
    const history = await ComplaintStatusHistoryService.createEntry({
      complaintId,
      fromStatusId: from?.id || null,
      toStatusId: to.id,
      changedAt,
      changedByUsername: assigneeUsername,
      note: 'Accepted by operator',
    }, { transaction: tx });

    // 6) SLA snapshot preko servisa
    const snapshotRes = await slaTrackingService.snapshotOnAccept({
      complaint,
      params,
      changedAt,
      transaction: tx,
    });
    if (snapshotRes.status !== StatusEnum.OK) {
      await tx.rollback();
      return snapshotRes;
    }

    await tx.commit();
    return new Result(StatusEnum.OK, 200, {
      complaint,
      history,
      sla: snapshotRes.data, // { targetResponseMins, targetResolutionMins, responseDueAt }
    });

  } catch (e) {
    await tx.rollback();
    // pretpostavljam da imaš parseSequelizeErrors; ako ne, samo vrati poruku
    return new Result(StatusEnum.FAIL, 500, null, [{ message: e.message }]);
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
    const complaint = await Complaint.findByPk(complaintId, { transaction: tx, lock: true });
    if (!complaint) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Complaint not found' }]);
    }

    const toCodeNorm = String(toCode || '').toUpperCase();

    const fromRes = await StatusService.getStatusById(complaint.statusId, { transaction: tx });
    if (fromRes.status !== StatusEnum.OK) { await tx.rollback(); return fromRes; }
    const from = fromRes.data;

    const toRes = await StatusService.getStatusByCode(toCodeNorm, { transaction: tx });
    if (toRes.status !== StatusEnum.OK) { await tx.rollback(); return toRes; }
    const to = toRes.data;

    if (from.id === to.id) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 409, null, [{ message: `Already in ${to.code}` }]);
    }

    const allowedRes = await StatusTransitionService.isAllowed(from.id, to.id, { transaction: tx });
    if (allowedRes.status !== StatusEnum.OK || !allowedRes.data?.allowed) {
      await tx.rollback();
      return new Result(StatusEnum.FAIL, 400, null, [{
        message: `Transition ${from.code} -> ${to.code} is not allowed`,
      }]);
    }

    complaint.statusId = to.id;
    await complaint.save({ transaction: tx });

    const changedAt = new Date();
    const histRes = await ComplaintStatusHistoryService.createEntry({
      complaintId,
      fromStatusId: from?.id ?? null,
      toStatusId: to.id,
      changedAt,
      changedByUsername: actorUsername,
      note
    }, { transaction: tx });
    if (histRes.status !== StatusEnum.OK) { await tx.rollback(); return histRes; }

		 console.log('>>> SLA transition hook', { from: from.code, to: to.code });
    // SLA hook-ovi:
    if (from.code === 'PENDING' && to.code === 'IN_PROGRESS') {
      const r = await SlaTrackingService.onStartWork({ complaint, changedAt, transaction: tx });
      if (r.status !== StatusEnum.OK) { await tx.rollback(); return r; }
    }
    if (from.code === 'IN_PROGRESS' && to.code === 'WAITING_INFO') {
      const r = await SlaTrackingService.onPause({ complaintId, changedAt, transaction: tx });
      if (r.status !== StatusEnum.OK) { await tx.rollback(); return r; }
    }
    if (from.code === 'WAITING_INFO' && to.code === 'IN_PROGRESS') {
      const r = await SlaTrackingService.onResume({ complaintId, changedAt, transaction: tx });
      if (r.status !== StatusEnum.OK) { await tx.rollback(); return r; }
    }
    if (to.code === 'CLOSED' || to.code === 'REJECTED') {
      const r = await SlaTrackingService.onClose({ complaintId, changedAt, transaction: tx });
      if (r.status !== StatusEnum.OK) { await tx.rollback(); return r; }
    }

    await tx.commit();
    return new Result(StatusEnum.OK, 200, { complaint, history: histRes.data });
  } catch (e) {
    await tx.rollback();
    return new Result(StatusEnum.FAIL, 500, null, parseSequelizeErrors(e));
  }
}

	async findComplaintByIdForManager(complaintId) {

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

	async getAllComplaints() {
		try {
			const complaints = await Complaint.findAll();
			return new Result(StatusEnum.OK, 200, complaints);
		} catch (error) {
			console.error('Error fetching complaints:', error);
			return new Result(StatusEnum.FAIL, 500, null, { message: 'Internal server error' });
		}
	};



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
					{ statusId: 7 }  // NEW
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