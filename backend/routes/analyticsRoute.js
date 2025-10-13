const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');
const jwtParser = require('../utils/jwtParser');
const { StatusEnum } = require('../utils/result');

// Get SLA targets achievement percentage
router.get('/sla-targets',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { timeRange } = req.query;
    const result = await AnalyticsService.getSlaTargetsAchievement({ timeRange });

    if (result.status === StatusEnum.FAIL) {
      return res.status(result.code).json({ errors: result.errors });
    }

    return res.status(result.code).json(result.data);
  }
);

// Get tickets nearing SLA breach
router.get('/tickets-nearing-breach',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await AnalyticsService.getTicketsNearingBreach();

    if (result.status === StatusEnum.FAIL) {
      return res.status(result.code).json({ errors: result.errors });
    }

    return res.status(result.code).json(result.data);
  }
);

// Get active tickets count (breached vs unbreached)
router.get('/active-tickets',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await AnalyticsService.getActiveTicketsCount();

    if (result.status === StatusEnum.FAIL) {
      return res.status(result.code).json({ errors: result.errors });
    }

    return res.status(result.code).json(result.data);
  }
);

// Get customer satisfaction data
router.get('/customer-satisfaction',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { timeRange } = req.query;
    const result = await AnalyticsService.getCustomerSatisfaction({ timeRange });

    if (result.status === StatusEnum.FAIL) {
      return res.status(result.code).json({ errors: result.errors });
    }

    return res.status(result.code).json(result.data);
  }
);

// Get SLA targets for today specifically
router.get('/sla-targets-today',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await AnalyticsService.getSlaTargetsToday();

    if (result.status === StatusEnum.FAIL) {
      return res.status(result.code).json({ errors: result.errors });
    }

    return res.status(result.code).json(result.data);
  }
);

// Get comprehensive dashboard data (all analytics in one call)
router.get('/dashboard',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    try {
      const { timeRange } = req.query;

      // Fetch all analytics data in parallel
      const [slaTargets, nearingBreach, activeTickets, customerSatisfaction, slaTargetsToday, ticketsPerDay] = await Promise.all([
        AnalyticsService.getSlaTargetsAchievement({ timeRange }),
        AnalyticsService.getTicketsNearingBreach(),
        AnalyticsService.getActiveTicketsCount(),
        AnalyticsService.getCustomerSatisfaction({ timeRange }),
        AnalyticsService.getSlaTargetsToday(),
        AnalyticsService.getTicketsPerDay({ timeRange })
      ]);

      // Check if any failed and log detailed errors
      if (slaTargets.status === StatusEnum.FAIL) {
        console.error('SLA Targets failed:', slaTargets.errors);
        return res.status(slaTargets.code).json({ errors: slaTargets.errors });
      }
      if (nearingBreach.status === StatusEnum.FAIL) {
        console.error('Nearing Breach failed:', nearingBreach.errors);
        return res.status(nearingBreach.code).json({ errors: nearingBreach.errors });
      }
      if (activeTickets.status === StatusEnum.FAIL) {
        console.error('Active Tickets failed:', activeTickets.errors);
        return res.status(activeTickets.code).json({ errors: activeTickets.errors });
      }
      if (customerSatisfaction.status === StatusEnum.FAIL) {
        console.error('Customer Satisfaction failed:', customerSatisfaction.errors);
        return res.status(customerSatisfaction.code).json({ errors: customerSatisfaction.errors });
      }
      if (slaTargetsToday.status === StatusEnum.FAIL) {
        console.error('SLA Targets Today failed:', slaTargetsToday.errors);
        return res.status(slaTargetsToday.code).json({ errors: slaTargetsToday.errors });
      }
      if (ticketsPerDay.status === StatusEnum.FAIL) {
        console.error('Tickets Per Day failed:', ticketsPerDay.errors);
        return res.status(ticketsPerDay.code).json({ errors: ticketsPerDay.errors });
      }

      // Combine all data
      const dashboardData = {
        slaTargets: slaTargets.data,
        ticketsNearingBreach: nearingBreach.data,
        activeTickets: activeTickets.data,
        customerSatisfaction: customerSatisfaction.data,
        slaTargetsToday: slaTargetsToday.data,
        ticketsPerDay: ticketsPerDay.data
      };

      return res.status(200).json(dashboardData);
    } catch (error) {
      console.error('Dashboard endpoint error:', error);
      return res.status(500).json({ errors: [{ message: error.message, stack: error.stack }] });
    }
  }
);

// Get Operator Performance Report (uses PL/pgSQL function)
router.get('/operator-performance-report',
  jwtParser.extractTokenUser,
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    try {
      const { startDate, endDate } = req.query;
      const result = await AnalyticsService.getOperatorPerformanceReport({ startDate, endDate });

      if (result.status === StatusEnum.FAIL) {
        return res.status(result.code).json({ errors: result.errors });
      }

      return res.status(result.code).json(result.data);
    } catch (error) {
      console.error('Operator Performance Report error:', error);
      return res.status(500).json({ errors: [{ message: error.message }] });
    }
  }
);

module.exports = router;