
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../utils/jwtParser');
const svc = require('../services/reviews.service');


router.post(
  '/',
  verifyToken('CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    try {
      // body: { arrangementId, rating (1..5), comment? }
      const review = await svc.createReview(req.user, req.body);
      res.status(201).json(review);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);


router.get(
  '/',
  verifyToken('CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    try {
      const list = await svc.listReviews(req.user, req.query);
      res.json(list);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);


router.get(
  '/:id',
  verifyToken('CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    try {
      const r = await svc.getReview(req.user, +req.params.id, { include: req.query.include });
      if (!r) return res.status(404).json({ error: 'Not found' });
      res.json(r);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);


router.get(
  '/me/list',
  verifyToken('CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    try {
      const list = await svc.listMyReviews(req.user, req.query);
      res.json(list);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);


router.put(
  '/:id',
  verifyToken('CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    try {
      const updated = await svc.updateReview(req.user, +req.params.id, req.body);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);


router.delete(
  '/:id',
  verifyToken('CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    try {
      await svc.deleteReview(req.user, +req.params.id);
      res.status(204).end();
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);


router.get(
  '/arrangement/:arrangementId/average',
  verifyToken('CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    try {
      const avg = await svc.getArrangementAverage(+req.params.arrangementId);
      res.json(avg); // { arrangementId, average: 4.6, count: 37 }
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);


router.get(
  '/arrangement/:arrangementId',
  verifyToken('CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    try {
      const list = await svc.listArrangementReviews(+req.params.arrangementId, req.query);
      res.json(list);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);


module.exports = router;
