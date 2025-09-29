'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const compensations = [];
    const compensationTypes = ['REFUND', 'VOUCHER', 'UPGRADE', 'DISCOUNT', 'SERVICE_CREDIT'];
    const currencies = ['EUR', 'USD', 'RSD'];
    const descriptions = [
      'Full refund for cancelled accommodation due to overbooking',
      'Travel voucher compensation for flight delay over 3 hours',
      'Room upgrade compensation for initial accommodation issues',
      'Discount voucher for future bookings due to service quality',
      'Service credit for restaurant meal quality complaint',
      'Partial refund for transportation service delays',
      'Complimentary upgrade for tour guide service issues',
      'Meal voucher compensation for food quality problems',
      'Hotel credit for facility maintenance disruptions',
      'Flight change fee waiver for schedule modifications',
      'Spa service credit for booking system errors',
      'Excursion refund for weather cancellation',
      'Priority booking privilege for future reservations',
      'Baggage compensation for delayed luggage delivery',
      'Restaurant credit for poor service experience',
      'Transportation upgrade for missed connections',
      'Activity voucher for cancelled excursions',
      'Accommodation credit for room condition issues',
      'Tour refund for guide unavailability',
      'Service fee waiver for booking complications',
      'Upgrade certificate for next stay',
      'Dining credit for reservation mix-up',
      'Transfer service credit for delayed pickup',
      'Entertainment voucher for facility closures',
      'Cleaning service credit for housekeeping issues',
      'Parking fee refund for unavailable spaces',
      'Minibar credit for room amenity problems',
      'Laundry service compensation for delays',
      'Internet access credit for connectivity issues',
      'Concierge service credit for booking errors'
    ];

    const statusOptions = ['PROPOSED', 'APPROVED', 'REJECTED'];

    for (let i = 1; i <= 30; i++) {
      const createdAt = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000);
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const compensationType = compensationTypes[Math.floor(Math.random() * compensationTypes.length)];
      
      // Amount - always provide amount (required field)
      // Higher amounts for first 15 tickets (likely SLA breached ones)
      const amount = i <= 15 ? 
        (Math.random() * 300 + 100).toFixed(2) : // 100-400 for breached SLA
        (Math.random() * 200 + 25).toFixed(2);   // 25-225 for other issues
      const currency = currencies[Math.floor(Math.random() * currencies.length)];
      
      // Valid until date
      const validUntil = new Date(createdAt.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from creation
      
      // Use sequential complaint IDs to ensure proper mapping
      const complaintId = i;
      
      // SLA breach related notes for first 15
      let note = descriptions[i - 1];
      if (i <= 15) {
        const slaBreachNotes = [
          'Compensation for delayed initial response - SLA breach occurred',
          'Service credit due to resolution time exceeding SLA targets',
          'Refund approved for critical issue not addressed within SLA',
          'Upgrade compensation for high priority ticket SLA violation', 
          'Voucher issued due to response time SLA breach on urgent matter',
          'Discount compensation for missed resolution deadline',
          'Service credit for critical complaint resolution delay',
          'Refund compensation due to excessive response time',
          'Upgrade voucher for SLA breach on high priority issue',
          'Credit compensation for delayed emergency response',
          'Partial refund for SLA violation on time-sensitive booking',
          'Service upgrade due to missed critical response deadline',
          'Compensation voucher for resolution SLA breach',
          'Credit issued for priority complaint handling delay',
          'Refund approved due to SLA target failure on urgent case'
        ];
        note = slaBreachNotes[i - 1] || note;
      }
      
      compensations.push({
        complaintId: complaintId,
        type: compensationType,
        amount: amount,
        currency: currency,
        note: note,
        status: status,
        createdAt: createdAt,
        validUntil: validUntil,
        managerUsername: status === 'APPROVED' ? 'anja123' : null
      });
    }

    await queryInterface.bulkInsert('compensations', compensations, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('compensations', null, {});
  }
};