const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const ActivityScheduleService = require('../services/activityScheduleService');

// Create schedule
router.post('/create',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const payload = req.body;
    if (!payload.activity_id || !payload.startTime || !payload.endTime) {
      return res.status(400).json({ errors: [{ message: 'Missing required fields' }] });
    }

    const result = await ActivityScheduleService.createSchedule(payload);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get all schedules
router.get('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityScheduleService.getAllSchedules();
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get schedule by ID
router.get('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityScheduleService.getScheduleById(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get schedules by Activity ID
router.get('/activity/:activityId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityScheduleService.getSchedulesByActivityId(req.params.activityId);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Update schedule
router.put('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const updates = req.body;
    const result = await ActivityScheduleService.updateSchedule(req.params.id, updates);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Delete schedule
router.delete('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const result = await ActivityScheduleService.deleteSchedule(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

module.exports = router;
