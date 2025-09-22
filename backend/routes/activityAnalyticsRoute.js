const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const ActivityAnalyticsService = require('../services/activityAnalyticsService');

router.use((req, res, next) => {
  console.log('Analytics route hit:', req.method, req.originalUrl);
  next();
});

router.post('/create',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const { activity_id, fromDate, toDate } = req.body;
    if (!activity_id || !fromDate || !toDate) {
      return res.status(400).json({ errors: [{ message: 'Missing required fields' }] });
    }

    const result = await ActivityAnalyticsService.generateAnalytics(activity_id, fromDate, toDate, req.user.username);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

router.get('/:id', async (req, res) => {
  const result = await ActivityAnalyticsService.getById(req.params.id);
  return res.status(result.code).json(
    result.status === 'FAIL' ? { errors: result.errors } : result.data
  );
});

module.exports = router;
