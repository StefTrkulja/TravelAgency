'use strict';

const express = require('express');
const router = express.Router();
const { createCheckoutSession, confirmCheckout } = require('../services/payment.service');

// 1) Kreiraj Stripe Checkout sesiju
router.post('/reservations/:id/checkout', async (req, res) => {
  const { id } = req.params;
  const result = await createCheckoutSession(id);
  if (result.error) return res.status(result.status || 500).json({ error: result.error });
  return res.json({ url: result.url, sessionId: result.sessionId });
});

// 2) Potvrdi uplatu (poziva se sa success stranice)
router.get('/stripe/confirm', async (req, res) => {
  const { session_id } = req.query;
  const result = await confirmCheckout(session_id);
  if (result.error) return res.status(result.status || 500).json({ error: result.error });
  return res.status(result.status || 200).json(result);
});

module.exports = router;