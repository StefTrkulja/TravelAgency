const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const ActivityReviewService = require('../services/activityReviewService');

router.use((req, res, next) => {
  console.log('reviews route hit:', req.method, req.originalUrl);
  next();
});

router.post('/create-review',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const payload = { 
      ...req.body,
      userUsername: req.user.username   
    };

    const result = await ActivityReviewService.createReview(payload);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get all reviews
router.get('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityReviewService.getAllReviews();
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);


router.get('/user/:username',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityReviewService.getReviewsByUserId(req.params.username);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

router.get('/booking/:bookingId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityReviewService.getReviewsByBookingId(req.params.bookingId);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

router.get('/activity/:activityId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityReviewService.getReviewsByActivityId(req.params.activityId);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);


// Constrain :id to digits only
router.get('/:id(\\d+)',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await ActivityReviewService.getReviewById(Number(req.params.id));
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Update review
router.put('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const result = await ActivityReviewService.updateReview(req.params.id, req.body);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Delete review
router.delete('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized!' });

    const result = await ActivityReviewService.deleteReview(req.params.id);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

module.exports = router;
