const express = require('express');
const router = express.Router();
const reservationService = require('../services/reservationService');

// get all reservations
router.get('/', async (req, res) => {
  try {
    const filters = {};
    
    if (req.query.customerUsername) {
      filters.customerUsername = req.query.customerUsername;
    }
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.arrangementId) {
      filters.arrangementId = req.query.arrangementId;
    }
    
    const result = await reservationService.getAllReservations(filters);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get reservation by id
router.get('/:id', async (req, res) => {
  try {
    const result = await reservationService.getReservationById(req.params.id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get reservation by code
router.get('/code/:code', async (req, res) => {
  try {
    const result = await reservationService.getReservationByCode(req.params.code);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get user reservations by username
router.get('/user/:username', async (req, res) => {
  try {
    const result = await reservationService.getUserReservations(req.params.username);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// create new reservation
router.post('/', async (req, res) => {
  try {
    const { 
      arrangementId, 
      customerUsername, 
      numberOfPeople, 
      specialRequests 
    } = req.body;
    
    if (!arrangementId || !customerUsername || !numberOfPeople) {
      return res.status(400).json({ 
        error: 'Arrangement ID, customer username, and number of people are required' 
      });
    }
    
    if (numberOfPeople < 1) {
      return res.status(400).json({ 
        error: 'Number of people must be at least 1' 
      });
    }
    
    const reservationData = {
      arrangementId,
      customerUsername,
      numberOfPeople: parseInt(numberOfPeople),
      specialRequests
    };
    
    const result = await reservationService.createReservation(reservationData);
    
    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { 
      numberOfPeople, 
      specialRequests,
      status 
    } = req.body;
    
    const updateData = {};
    
    if (numberOfPeople) {
      if (numberOfPeople < 1) {
        return res.status(400).json({ 
          error: 'Number of people must be at least 1' 
        });
      }
      updateData.numberOfPeople = parseInt(numberOfPeople);
    }
    
    if (specialRequests !== undefined) updateData.specialRequests = specialRequests;
    if (status) updateData.status = status;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const validStatuses = ['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
      });
    }
    
    const result = await reservationService.updateReservation(req.params.id, updateData);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/cancel', async (req, res) => {
  try {
    const result = await reservationService.cancelReservation(req.params.id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// konfirmacija
router.patch('/:id/confirm', async (req, res) => {
  try {
    const result = await reservationService.confirmReservation(req.params.id);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await reservationService.deleteReservation(req.params.id);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(404).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
