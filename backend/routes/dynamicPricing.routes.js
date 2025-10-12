const express = require('express');
const router = express.Router();
const { recalculatePrices } = require('../services/dynamicPricingService');

router.post('/recalculate', async (req, res) => {
  try {
    const dryRun = String(req.query.dryRun || 'false') === 'true';
    const result = await recalculatePrices({ dryRun });
    return res.json({ ok: true, count: result.length, result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

router.post('/recalculate/:id', async (req, res) => {
  try {
    const dryRun = String(req.query.dryRun || 'false') === 'true';
    const arrangementId = Number(req.params.id);
    const result = await recalculatePrices({ arrangementId, dryRun });
    return res.json({ ok: true, count: result.length, result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;