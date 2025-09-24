const express = require('express');
const router = express.Router();
const jwtParser = require('../utils/jwtParser');
const BookingService = require('../services/bookingService');
const { Booking, Departure, TravelArrangement } = require('../models');

router.use((req, res, next) => {
  console.log('Arrangement Bookings route hit:', req.method, req.originalUrl);
  next();
});


// Create booking
router.post('/create',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }

    const payload = {
      ...req.body,
      userUsername: req.user.username   // ✅ link booking to logged in user
    };

    const result = await BookingService.createBooking(payload);
    return res.status(result.code).json(
      result.status === 'FAIL' ? { errors: result.errors } : result.data
    );
  }
);

// Get all
router.get('/', async (req, res) => {
  const result = await BookingService.getAllBookings();
  return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
});

// Get by id
router.get('/:id', async (req, res) => {
  const result = await BookingService.getBookingById(req.params.id);
  return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
});

// Get by user
router.get('/user/:username', async (req, res) => {
  const result = await BookingService.getBookingsByUser(req.params.username);
  return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
});

// Get by departure
router.get('/departure/:departureId', async (req, res) => {
  const result = await BookingService.getBookingsByDeparture(req.params.departureId);
  return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
});

// Update
router.put('/:id', async (req, res) => {
  const result = await BookingService.updateBooking(req.params.id, req.body);
  return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
});

// Delete
router.delete('/:id', async (req, res) => {
  const result = await BookingService.deleteBooking(req.params.id);
  return res.status(result.code).json(result.status === 'FAIL' ? { errors: result.errors } : result.data);
});


router.get('/:id/details', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Departure,
          as: 'departure',
          include: [
            { model: TravelArrangement, as: 'arrangement' }
          ]
        }
      ]
    })

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    res.json(booking)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch booking details' })
  }
})

module.exports = router;
