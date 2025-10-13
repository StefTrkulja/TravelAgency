'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const complaints = [];
    const slaTrackings = [];

    // Kategorije zalbi
    const categories = [
      'BOOKING_ERROR', 'REFUND_REQUEST', 'SERVICE_QUALITY', 
      'ACCOMMODATION_ISSUE', 'TRANSPORT_DELAY', 'PRICING_DISPUTE',
      'CANCELLATION', 'CUSTOMER_SERVICE', 'WEBSITE_TECHNICAL',
      'PAYMENT_ISSUE'
    ];

    // Priority levels sa SLA parametrima (u minutama)
    const priorities = [
      { priority: 'LOW', responseMins: 1440, resolutionMins: 10080 },      // 24h, 7 dana
      { priority: 'MEDIUM', responseMins: 480, resolutionMins: 4320 },     // 8h, 3 dana
      { priority: 'HIGH', responseMins: 240, resolutionMins: 2880 },       // 4h, 2 dana
      { priority: 'CRITICAL', responseMins: 60, resolutionMins: 1440 }     // 1h, 1 dan
    ];

    // Statusi (biracemo IN_PROGRESS, WAITING_INFO, ESCALATED, CLOSED)
    const statuses = [2, 3, 4, 5]; // IN_PROGRESS, WAITING_INFO, ESCALATED, CLOSED

    // Datumi: danas, juče, prekjuče
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    
    const dates = [today, yesterday, dayBeforeYesterday];

    // Generisanje 1000 zalbi
    for (let i = 1; i <= 3000; i++) {
      // Rotacija po datumima (danas, juče, prekjuče)
      const createdAt = dates[i % 3];
      const createdAtWithTime = new Date(createdAt);
      // Random vrijeme izmjedju 8h i 20h
      const randomHour = 8 + Math.floor(Math.random() * 12);
      const randomMinute = Math.floor(Math.random() * 60);
      createdAtWithTime.setHours(randomHour, randomMinute, 0);

      // Random priority
      const priorityObj = priorities[Math.floor(Math.random() * priorities.length)];
      
      // Random status
      const statusId = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Random category
      const category = categories[Math.floor(Math.random() * categories.length)];

      // Last activity = createdAt + neka random minuta
      const lastActivityAt = new Date(createdAtWithTime);
      lastActivityAt.setMinutes(lastActivityAt.getMinutes() + Math.floor(Math.random() * 120));

      // Complaint
      complaints.push({
        id: i,
        subject: `Complaint #${i} - ${category}`,
        description: `This is a test complaint number ${i}. Customer stefan123 reported an issue with ${category.toLowerCase().replace('_', ' ')}.`,
        priority: priorityObj.priority,
        createdAt: createdAtWithTime,
        lastActivityAt: lastActivityAt,
        category: category,
        statusId: statusId,
        reservationId: 1 + (i % 30), // reservations imaju ID 1-30
        createdByUsername: 'stefan123',
        assigneeUsername: 'ana123',
      });

      // SLA Tracking (deli PK sa complaint)
      const responseDueAt = new Date(createdAtWithTime);
      responseDueAt.setMinutes(responseDueAt.getMinutes() + priorityObj.responseMins);

      const resolutionDueAt = new Date(createdAtWithTime);
      resolutionDueAt.setMinutes(resolutionDueAt.getMinutes() + priorityObj.resolutionMins);

      // Simuliraj da li je prvi odgovor dat
      const hasFirstResponse = Math.random() > 0.2; // 80% ima first response
      const firstResponseAt = hasFirstResponse 
        ? new Date(createdAtWithTime.getTime() + Math.random() * priorityObj.responseMins * 60000)
        : null;
      
      const responseBreached = hasFirstResponse 
        ? firstResponseAt > responseDueAt 
        : now > responseDueAt;

      // Simuliraj da li je resolved
      const isResolved = statusId === 5; // CLOSED status
      const resolvedAt = isResolved 
        ? new Date(createdAtWithTime.getTime() + Math.random() * priorityObj.resolutionMins * 60000)
        : null;
      
      const resolutionBreached = isResolved 
        ? resolvedAt > resolutionDueAt 
        : false;

      // Pauze (random za neke)
      const hasPause = Math.random() > 0.7; // 30% ima pauze
      const totalPausedMs = hasPause ? Math.floor(Math.random() * 3600000) : 0; // do 1h

      // At-risk (ako nije resolved i blizu je deadline)
      let atRiskSince = null;
      let atRiskType = null;
      if (!isResolved) {
        const timeUntilResponseDue = responseDueAt - now;
        const timeUntilResolutionDue = resolutionDueAt - now;
        const warningThreshold = 0.2; // 20% prije isteka

        if (!hasFirstResponse && timeUntilResponseDue < priorityObj.responseMins * 60000 * warningThreshold) {
          atRiskSince = new Date(now.getTime() - Math.random() * 3600000);
          atRiskType = 'RESPONSE';
        } else if (timeUntilResolutionDue < priorityObj.resolutionMins * 60000 * warningThreshold) {
          atRiskSince = new Date(now.getTime() - Math.random() * 3600000);
          atRiskType = 'RESOLUTION';
        }
      }

      // Metrike
      const firstResponseMs = hasFirstResponse 
        ? firstResponseAt.getTime() - createdAtWithTime.getTime() 
        : null;
      
      const effectiveResolutionMs = isResolved 
        ? resolvedAt.getTime() - createdAtWithTime.getTime() - totalPausedMs 
        : null;

      // Broj breach-eva
      let breachesCount = 0;
      if (responseBreached) breachesCount++;
      if (resolutionBreached) breachesCount++;

      slaTrackings.push({
        id: i, // Isti kao complaint.id
        appliedResponseMins: priorityObj.responseMins,
        appliedResolutionMins: priorityObj.resolutionMins,
        responseDueAt: responseDueAt,
        firstResponseAt: firstResponseAt,
        responseBreachedChecked: hasFirstResponse || now > responseDueAt,
        responseBreached: responseBreached,
        resolutionStartedAt: createdAtWithTime, // Odmah započinje
        resolutionDueAt: resolutionDueAt,
        pauseStartedAt: null,
        totalPausedMs: totalPausedMs,
        resolvedAt: resolvedAt,
        resolutionBreachedChecked: isResolved,
        resolutionBreached: resolutionBreached,
        breachReason: breachesCount > 0 ? 'High workload' : null,
        atRiskSince: atRiskSince,
        atRiskType: atRiskType,
        firstResponseMs: firstResponseMs,
        effectiveResolutionMs: effectiveResolutionMs,
        breachesCount: breachesCount,
        lastCheckedAt: now,
      });
    }

    // Insert u bazu
    await queryInterface.bulkInsert('complaints', complaints, {});
    await queryInterface.bulkInsert('sla_tracking', slaTrackings, {});

    console.log('✓ Seeded 1000 complaints with SLA tracking');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sla_tracking', { id: { [Sequelize.Op.between]: [1, 1000] } }, {});
    await queryInterface.bulkDelete('complaints', { id: { [Sequelize.Op.between]: [1, 1000] } }, {});
  }
};
