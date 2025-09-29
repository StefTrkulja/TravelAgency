'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const escalations = [];
    const escalationReasons = [
      'Customer dissatisfied with initial resolution',
      'Complex technical issue requires management review',
      'Policy exception needed for special circumstances',
      'High-priority customer complaint',
      'Legal implications identified',
      'Compensation amount exceeds operator authority',
      'Repeated complaints from same customer',
      'Safety concerns require immediate attention',
      'Vendor relationship issue needs management input',
      'Quality standards violation detected',
      'Regulatory compliance issue identified',
      'Customer threatening legal action',
      'Media attention potential identified',
      'System failure impact assessment needed',
      'Training deficiency identified in staff',
      'Process improvement opportunity recognized',
      'Budget approval required for resolution',
      'Expert consultation needed',
      'Cross-departmental coordination required',
      'Timeline extension beyond standard limits',
      'Resource allocation decision needed',
      'Partnership agreement interpretation required',
      'Insurance claim evaluation needed',
      'Technical specification clarification required',
      'Contract terms dispute resolution',
      'Emergency response protocol activation',
      'Quality assurance review triggered',
      'Compliance audit finding follow-up',
      'Customer loyalty program exception',
      'Service level agreement breach analysis'
    ];

    const statusOptions = ['PENDING', 'ACCEPTED', 'REJECTED', 'RESOLVED', 'CLOSED'];

    for (let i = 1; i <= 30; i++) {
      const escalatedAt = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000);
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      escalations.push({
        complaintId: i, // Use sequential IDs to avoid duplicates (1-30)
        reason: escalationReasons[i - 1],
        escalatedAt: escalatedAt,
        status: status,
        managerNote: status === 'RESOLVED' ? 'Issue resolved after management review' : null,
        managerUsername: ['RESOLVED', 'REJECTED', 'CLOSED'].includes(status) ? 'anja123' : null
      });
    }

    await queryInterface.bulkInsert('escalations', escalations, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('escalations', null, {});
  }
};