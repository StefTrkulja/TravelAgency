// backend/routes/itineraries.routes.js
'use strict';
const express = require('express');
const router = express.Router();
const svc = require('../services/itineraries.service');
const { StatusEnum } = require('../utils/result');
const { verifyToken } = require('../utils/jwtParser');

/**
 * Kreiraj itinerary za polazak
 * Dozvoljeno: OPERATOR (vlasnik aranžmana) ili ADMIN
 */
router.post('/:departureId',
  verifyToken('OPERATOR', 'ADMIN'),
  async (req, res) => {
    const departureId = +req.params.departureId;
    const r = await svc.create(req.user, departureId, req.body);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

/**
 * Lista itinerarya po polasku (read)
 * Dozvoljeno: svi autentifikovani (po potrebi suzi)
 */
router.get('/by-departure/:departureId',
  verifyToken('OPERATOR', 'SUPPLIER', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    const r = await svc.list(+req.params.departureId);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

/**
 * Dohvati jedan itinerary (read)
 * Dozvoljeno: svi autentifikovani (po potrebi suzi)
 */
router.get('/:id',
  verifyToken('OPERATOR', 'SUPPLIER', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    const r = await svc.get(+req.params.id);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

/**
 * Izmeni itinerary
 * Dozvoljeno: OPERATOR (vlasnik aranžmana) ili ADMIN
 */
router.put('/:id',
  verifyToken('OPERATOR', 'ADMIN'),
  async (req, res) => {
    const r = await svc.update(req.user, +req.params.id, req.body);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

/**
 * Obriši itinerary
 * Dozvoljeno: OPERATOR (vlasnik aranžmana) ili ADMIN
 */
router.delete('/:id',
  verifyToken('OPERATOR', 'ADMIN'),
  async (req, res) => {
    const r = await svc.remove(req.user, +req.params.id);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

module.exports = router;
