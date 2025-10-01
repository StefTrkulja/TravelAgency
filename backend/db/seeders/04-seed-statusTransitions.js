'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('status_transitions', [
      // PENDING → In progress / Waiting for information / Rejected / Escalated
      { id: 1, fromStatusId: 1, toStatusId: 2 },
      { id: 2, fromStatusId: 1, toStatusId: 3 },
      { id: 3, fromStatusId: 1, toStatusId: 6 },
      { id: 15, fromStatusId: 1, toStatusId: 4 }, // PENDING → ESCALATED

      // IN_PROGRESS → Waiting for information / Escalated / Closed / Rejected
      { id: 4, fromStatusId: 2, toStatusId: 3 },
      { id: 5, fromStatusId: 2, toStatusId: 4 },
      { id: 6, fromStatusId: 2, toStatusId: 5 },
      { id: 7, fromStatusId: 2, toStatusId: 6 },

      // WAITING_INFO → In progress / Rejected / Escalated
      { id: 8, fromStatusId: 3, toStatusId: 2 },
      { id: 9, fromStatusId: 3, toStatusId: 6 },
      { id: 16, fromStatusId: 3, toStatusId: 4 }, // WAITING_INFO → ESCALATED

      // ESCALATED →  Closed / Rejected
      { id: 11, fromStatusId: 4, toStatusId: 5 },
      { id: 12, fromStatusId: 4, toStatusId: 6 },

      // ➕ NEW → Pending (accept & set priority)
      { id: 13, fromStatusId: 7, toStatusId: 1 },

      // ➕ (opciono) NEW → Rejected (ako odmah odbijete u triage)
      { id: 14, fromStatusId: 7, toStatusId: 6 },

      // CLOSED / REJECTED → terminal (nema izlaza)
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('status_transitions', null, {});
  }
};
