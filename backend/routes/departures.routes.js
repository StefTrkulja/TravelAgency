const express = require('express');
const router = express.Router();
const svc = require('../services/departures.service');
const { StatusEnum } = require('../utils/result');

router.post('/:arrangementId', async (req, res) => {
  const r = await svc.create(req.params.arrangementId, req.body);
  res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
});
router.get('/by-arrangement/:arrangementId', async (req, res) => {
  const r = await svc.list(req.params.arrangementId);
  res.status(r.code).json(r.data);
});
router.get('/:id', async (req, res) => {
  const r = await svc.get(req.params.id);
  res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
});
router.put('/:id', async (req, res) => {
  const r = await svc.update(req.params.id, req.body);
  res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
});
router.delete('/:id', async (req, res) => {
  const r = await svc.remove(req.params.id);
  res.status(r.code).json(r.status === StatusEnum.FAIL ? { errors: r.errors } : r.data);
});

module.exports = router;
