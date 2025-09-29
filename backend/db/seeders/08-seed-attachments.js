'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const attachments = [];
    const storageKeys = [
      'uploads/receipts/receipt_001.pdf',
      'uploads/photos/complaint_photo_001.jpg',
      'uploads/documents/booking_confirmation.pdf',
      'uploads/photos/damage_photo.png',
      'uploads/medical/medical_report.pdf',
      'uploads/photos/hotel_room_issue.jpg',
      'uploads/tickets/flight_ticket.pdf',
      'uploads/photos/food_complaint.jpg',
      'uploads/transport/transport_delay_proof.png',
      'uploads/documents/refund_request.pdf'
    ];

    for (let i = 1; i <= 30; i++) {
      const baseKey = storageKeys[Math.floor(Math.random() * storageKeys.length)];
      const extension = baseKey.split('.').pop();
      const pathWithoutExt = baseKey.split('.').slice(0, -1).join('.');
      
      attachments.push({
        complaintId: Math.floor(Math.random() * 30) + 1, // Random complaint ID (1-30)
        storageKey: `${pathWithoutExt}_${i}.${extension}`
      });
    }

    await queryInterface.bulkInsert('attachments', attachments, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('attachments', null, {});
  }
};