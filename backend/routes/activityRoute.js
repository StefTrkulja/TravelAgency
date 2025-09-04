const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const ActivityService = require('../services/activityService');

// Create a new activity
router.post('/create',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    const payload = req.body;
    if (!payload.name || !payload.description || !payload.arrangement_id || !payload.user_id) {
      return res.status(400).json({ errors: [{ message: 'Missing required fields' }] });
    }

    const result = await ActivityService.createActivity(payload);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get all activities
router.get('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityService.getAllActivities();
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get activity by id
router.get('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityService.getActivityById(req.params.id);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get activities by arrangement id
router.get('/arrangement/:arrangementId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityService.getActivitiesByArrangementId(req.params.arrangementId);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Update activity
router.put('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    const updates = req.body;
    const result = await ActivityService.updateActivity(req.params.id, updates);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Delete activity
router.delete('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    const result = await ActivityService.deleteActivity(req.params.id);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

module.exports = router;
