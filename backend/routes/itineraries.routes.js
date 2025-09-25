// backend/routes/itineraries.routes.js
'use strict';
const express = require('express');
const router = express.Router();
const svc = require('../services/itineraries.service');
const { StatusEnum } = require('../utils/result');
const { verifyToken } = require('../utils/jwtParser');


router.post('/:departureId',
  verifyToken('OPERATOR', 'ADMIN'),
  async (req, res) => {
    const departureId = +req.params.departureId;
    const r = await svc.create(req.user, departureId, req.body);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);


router.get('/by-departure/:departureId',
  verifyToken('OPERATOR', 'SUPPLIER', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    const r = await svc.list(+req.params.departureId);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);


router.get('/:id',
  verifyToken('OPERATOR', 'SUPPLIER', 'MANAGER', 'ADMIN'),
  async (req, res) => {
    const r = await svc.get(+req.params.id);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);


router.put('/:id',
  verifyToken('OPERATOR', 'ADMIN'),
  async (req, res) => {
    const r = await svc.update(req.user, +req.params.id, req.body);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

router.delete('/:id',
  verifyToken('OPERATOR', 'ADMIN'),
  async (req, res) => {
    const r = await svc.remove(req.user, +req.params.id);
    res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
  }
);

module.exports = router;
