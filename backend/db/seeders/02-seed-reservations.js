'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('reservations', [
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
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('reservations', null, {});
  }
};
