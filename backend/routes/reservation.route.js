const express = require('express');
const router = express.Router();
const reservationService = require('../services/reservationService');




router.get('/code/:code', async (req, res) => {
  const r = await reservationService.getReservationByCode(req.params.code);
  return r.success ? res.json(r.data) : res.status(404).json({ error: r.error });
});

router.get('/', async (req, res) => {
  const filters = {
    customerUsername: req.query.customerUsername,
    status: req.query.status,
    arrangementId: req.query.arrangementId,
    departureId: req.query.departureId,
  };
  const r = await reservationService.getAllReservations(filters);
  return r.success ? res.json(r.data) : res.status(400).json({ error: r.error });
});

router.get('/:id', async (req, res) => {
  const r = await reservationService.getReservationById(req.params.id);
  return r.success ? res.json(r.data) : res.status(404).json({ error: r.error });
});

/* 2) POST sada prima i departureId + voucherCode */
router.post('/', async (req, res) => {
  try {
    const {
      arrangementId,
      customerUsername,
      numberOfPeople,
      numberOfKids = 0,
      specialRequests,
      departureId = null,
      voucherCode = null,
    } = req.body;

    if (!arrangementId || !customerUsername || !numberOfPeople) {
      return res.status(400).json({ error: 'Arrangement ID, customer username, and number of people are required' });
    }
    if (Number(numberOfPeople) < 1) {
      return res.status(400).json({ error: 'Number of people must be at least 1' });
    }

    const payload = {
      arrangementId:    parseInt(arrangementId, 10),
      customerUsername: String(customerUsername),
      numberOfPeople:   parseInt(numberOfPeople, 10),
      numberOfKids:     Math.max(0, parseInt(numberOfKids, 10) || 0),
      specialRequests:  specialRequests ?? null,
      departureId:      departureId != null ? parseInt(departureId, 10) : null,
      voucherCode:      voucherCode ? String(voucherCode) : null,
    };

    const r = await reservationService.createReservation(payload);
    return r.success ? res.status(201).json(r.data) : res.status(400).json({ error: r.error });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
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
