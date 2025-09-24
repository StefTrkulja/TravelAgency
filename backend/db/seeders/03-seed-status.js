'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('statuses', [
      {
        id: 1,
        code: 'PENDING',
        name: 'Pending',
        description: 'Initial state after a complaint is submitted by the customer',
        orderIndex: 1,
        parentId: null,
      },
      {
        id: 2,
        code: 'IN_PROGRESS',
        name: 'In progress',
        description: 'Operator is actively working on the complaint',
        orderIndex: 2,
        parentId: null,
      },
      {
        id: 3,
        code: 'WAITING_INFO',
        name: 'Waiting for information',
        description: 'Additional information is required from the customer',
        orderIndex: 3,
        parentId: null,
      },
      {
        id: 4,
        code: 'ESCALATED',
        name: 'Escalated',
        description: 'Complaint has been escalated to the manager for further processing',
        orderIndex: 4,
        parentId: null,
      },
      {
        id: 5,
        code: 'CLOSED',
        name: 'Closed',
        description: 'Complaint has been resolved and the official response sent',
        orderIndex: 5,
        parentId: null,
      },
      {
        id: 6,
        code: 'REJECTED',
        name: 'Rejected',
        description: 'Complaint does not meet requirements or has been resolved negatively',
        orderIndex: 6,
        parentId: null,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('statuses', null, {});
  }
};
