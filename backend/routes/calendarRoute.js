const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const CalendarService = require('../services/calendarService');

router.use((req, res, next) => {
  console.log('Calendar route hit:', req.method, req.originalUrl);
  next();
});

// Get activity schedules for calendar view
router.get('/activity-schedules',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    // Only managers, admins, and operators can access calendar
    if (!['MANAGER', 'ADMIN', 'OPERATOR', 'manager', 'admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filters = {
      destinationId: req.query.destinationId,
      arrangementId: req.query.arrangementId,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate
    };

    const result = await CalendarService.getActivitySchedules(filters);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get conflicts summary for dashboard
router.get('/conflicts-summary',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    if (!['MANAGER', 'ADMIN', 'manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await CalendarService.getConflictsSummary();
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Validate new schedule for conflicts
router.post('/validate-schedule',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    if (!['MANAGER', 'ADMIN', 'OPERATOR', 'manager', 'admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { activityId, startTime, endTime } = req.body;
    if (!activityId || !startTime || !endTime) {
      return res.status(400).json({ errors: [{ message: 'Missing required fields' }] });
    }

    const result = await CalendarService.validateNewSchedule({
      activityId,
      startTime,
      endTime
    });

    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

module.exports = router;
