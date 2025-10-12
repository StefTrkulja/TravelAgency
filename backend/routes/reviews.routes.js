const express = require('express');
const router = express.Router();

const { verifyToken } = require('../utils/jwtParser');
const svc = require('../services/reviews.service');

// 1) Neutralni auth – samo učitava req.user iz tokena (cookie/Authorization)
const auth = verifyToken();

// 2) Guard za role, kao u arrangements.routes
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized access' });
  if (roles.length && !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

/**
 * VAŽNO: specifične rute (prefiksi) stavljamo prije `/:id` da ne dođe do kolizije.
 * /arrangement/:arrangementId/average
 * /arrangement/:arrangementId
 */

// Prosjek ocjena za aranžman
router.get(
  '/arrangement/:arrangementId/average',
  auth, allowRoles('TRAVELER','OPERATOR','MANAGER','ADMIN','SUPPLIER'),
  async (req, res) => {
    try {
      const avg = await svc.getArrangementAverage(+req.params.arrangementId);
      res.json(avg); // { arrangementId, average, count }
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

// Lista recenzija za aranžman
router.get(
  '/arrangement/:arrangementId',
  auth, allowRoles('TRAVELER','OPERATOR','MANAGER','ADMIN','SUPPLIER'),
  async (req, res) => {
    try {
      const list = await svc.listArrangementReviews(+req.params.arrangementId, req.query);
      res.json(list);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

// Kreiraj recenziju
router.post(
  '/',
  auth, allowRoles('TRAVELER','OPERATOR','MANAGER','ADMIN'),
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

// Lista recenzija (po queryju, npr. ?arrangementId=2)
router.get(
  '/',
  auth, allowRoles('TRAVELER','OPERATOR','MANAGER','ADMIN','SUPPLIER'),
  async (req, res) => {
    try {
      const list = await svc.listReviews(req.user, req.query);
      res.json(list);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

// Detalj recenzije po ID
router.get(
  '/:id',
  auth, allowRoles('TRAVELER','OPERATOR','MANAGER','ADMIN','SUPPLIER'),
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

// Moje recenzije
router.get(
  '/me/list',
  auth, allowRoles('TRAVELER','OPERATOR','MANAGER','ADMIN'),
  async (req, res) => {
    try {
      const list = await svc.listMyReviews(req.user, req.query);
      res.json(list);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

// Update recenzije
router.put(
  '/:id',
  auth, allowRoles('TRAVELER','OPERATOR','MANAGER','ADMIN'),
  async (req, res) => {
    try {
      const updated = await svc.updateReview(req.user, +req.params.id, req.body);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

// Brisanje recenzije
router.delete(
  '/:id',
  auth, allowRoles('TRAVELER','OPERATOR','MANAGER','ADMIN'),
  async (req, res) => {
    try {
      await svc.deleteReview(req.user, +req.params.id);
      res.status(204).end();
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

module.exports = router;
