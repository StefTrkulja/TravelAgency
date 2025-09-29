'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const slaTracking = [];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const slaParams = {
      'CRITICAL': { response: 15, resolution: 120 },
      'HIGH': { response: 30, resolution: 240 },
      'MEDIUM': { response: 60, resolution: 480 },
      'LOW': { response: 120, resolution: 1440 }
    };

    for (let i = 1; i <= 30; i++) {
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const params = slaParams[priority];
      
      const createdAt = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
      const responseDueAt = new Date(createdAt.getTime() + params.response * 60 * 1000);
      
      // Randomly decide if response was given and when
      const hasResponse = Math.random() > 0.3; // 70% have responses
      const firstResponseAt = hasResponse ? 
        new Date(createdAt.getTime() + Math.random() * params.response * 60 * 1000) : null;
      
      // Response breach check
      const responseBreached = hasResponse ? firstResponseAt > responseDueAt : 
        new Date() > responseDueAt;
      
      // Resolution timing
      const hasStartedWork = hasResponse && Math.random() > 0.2; // 80% of responded cases have started work
      const resolutionStartedAt = hasStartedWork ? firstResponseAt : null;
      const resolutionDueAt = hasStartedWork ? 
        new Date(resolutionStartedAt.getTime() + params.resolution * 60 * 1000) : null;
      
      // Random paused time (some cases get paused)
      const wasPaused = hasStartedWork && Math.random() > 0.7; // 30% get paused
      const totalPausedMs = wasPaused ? Math.random() * 2 * 60 * 60 * 1000 : 0; // Up to 2 hours pause
      
      // Resolution
      const isResolved = hasStartedWork && Math.random() > 0.4; // 60% of started cases are resolved
      const resolvedAt = isResolved ? 
        new Date(resolutionStartedAt.getTime() + Math.random() * params.resolution * 60 * 1000 + totalPausedMs) : null;
      
      // Resolution breach check
      const resolutionBreached = isResolved && resolutionDueAt ? resolvedAt > resolutionDueAt : false;
      
      // Calculate effective resolution time
      const effectiveResolutionMs = isResolved && resolutionStartedAt ? 
        resolvedAt.getTime() - resolutionStartedAt.getTime() - totalPausedMs : null;
      
      // First response time
      const firstResponseMs = hasResponse ? 
        firstResponseAt.getTime() - createdAt.getTime() : null;
      
      // Breach count
      let breachesCount = 0;
      if (responseBreached) breachesCount++;
      if (resolutionBreached) breachesCount++;
      
      // At risk logic (for active cases) - More tickets nearing breach
      const isAtRisk = !isResolved && Math.random() > 0.4; // 60% of active cases at risk
      const atRiskType = isAtRisk ? (hasResponse ? 'RESOLUTION' : 'RESPONSE') : null;
      const atRiskSince = isAtRisk ? new Date(Date.now() - Math.random() * 60 * 60 * 1000) : null;
      
      // Make some tickets near breach (within 30 minutes)
      let adjustedResponseDueAt = responseDueAt;
      let adjustedResolutionDueAt = resolutionDueAt;
      
      if (i <= 8 && !isResolved) { // First 8 tickets near breach
        const now = new Date();
        const nearBreachTime = 15 * 60 * 1000; // 15 minutes
        
        if (!hasResponse) {
          // Set response due soon
          adjustedResponseDueAt = new Date(now.getTime() + nearBreachTime);
        } else if (resolutionStartedAt) {
          // Set resolution due soon
          adjustedResolutionDueAt = new Date(now.getTime() + nearBreachTime);
        }
      }

      slaTracking.push({
        id: i, // Same as complaint ID for 1:1 relationship
        appliedResponseMins: params.response,
        appliedResolutionMins: params.resolution,
        responseDueAt: adjustedResponseDueAt,
        firstResponseAt: firstResponseAt,
        responseBreachedChecked: hasResponse || new Date() > adjustedResponseDueAt,
        responseBreached: responseBreached,
        resolutionStartedAt: resolutionStartedAt,
        resolutionDueAt: adjustedResolutionDueAt,
        pauseStartedAt: null, // Only active during pause, so null for historical data
        totalPausedMs: totalPausedMs,
        resolvedAt: resolvedAt,
        resolutionBreachedChecked: isResolved,
        resolutionBreached: resolutionBreached,
        breachReason: breachesCount > 0 ? (responseBreached ? 'first_response_late' : 'resolution_late') : null,
        atRiskSince: atRiskSince,
        atRiskType: atRiskType,
        firstResponseMs: firstResponseMs,
        effectiveResolutionMs: effectiveResolutionMs,
        breachesCount: breachesCount,
        lastCheckedAt: new Date()
      });
    }

    await queryInterface.bulkInsert('sla_tracking', slaTracking, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sla_tracking', null, {});
  }
};