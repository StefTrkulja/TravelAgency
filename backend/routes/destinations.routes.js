// backend/routes/destinations.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../utils/jwtParser');
const svc = require('../services/destinations.service');

router.post('/', verifyToken('ADMIN'), async (req,res)=>{
  try { res.status(201).json(await svc.create(req.body)); }
  catch(e){ res.status(400).json({ error: e.message }); }
});

router.get('/', verifyToken('ADMIN'), async (req,res)=>{
  try { res.json(await svc.list(req.query)); }
  catch(e){ res.status(400).json({ error: e.message }); }
});

router.put('/:id', verifyToken('OPERATOR','ADMIN'), async (req,res)=>{
  try { res.json(await svc.update(+req.params.id, req.body)); }
  catch(e){ res.status(400).json({ error: e.message }); }
});

router.delete('/:id', verifyToken('ADMIN'), async (req,res)=>{
  try { await svc.remove(+req.params.id); res.status(204).end(); }
  catch(e){ res.status(400).json({ error: e.message }); }
});

module.exports = router;