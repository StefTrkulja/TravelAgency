const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const TravelArrangementService = require('../services/travelArrangementService');

// Create a new travel arrangement
router.post(
  '/create',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    const payload = {
      ...req.body,
      createdByUsername: req.user.username,
    };

    const result = await TravelArrangementService.createTravelArrangement(payload);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get all travel arrangements
router.get('/',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await TravelArrangementService.getAllTravelArrangements();
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get travel arrangement by id
router.get('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await TravelArrangementService.getTravelArrangementById(req.params.id);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get travel arrangements by creator
router.get('/creator/:username',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await TravelArrangementService.getTravelArrangementsByCreator(req.params.username);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get travel arrangements by destination
router.get('/destination/:destinationId',
  jwtParser.extractTokenUser,
  async (req, res) => {
    const result = await TravelArrangementService.getTravelArrangementsByDestination(req.params.destinationId);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Update travel arrangement
router.put('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    const updates = req.body;
    const result = await TravelArrangementService.updateTravelArrangement(req.params.id, updates);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Delete travel arrangement
router.delete('/:id',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    const result = await TravelArrangementService.deleteTravelArrangement(req.params.id);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Update travel arrangement status
router.put('/:id/status',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    const { status } = req.body;
    const result = await TravelArrangementService.updateStatus(req.params.id, status);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

module.exports = router;