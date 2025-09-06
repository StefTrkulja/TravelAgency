const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const ActivityReviewService = require('../services/activityReviewService')

// Create review
router.post('/create',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const payload = { 
      ...req.body,
      userUsername: req.user.username   // ✅ force user assignment
    };
    if (!payload.user_id || !payload.activity_booking_id || !payload.overallRating) {
      return res.status(400).json({ errors: [{ message: 'Missing required fields' }] });
    }

    const result = await ActivityReviewService.createReview(payload);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get all reviews
router.get('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityReviewService.getAllReviews();
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get review by ID
router.get('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityReviewService.getReviewById(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get reviews by user ID
router.get('/user/:userId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityReviewService.getReviewsByUserId(req.params.userId);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Get reviews by booking ID
router.get('/booking/:bookingId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityReviewService.getReviewsByBookingId(req.params.bookingId);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Update review
router.put('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const updates = req.body;
    const result = await ActivityReviewService.updateReview(req.params.id, updates);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

// Delete review
router.delete('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const result = await ActivityReviewService.deleteReview(req.params.id);
    return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
  }
);

module.exports = router;
