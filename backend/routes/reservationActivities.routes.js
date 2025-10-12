const express = require('express');
const router = express.Router();
const ReservationActivitiesService = require('../services/reservationActivities');




// create new reservation Activity
router.post('/', async (req, res) => {
  try {
    const { 
      reservationId, 
      iteneraryId
    } = req.body;
    
    if (!reservationId || !iteneraryId ) {
      return res.status(400).json({ 
        error: 'reservationId and of iteneraryId are required' 
      });
    }
    
    
    const reservationActivityData = {
      reservationId, 
      iteneraryId
    };
    
    const result = await ReservationActivitiesService.createReservationActivity(reservationActivityData);
    
    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

