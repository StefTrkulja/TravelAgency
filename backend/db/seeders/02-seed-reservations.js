'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const reservations = [
      {
        code: 'RES-ST-001',
        startsAt: new Date('2025-09-10T12:00:00Z'),
        endsAt: new Date('2025-09-15T12:00:00Z'),
        customerUsername: 'stefan123',
      },
      {
        code: 'RES-ST-002',
        startsAt: new Date('2025-10-01T14:00:00Z'),
        endsAt: new Date('2025-10-05T10:00:00Z'),
        customerUsername: 'stefan123',
      },
      {
        code: 'RES-ST-003',
        startsAt: new Date('2025-11-20T09:00:00Z'),
        endsAt: new Date('2025-11-25T18:00:00Z'),
        customerUsername: 'stefan123',
      },
      {
        code: 'RES-JO-001',
        startsAt: new Date('2025-09-12T10:00:00Z'),
        endsAt: new Date('2025-09-14T20:00:00Z'),
        customerUsername: 'jovan123',
      },
      {
        code: 'RES-JO-002',
        startsAt: new Date('2025-12-05T08:00:00Z'),
        endsAt: new Date('2025-12-12T22:00:00Z'),
        customerUsername: 'jovan123',
      },
    ];

    // Add 25 more reservations to reach 30 total
    const customers = ['stefan123', 'jovan123'];
    const baseDate = new Date('2025-01-01');
    
    for (let i = 6; i <= 30; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const customerCode = customer === 'stefan123' ? 'ST' : 'JO';
      const startDate = new Date(baseDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000);
      const duration = Math.floor(Math.random() * 10 + 3); // 3-12 days
      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
      
      reservations.push({
        code: `RES-${customerCode}-${String(i).padStart(3, '0')}`,
        startsAt: startDate,
        endsAt: endDate,
        customerUsername: customer,
      });
    }

    return queryInterface.bulkInsert('reservations', reservations, {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('reservations', null, {});
  }
};
