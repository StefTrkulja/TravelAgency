'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const escalationMessages = [];
    const messageTexts = [
      'This case requires immediate management attention due to its complexity.',
      'Customer has expressed strong dissatisfaction with the current resolution.',
      'The requested compensation exceeds my authorization limit.',
      'Legal implications have been identified in this complaint.',
      'This issue may require policy exception approval.',
      'Customer is threatening to escalate to regulatory authorities.',
      'Technical expertise beyond my scope is needed for proper resolution.',
      'The complaint involves potential safety violations that need review.',
      'Customer has mentioned potential media involvement.',
      'This case requires cross-departmental coordination to resolve.',
      'The issue appears to be systemic and may affect other customers.',
      'Customer has provided additional evidence that changes the case scope.',
      'Resolution requires budget approval beyond standard limits.',
      'The complaint reveals potential process improvement opportunities.',
      'Customer satisfaction scores are being significantly impacted.',
      'This case involves interpretation of complex contract terms.',
      'External vendor relationship issues need management input.',
      'The resolution timeline has exceeded our standard commitments.',
      'Quality assurance review has identified training needs.',
      'Customer loyalty program exceptions need management approval.',
      'Insurance claim evaluation is required for proper resolution.',
      'Regulatory compliance concerns have been raised.',
      'The complaint involves interpretation of service level agreements.',
      'Partnership agreement clarification is needed.',
      'Emergency response protocols may need to be activated.',
      'The case requires expert consultation from external specialists.',
      'System failure root cause analysis is needed.',
      'Customer relationship management strategy needs review.',
      'Resource allocation decisions are impacting resolution capability.',
      'The complaint has revealed gaps in current operational procedures.'
    ];

    for (let i = 1; i <= 30; i++) {
      const createdAt = new Date(Date.now() - Math.random() * 8 * 24 * 60 * 60 * 1000);
      
      escalationMessages.push({
        escalationId: Math.floor(Math.random() * 30) + 1, // Random escalation ID (1-30)
        content: messageTexts[i - 1], // Use 'content' instead of 'text'
        authorUsername: Math.random() > 0.5 ? 'ana123' : 'anja123', // Either operator or manager
        createdAt: createdAt
      });
    }

    await queryInterface.bulkInsert('escalation_messages', escalationMessages, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('escalation_messages', null, {});
  }
};