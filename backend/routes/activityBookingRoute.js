const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const ActivityBookingService = require('../services/activityBookingService');

// Create booking
router.post('/create',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const payload = req.body;
    if (!payload.user_id || !payload.activity_schedule_id || !payload.arrangement_booking_id) {
      return res.status(400).json({ errors: [{ message: 'Missing required fields' }] });
    }

    const result = await ActivityBookingService.createBooking(payload);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get all bookings
router.get('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityBookingService.getAllBookings();
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get booking by ID
router.get('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityBookingService.getBookingById(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get bookings by user
router.get('/user/:userId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityBookingService.getBookingsByUserId(req.params.userId);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get bookings by arrangement booking
router.get('/arrangement/:arrangementBookingId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityBookingService.getBookingsByArrangementBookingId(req.params.arrangementBookingId);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get bookings by activity schedule
router.get('/schedule/:activityScheduleId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityBookingService.getBookingsByActivityScheduleId(req.params.activityScheduleId);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Update booking
router.put('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const updates = req.body;
    const result = await ActivityBookingService.updateBooking(req.params.id, updates);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Delete booking
router.delete('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const result = await ActivityBookingService.deleteBooking(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

module.exports = router;
