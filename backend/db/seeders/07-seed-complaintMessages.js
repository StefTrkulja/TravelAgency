'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const messages = [];
    const messageTexts = [
      'Hello, I am experiencing issues with my recent booking.',
      'Could you please help me resolve this matter quickly?',
      'I have been waiting for a response for several hours.',
      'The service quality was not as expected during my trip.',
      'I would like to request a full refund for this booking.',
      'Please escalate this issue to your manager.',
      'Thank you for your assistance with this matter.',
      'I am not satisfied with the proposed resolution.',
      'Could you provide more details about the compensation?',
      'I have additional documentation to support my complaint.',
      'The staff was very helpful during my visit.',
      'I understand the delay was due to weather conditions.',
      'Please confirm the refund has been processed.',
      'I would like to speak with a supervisor.',
      'The accommodation exceeded my expectations.',
      'I am still experiencing the same problem.',
      'Could you provide an update on my case?',
      'I appreciate your prompt response to this issue.',
      'The tour guide was knowledgeable and professional.',
      'I have concerns about the safety measures.',
      'Please provide written confirmation of the resolution.',
      'I would recommend this service to others.',
      'The booking process was confusing and unclear.',
      'I need assistance with rebooking my reservation.',
      'The customer service has been excellent.',
      'I am disappointed with the overall experience.',
      'Could you please expedite the processing of my request?',
      'I have photos documenting the issues mentioned.',
      'The resolution provided is acceptable to me.',
      'I need to update my contact information for this case.'
    ];

    const senders = ['stefan123', 'jovan123', 'ana123']; // Use actual usernames instead of roles
    
    for (let i = 1; i <= 30; i++) {
      const createdAt = new Date(Date.now() - Math.random() * 25 * 24 * 60 * 60 * 1000);
      
      messages.push({
        complaintId: Math.floor(Math.random() * 30) + 1, // Random complaint ID (1-30)
        text: messageTexts[i - 1],
        authorUsername: senders[Math.floor(Math.random() * senders.length)], // Use authorUsername instead of sender
        createdAt: createdAt
      });
    }

    await queryInterface.bulkInsert('complaint_messages', messages, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('complaint_messages', null, {});
  }
};