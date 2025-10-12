// backend/routes/statistics.routes.js
const express = require('express');
const router = express.Router();

const statsSvc = require('../services/arrangementStats.service');
const { verifyToken } = require('../utils/jwtParser');

// Helpers: bezbedno parsiranje datuma iz query-a
function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * GET /api/statistics/arrangements
 * Admin-only lista, opcioni filteri ?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
router.get('/arrangements', verifyToken('ADMIN'), async (req, res) => {
  try {
    const from = parseDateOrNull(req.query.from);
    const to   = parseDateOrNull(req.query.to);

    if (req.query.from && !from) {
      return res.status(400).json({ success: false, error: 'Invalid "from" date format' });
    }
    if (req.query.to && !to) {
      return res.status(400).json({ success: false, error: 'Invalid "to" date format' });
    }
    if (from && to && to < from) {
      return res.status(400).json({ success: false, error: '"to" must be on/after "from"' });
    }

    // prosledi sirove ISO stringove ili null (statsSvc nek odluči kako filtrira)
    const data = await statsSvc.getAllStatistics({
      from: from ? from.toISOString() : null,
      to:   to   ? to.toISOString()   : null,
    });

    return res.json({ success: true, data });
  } catch (e) {
    console.error('[STATS] /arrangements error:', e);
    return res.status(500).json({ success: false, error: e.message || 'Server error' });
  }
});

/**
 * GET /api/statistics/arrangements/:id
 * Detaljna statistika za jedan aranžman (ADMIN, MANAGER)
 */
router.get('/arrangements/:id', verifyToken('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: 'Invalid arrangement ID' });
    }

    const data = await statsSvc.getStatisticsForArrangement(id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Statistics not found' });
    }

    return res.json({ success: true, data });
  } catch (e) {
    console.error('[STATS:ONE] error:', e);
    return res.status(500).json({ success: false, error: e.message || 'Server error' });
  }
});

/**
 * POST /api/statistics/arrangements/:id/update-stats
 * (po potrebi) re-kalkuliše statistiku za aranžman
 * Ako želiš zaštitu, dodaj verifyToken('ADMIN') ili slično.
 */
router.post('/arrangements/:id/update-stats', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, error: 'Invalid arrangement ID' });
    }

    const ok = await statsSvc.updateArrangementStats(id);
    if (!ok) {
      return res.status(404).json({ success: false, error: 'Arrangement not found or update failed' });
    }

    return res.json({ success: true, message: 'Statistics updated successfully' });
  } catch (e) {
    console.error('[STATS:UPDATE] error:', e);
    return res.status(500).json({ success: false, error: e.message || 'Server error' });
  }
});

module.exports = router;
