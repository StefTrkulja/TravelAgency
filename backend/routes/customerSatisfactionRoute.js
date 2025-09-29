const express = require('express');
const router = express.Router();
const CustomerSatisfactionService = require('../services/customerSatisfactionService');
const jwtParser = require('../utils/jwtParser');
const { StatusEnum } = require('../utils/result');
const CustomerSatisfactionValidators = require('../validators/customerSatisfactionValidators');

// POST /satisfaction - Kreiranje nove CSAT ocene
router.post('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const csatData = {
      complaintId: parseInt(req.body.complaintId),
      customerUsername: req.user.username,
      rating: parseInt(req.body.rating),
      comment: req.body.comment || null
    };

    // Validacija podataka
    const validationResult = CustomerSatisfactionValidators.validateCreateRating(csatData);
    if (validationResult.status === StatusEnum.FAIL) {
      return res.status(validationResult.code).json({ errors: validationResult.errors });
    }

    const result = await CustomerSatisfactionService.create(csatData);

    if (result.status === StatusEnum.FAIL) {
      return res.status(result.code).json({ errors: result.errors });
    }

    return res.status(result.code).json(result.data);
  }
);

// GET /satisfaction/complaint/:id - Dobijanje CSAT ocene za žalbu
router.get('/complaint/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const complaintId = parseInt(req.params.id);
    
    if (isNaN(complaintId)) {
      return res.status(400).json({ 
        errors: [{ message: 'Invalid complaint ID' }] 
      });
    }

    const result = await CustomerSatisfactionService.getByComplaintId(complaintId);

    if (result.status === StatusEnum.FAIL) {
      return res.status(result.code).json({ errors: result.errors });
    }

    return res.status(result.code).json(result.data);
  }
);

// GET /satisfaction - Lista svih CSAT ocena (za manager/operator)
router.get('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Samo manager i operator mogu da vide sve ocene
    if (!['manager', 'operator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Validacija query parametara
    const validationResult = CustomerSatisfactionValidators.validateGetAllParams(req.query);
    if (validationResult.status === StatusEnum.FAIL) {
      return res.status(validationResult.code).json({ errors: validationResult.errors });
    }

    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      rating: req.query.rating ? parseInt(req.query.rating) : null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null
    };

    const result = await CustomerSatisfactionService.getAll(options);

    if (result.status === StatusEnum.FAIL) {
      return res.status(result.code).json({ errors: result.errors });
    }

    return res.status(result.code).json(result.data);
  }
);

// GET /satisfaction/statistics - Statistike zadovoljstva (za manager)
router.get('/statistics',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Samo manager može da vidi statistike
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Validacija query parametara
    const validationResult = CustomerSatisfactionValidators.validateStatisticsParams(req.query);
    if (validationResult.status === StatusEnum.FAIL) {
      return res.status(validationResult.code).json({ errors: validationResult.errors });
    }

    const options = {
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null
    };

    const result = await CustomerSatisfactionService.getStatistics(options);

    if (result.status === StatusEnum.FAIL) {
      return res.status(result.code).json({ errors: result.errors });
    }

    return res.status(result.code).json(result.data);
  }
);

module.exports = router;