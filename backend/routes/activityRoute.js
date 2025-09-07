const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const ActivityService = require('../services/activityService');
const ImageService = require('../services/imageService');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Create a new activity
router.post(
  '/create',
  jwtParser.extractTokenUser,
  upload.single('image'),   
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    let path;
    if (req.file) {
      path = await ImageService.saveImage(req.file); 
    }

    const payload = {
      ...req.body,
      userUsername: req.user.username,
      imagePath: path || null,
    };

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
