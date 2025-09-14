const { Result, StatusEnum } = require('../utils/result');
const ComplaintService = require('../services/complaintService');
const jwtParser = require('../utils/jwtParser');
const multer = require('multer');
const  AttachmentService  = require('../services/attachmentService');
const express = require('express');
const ComplaintMessageService = require('../services/complaintMessageService');
const router = express.Router();
const StatusTransitionService = require('../services/statusTransitionService');
const complaintStatusHistoryService = require('../services/complaintStatusHistoryService');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const StatusService = require('../services/statusService');
const slaTrackingService = require('../services/slaTrackingService');
router.get('/mycomplaints',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (req.user === null) {
			return res.status(401).json({ message: 'Unauthorized' });
		}
		const username = req.user.username;	
		const result = await ComplaintService.findComplaintsByUsername(username);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}

		return res.status(result.code).json(result.data);
	})





router.get('/manager-tickets',jwtParser.extractTokenUser, async (req, res) => {

		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'manager') {
			return res.status(403).json({ message: 'Forbidden' });
		}

		console.log("Usao u manager route");
		const result = await ComplaintService.findForManager();
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);


}
)




router.get('/operator',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'operator') {
			return res.status(403).json({ message: 'Forbidden' });
		}
		const operatorUsername = req.user.username;
		const result = await ComplaintService.findForOperator(operatorUsername);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);

  }
);

router.patch('/:id/priority', jwtParser.extractTokenUser, async (req, res) => {

	if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
	if (req.user.role !== 'operator') {
		return res.status(403).json({ message: 'Forbidden' });
	}
	const complaintId = req.params.id;
	const { priority } = req.body;
	const result = await ComplaintService.updatePriority(complaintId, priority);
	if (result.status === StatusEnum.FAIL) {
		return res.status(result.code).json({ errors: result.errors });
	}
	return res.status(result.code).json(result.data);
});





router.get('/mycomplaints/:id',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		const complaintId = req.params.id;
		const user = req.user.username;
		const result = await ComplaintService.findComplaintByIdForUser(complaintId, user);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);

	}
)

router.post('/accept',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'operator') {
			return res.status(403).json({ message: 'Forbidden' });
		}
		const { complaintId, assigneeUsername } = req.body;
		const result = await ComplaintService.assignToOperator(complaintId, assigneeUsername);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
)

router.post('/mycomplaints/:id/messages',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		const complaintId = req.params.id;
		const  text  = req.body.text;
		const authorUsername = req.user.username;
		const message = {
			complaintId: complaintId,
			text: text,
			authorUsername: authorUsername,
			createdAt: new Date()
		};
		const result = await ComplaintMessageService.createMessage(message);

		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
		}
)

router.post('/:id/messages',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'operator') {
			return res.status(403).json({ message: 'Forbidden' });
		}
		const complaintId = req.params.id;
		const  text  = req.body.text;
		const authorUsername = req.user.username;
		const message = {
			complaintId: complaintId,
			text: text,
			authorUsername: authorUsername,
			createdAt: new Date()
		};
		const result = await ComplaintMessageService.createMessage(message);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
)


router.get('/mycomplaints/:id/messages',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		const complaintId = req.params.id;
		const result = await ComplaintMessageService.findMessagesByComplaintId(complaintId);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
)

router.get('/:id/messages',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'operator') {
			return res.status(403).json({ message: 'Forbidden' });
		}
		const complaintId = req.params.id;
		const result = await ComplaintMessageService.findMessagesByComplaintId(complaintId);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
)





router.post('/newcomplaint',
  jwtParser.extractTokenUser,              
  upload.array('attachments', 10),         
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });


const complaintData  = {
	subject: req.body.subject,
	description: req.body.description,
	createdAt : new Date(),
	lastActivityAt : new Date(),
	statusId : 1,
  reservationId : req.body.reservationId,
  category : req.body.categoryName,
	createdByUsername : req.user.username,
}
		const result = await ComplaintService.createComplaint(complaintData);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
	const complaint = result.data;
  const uploadedFiles = req.files || [];
	const attachments = await AttachmentService.saveMany(complaint.id, uploadedFiles);
	
    const files = req.files || [];


    // ... pozovi servis, snimi fajlove (disk/S3) itd.
    return res.status(201).json({
			complaint:result.data,
			attachments: attachments.map(a => ({
				id: a.id,
				storageKey: a.storageKey
			}))

		 });
  }
);

router.get('/:id/allowed-statuses',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const id = Number(req.params.id);
    const result = await StatusTransitionService.getAllowedNext(id);
		//Ovo radi, ali mi treba ime statusa a ne id
		const statusIds = new Set();
		for (const r of result.data) {
			if (r.toStatusId) statusIds.add(r.toStatusId);
		}
		const toStatusRes = await StatusService.getManyByIds([...statusIds]);
		if (toStatusRes.status !== StatusEnum.OK) { return res.status(toStatusRes.code).json({ errors: toStatusRes.errors }); }
		const statusMap = new Map(
			(toStatusRes.data || []).map(s => [s.id, { name: s.name, code: s.code }])
		);
		result.data = result.data.map(r => ({
			fromStatusId: r.fromStatusId,
			toStatusId: r.toStatusId,
			toStatusName: statusMap.get(r.toStatusId)?.name || null,
			toStatusCode: statusMap.get(r.toStatusId)?.code || null,
		}));




    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);




router.post('/:id/transition',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const id = Number(req.params.id);
    const { toCode, note } = req.body;
    const result = await ComplaintService.transition(id, toCode, req.user.username, note);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);


router.get('/:id/timeline',
	  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const complaintId = req.params.id;

    const histRes = await complaintStatusHistoryService.listByComplaintId(complaintId);
    if (histRes.status === StatusEnum.FAIL) {
      return res.status(histRes.code).json({ errors: histRes.errors });
    }
    const rows = histRes.data || [];

    const statusIds = new Set();
    for (const r of rows) {
      if (r.fromStatusId) statusIds.add(r.fromStatusId);
      if (r.toStatusId) statusIds.add(r.toStatusId);
    }

    const statusRes = await StatusService.getManyByIds([...statusIds]);
    if (statusRes.status === StatusEnum.FAIL) {
      return res.status(statusRes.code).json({ errors: statusRes.errors });
    }
    const statusMap = new Map(
      (statusRes.data || []).map(s => [s.id, { name: s.name, code: s.code }])
    );

    const enriched = rows.map(r => ({
      changedAt: r.changedAt,
      toStatusName:   statusMap.get(r.toStatusId)?.name   || null,
    }));

    return res.status(200).json(enriched);
  }
);


router.get('/:id/history',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const complaintId = req.params.id;

    const histRes = await complaintStatusHistoryService.listByComplaintId(complaintId);
    if (histRes.status === StatusEnum.FAIL) {
      return res.status(histRes.code).json({ errors: histRes.errors });
    }
    const rows = histRes.data || [];

    const statusIds = new Set();
    for (const r of rows) {
      if (r.fromStatusId) statusIds.add(r.fromStatusId);
      if (r.toStatusId) statusIds.add(r.toStatusId);
    }

    const statusRes = await StatusService.getManyByIds([...statusIds]);
    if (statusRes.status === StatusEnum.FAIL) {
      return res.status(statusRes.code).json({ errors: statusRes.errors });
    }
    const statusMap = new Map(
      (statusRes.data || []).map(s => [s.id, { name: s.name, code: s.code }])
    );

    const enriched = rows.map(r => ({
      id: r.id,
      complaintId: r.complaintId,
      changedAt: r.changedAt,
      changedByUsername: r.changedByUsername,
      note: r.note,
      fromStatusId: r.fromStatusId || null,
      toStatusId: r.toStatusId || null,

      fromStatusName: statusMap.get(r.fromStatusId)?.name || null,
      fromStatusCode: statusMap.get(r.fromStatusId)?.code || null,
      toStatusName:   statusMap.get(r.toStatusId)?.name   || null,
      toStatusCode:   statusMap.get(r.toStatusId)?.code   || null,
    }));

    return res.status(200).json(enriched);
  }
);

router.get('/:id/attachments',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		const complaintId = req.params.id;
		const result = await AttachmentService.findByComplaintId(complaintId);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
);

router.get('/:id/history',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		const complaintId = req.params.id;
		const result = await complaintStatusHistoryService.listByComplaintId(complaintId);
		const statusIds = new Set();
		for (const r of result.data) {
			if (r.fromStatusId) statusIds.add(r.fromStatusId);
			if (r.toStatusId) statusIds.add(r.toStatusId);
		}
		const toStatusRes = await StatusService.getManyByIds([...statusIds]);
		if (toStatusRes.status !== StatusEnum.OK) { return res.status(toStatusRes.code).json({ errors: toStatusRes.errors }); }
		const statusMap = new Map(
			(toStatusRes.data || []).map(s => [s.id, { name: s.name, code: s.code }])
		);
		result.data = result.data.map(r => ({
			id: r.id,
			complaintId: r.complaintId,
			changedAt: r.changedAt,
			changedByUsername: r.changedByUsername,
			note: r.note,
			fromStatusId: r.fromStatusId || null,
			toStatusId: r.toStatusId || null,
			fromStatusName: statusMap.get(r.fromStatusId)?.name || null,
			fromStatusCode: statusMap.get(r.fromStatusId)?.code || null,
			toStatusName: statusMap.get(r.toStatusId)?.name || null,
			toStatusCode: statusMap.get(r.toStatusId)?.code || null,
		}));


		return res.status(result.code).json(result.data);
	}
)


router.get('/:id/sla',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		const complaintId = req.params.id;
		const result = await slaTrackingService.getByComplaintId(complaintId);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
)



router.get('/:id/',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		const complaintId = req.params.id;
		const result = await ComplaintService.findComplaintById(complaintId);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
)

router.get('/operator/:id',
	jwtParser.extractTokenUser,
	async (req, res) => {
		if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		if (req.user.role !== 'operator') {
			return res.status(403).json({ message: 'Forbidden' });
		}
		const complaintId = req.params.id;
		const result = await ComplaintService.findComplaintByIdForOperator(complaintId);
		if (result.status === StatusEnum.FAIL) {
			return res.status(result.code).json({ errors: result.errors });
		}
		return res.status(result.code).json(result.data);
	}
)

module.exports = router;