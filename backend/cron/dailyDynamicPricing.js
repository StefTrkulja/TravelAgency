const cron = require('node-cron');
const { recalculatePrices } = require('../services/dynamicPricingService');

const TIMEZONE = 'Europe/Podgorica';
const SCHEDULE = process.env.DP_CRON || '0 3 * * *'; // svaki dan u 03:00
//const SCHEDULE = process.env.DP_CRON || '*/5 * * * * *'; // svakih 5 sekundi
function startDailyDynamicPricingCron() {
  cron.schedule(SCHEDULE, async () => {
    try {
      // opcija: bez dryRun u produkciji
      const result = await recalculatePrices({ dryRun: false });
      console.log(`[DP] daily run changed=${result.filter(r => r.status === 'CHANGED').length}`);
    } catch (e) {
      console.error('[DP] cron error', e);
    }
  }, { timezone: TIMEZONE });
}

module.exports = { startDailyDynamicPricingCron };