'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('status_transitions', [
      // PENDING → In progress / Waiting for information / Rejected
      { id: 1, fromStatusId: 1, toStatusId: 2 },
      { id: 2, fromStatusId: 1, toStatusId: 3 },
      { id: 3, fromStatusId: 1, toStatusId: 6 },

      // IN_PROGRESS → Waiting for information / Escalated / Closed / Rejected
      { id: 4, fromStatusId: 2, toStatusId: 3 },
      { id: 5, fromStatusId: 2, toStatusId: 4 },
      { id: 6, fromStatusId: 2, toStatusId: 5 },
      { id: 7, fromStatusId: 2, toStatusId: 6 },

      // WAITING_INFO → In progress / Rejected
      { id: 8, fromStatusId: 3, toStatusId: 2 },
      { id: 9, fromStatusId: 3, toStatusId: 6 },

      // ESCALATED → In progress / Closed / Rejected
      { id: 10, fromStatusId: 4, toStatusId: 2 },
      { id: 11, fromStatusId: 4, toStatusId: 5 },
      { id: 12, fromStatusId: 4, toStatusId: 6 },

      // CLOSED → (terminal, no outgoing transitions)
      // REJECTED → (terminal, no outgoing transitions)
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('status_transitions', null, {});
  }
};
