const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const ActivityAnalyticsService = require('../services/activityAnalyticsService');

// Create analytics
router.post('/create',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const payload = { 
      ...req.body,
      userUsername: req.user.username   // ✅ force user assignment
    };
    if (!payload.user_id) {
      return res.status(400).json({ errors: [{ message: 'user_id is required' }] });
    }

    const result = await ActivityAnalyticsService.createAnalytics(payload);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get all analytics
router.get('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityAnalyticsService.getAllAnalytics();
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get analytics by ID
router.get('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityAnalyticsService.getAnalyticsById(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get analytics by user ID
router.get('/user/:userId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityAnalyticsService.getAnalyticsByUserId(req.params.userId);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Update analytics
router.put('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const updates = req.body;
    const result = await ActivityAnalyticsService.updateAnalytics(req.params.id, updates);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Delete analytics
router.delete('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const result = await ActivityAnalyticsService.deleteAnalytics(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

module.exports = router;
