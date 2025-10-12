const { sequelize, TravelArrangement, ArrangementStats, DynamicPriceChange } = require('../models');
const { Op } = require('sequelize');
const { differenceInCalendarDays } = require('date-fns');

const FLOOR_MULTIPLIER = 0.70; // 70% od basePrice
const DAILY_CHANGE_CAP = 0.15; // max +-15% po danu

function clampDailyChange(oldPrice, proposedPrice) {
  const maxUp = oldPrice * (1 + DAILY_CHANGE_CAP);
  const maxDown = oldPrice * (1 - DAILY_CHANGE_CAP);
  return Math.min(Math.max(proposedPrice, maxDown), maxUp);
}

function applyRules({ currentPrice, basePrice, occupancyRate, daysToDeparture }) {
  let ruleApplied = 'NO_CHANGE';
  let factor = 1.0;

  if (occupancyRate == null) return { newPrice: currentPrice, ruleApplied };

  if (daysToDeparture > 21) {
    if (occupancyRate < 50) {
      factor = 0.95; ruleApplied = 'LOW_DEMAND_DROP_5';
    } else if (occupancyRate >= 80) {
      factor = 1.10; ruleApplied = 'HIGH_DEMAND_UP_10';
    }
  } else if (daysToDeparture >= 7) {
    if (occupancyRate >= 80) {
      factor = 1.10; ruleApplied = 'HIGH_DEMAND_UP_10';
    }
  } else { // < 7 dana
    if (occupancyRate < 30) {
      factor = 0.92; ruleApplied = 'LAST_MINUTE_DROP_8';
    }
  }

  let proposed = Number(currentPrice) * factor;

  // floor na osnovu basePrice
  const floor = Number(basePrice) * FLOOR_MULTIPLIER;
  if (proposed < floor) {
    proposed = floor;
    if (ruleApplied !== 'NO_CHANGE') ruleApplied += '_FLOORED';
  }

  // cap po danu
  const capped = clampDailyChange(Number(currentPrice), proposed);
  if (capped !== proposed && ruleApplied !== 'NO_CHANGE') {
    ruleApplied += '_CAPPED';
  }

  return { newPrice: capped, ruleApplied };
}

async function recalculatePrices({ arrangementId = null, dryRun = false } = {}) {
  // Učitaj target aranžmane
  const where = arrangementId ? { id: arrangementId } : {};
  const arrangements = await TravelArrangement.findAll({ where });

  const now = new Date();
  const results = [];

  for (const arr of arrangements) {
    // Učitaj stats (pretpostavka: jedan red po aranžmanu)
    const stats = await ArrangementStats.findOne({ where: { arrangementId: arr.id } });
    if (!stats) {
      results.push({ arrangementId: arr.id, status: 'SKIPPED_NO_STATS' });
      continue;
    }

    const daysToDeparture = arr.dateFrpm ? differenceInCalendarDays(arr.dateFrpm, now) : 999;
    const occupancyRate = stats.occupancyRate != null ? Number(stats.occupancyRate) : null;

    const { newPrice, ruleApplied } = applyRules({
      currentPrice: arr.basePricePerPerson,
      basePrice: arr.basePrice,
      occupancyRate,
      daysToDeparture,
    });

    const oldPrice = Number(arr.basePricePerPerson);
    const changed = Number(newPrice.toFixed(2)) !== Number(oldPrice.toFixed(2));

    const explanation = `occ=${occupancyRate ?? 'n/a'}%, days=${daysToDeparture}, old=${oldPrice}, new=${newPrice}`;

    if (!changed || ruleApplied === 'NO_CHANGE') {
      results.push({ arrangementId: arr.id, status: 'NO_CHANGE', ruleApplied, explanation });
      continue;
    }

    if (dryRun) {
      results.push({
        arrangementId: arr.id,
        status: 'DRY_RUN_CHANGE',
        oldPrice,
        newPrice,
        ruleApplied,
        explanation,
      });
      continue;
    }

    // Transakcija + red lock
    await sequelize.transaction(async (t) => {
      const locked = await TravelArrangement.findOne({
        where: { id: arr.id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      const oldLockedPrice = Number(locked.basePricePerPerson);

      // Ponovi račun (idempotentnost pod concurrency-jem)
      const { newPrice: reNew, ruleApplied: reRule } = applyRules({
        currentPrice: oldLockedPrice,
        basePrice: locked.basePricePerPerson,
        occupancyRate,
        daysToDeparture,
      });

      // Ako i dalje ima promjene — upiši
      if (Number(reNew.toFixed(2)) !== Number(oldLockedPrice.toFixed(2))) {
        await locked.update({ currentPrice: reNew }, { transaction: t });

        await DynamicPriceChange.create({
          arrangementId: locked.id,
          oldPrice: oldLockedPrice,
          newPrice: reNew,
          ruleApplied: reRule,
          explanation,
          meta: {
            occupancyRate,
            daysToDeparture,
            statsSnapshot: {
              totalReservations: stats.totalReservations,
              totalPeople: stats.totalPeople,
              totalRevenue: stats.totalRevenue,
            },
          },
        }, { transaction: t });

        results.push({
          arrangementId: locked.id,
          status: 'CHANGED',
          oldPrice: oldLockedPrice,
          newPrice: reNew,
          ruleApplied: reRule,
          explanation,
        });
      } else {
        results.push({ arrangementId: locked.id, status: 'NO_CHANGE_POST_LOCK', ruleApplied: reRule });
      }
    });
  }

  return results;
}

module.exports = { recalculatePrices };