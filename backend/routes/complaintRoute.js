const { Result, StatusEnum } = require('../utils/result');
const ComplaintService = require('../services/complaintService');
const jwtParser = require('../utils/jwtParser');
const multer = require('multer');
const  AttachmentService  = require('../services/attachmentService');
const express = require('express');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

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

router.post('/accept',
	jwtParser.extractTokenUser,
	async (req, res) => {
		console.log("Stigao zahtev za prihvatanje zalbe");
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


router.post('/newcomplaint',
  jwtParser.extractTokenUser,              
  upload.array('attachments', 10),         
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
		console.log("Stigao zahtev za novu žalbu");


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
module.exports = router;