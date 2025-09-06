const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const ActivityParticipantService = require('../services/activityParticipantService');

// Create participant
router.post('/create',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const payload = req.body;
    if (!payload.activity_booking_id || !payload.firstName || !payload.lastName || !payload.email) {
      return res.status(400).json({ errors: [{ message: 'Missing required fields' }] });
    }

    const result = await ActivityParticipantService.createParticipant(payload);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get all participants
router.get('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityParticipantService.getAllParticipants();
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get participant by ID
router.get('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityParticipantService.getParticipantById(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get participants by booking ID
router.get('/booking/:bookingId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityParticipantService.getParticipantsByBookingId(req.params.bookingId);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);


// Get participants by activity ID
router.get('/activity/:activityId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityParticipantService.getParticipantsByActivityId(req.params.activityId);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);


// Update participant
router.put('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const updates = req.body;
    const result = await ActivityParticipantService.updateParticipant(req.params.id, updates);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Delete participant
router.delete('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const result = await ActivityParticipantService.deleteParticipant(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

module.exports = router;
