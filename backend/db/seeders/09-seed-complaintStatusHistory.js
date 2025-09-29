'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const statusHistory = [];
    const statuses = [1, 2, 3, 4, 5, 6, 7]; // Available status IDs
    const changeReasons = [
      'Initial complaint submission',
      'Operator started working on the case',
      'Additional information requested from customer',
      'Case escalated due to complexity',
      'Issue resolved successfully',
      'Complaint rejected due to policy violation',
      'New complaint awaiting triage',
      'Customer provided requested information',
      'Manager review completed',
      'Policy exception approved',
      'External vendor consultation required',
      'Legal department review needed',
      'Customer satisfaction confirmed',
      'Duplicate complaint identified',
      'Emergency priority escalation',
      'System error correction',
      'Supervisor intervention required',
      'Compliance check completed',
      'Quality assurance review',
      'Customer follow-up completed',
      'Vendor response received',
      'Documentation update required',
      'Process improvement identified',
      'Training requirement identified',
      'Resource allocation adjusted',
      'Timeline extension approved',
      'Budget approval received',
      'Technical issue resolved',
      'Policy clarification provided',
      'Final resolution documented'
    ];

    const usernames = ['ana123', 'anja123', 'boris123'];

    for (let i = 1; i <= 30; i++) {
      const changedAt = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000);
      
      statusHistory.push({
        complaintId: Math.floor(Math.random() * 30) + 1, // Random complaint ID (1-30)
        fromStatusId: statuses[Math.floor(Math.random() * statuses.length)],
        toStatusId: statuses[Math.floor(Math.random() * statuses.length)],
        changedByUsername: usernames[Math.floor(Math.random() * usernames.length)],
        note: changeReasons[i - 1], // Use 'note' instead of 'reason'
        changedAt: changedAt
      });
    }

    await queryInterface.bulkInsert('complaint_status_history', statusHistory, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('complaint_status_history', null, {});
  }
};