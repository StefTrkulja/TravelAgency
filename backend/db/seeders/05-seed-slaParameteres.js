'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Predložene vrednosti:
    // CRITICAL: response 15 min, resolution 120  (2h)
    // HIGH:     response 30 min, resolution 240  (4h)
    // MEDIUM:   response 60 min, resolution 480  (8h)
    // LOW:      response 120 min, resolution 1440 (24h)

    await queryInterface.bulkInsert('sla_parameter', [
      { priority: 'CRITICAL', targetResponseMins: 15,  targetResolutionMins: 120,  isActive: true},
      { priority: 'HIGH',     targetResponseMins: 30,  targetResolutionMins: 240,  isActive: true},
      { priority: 'MEDIUM',   targetResponseMins: 60,  targetResolutionMins: 480,  isActive: true},
      { priority: 'LOW',      targetResponseMins: 120, targetResolutionMins: 1440, isActive: true},
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('sla_parameter', null, {});
  },
};
