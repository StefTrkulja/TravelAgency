'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const complaints = [];
    const subjects = [
      'Flight delay compensation request',
      'Hotel accommodation issues',
      'Lost baggage claim',
      'Tour guide unprofessional behavior',
      'Restaurant food quality complaint',
      'Transportation service delay',
      'Booking cancellation issue',
      'Payment refund request',
      'Facility cleanliness concerns',
      'Staff rude behavior',
      'Incorrect booking details',
      'Service not as advertised',
      'Equipment malfunction',
      'Safety concerns reported',
      'Language barrier issues',
      'Overcharging dispute',
      'Missing amenities complaint',
      'Schedule change notification',
      'Medical emergency handling',
      'Weather-related cancellation',
      'Cultural tour disappointment',
      'Accommodation location issue',
      'Transfer service problem',
      'Activity cancellation dispute',
      'Documentation problems',
      'Communication breakdown',
      'Service quality below expectations',
      'Accessibility requirements not met',
      'Privacy concerns raised',
      'Technology system failures'
    ];

    const categories = [
      'ACCOMMODATION', 'TRANSPORTATION', 'FOOD_SERVICE', 'TOUR_GUIDE',
      'BOOKING', 'PAYMENT', 'SAFETY', 'ACCESSIBILITY', 'COMMUNICATION',
      'EQUIPMENT', 'DOCUMENTATION', 'WEATHER', 'MEDICAL', 'CULTURAL'
    ];

    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const usernames = ['stefan123', 'jovan123'];
    const operators = ['ana123'];
    const statuses = [1, 2, 3, 4, 5, 6, 7]; // status IDs

    // Generate reservation IDs (1-30 based on updated reservations)
    const reservationIds = Array.from({length: 30}, (_, i) => i + 1);

    for (let i = 1; i <= 30; i++) {
      const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
      const lastActivityAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // Up to 7 days after creation
      
      complaints.push({
        subject: subjects[i - 1],
        description: `Detailed description for complaint #${i}. This complaint describes specific issues encountered during the travel experience. Customer expects prompt resolution and appropriate compensation where applicable.`,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        createdAt: createdAt,
        lastActivityAt: lastActivityAt,
        category: categories[Math.floor(Math.random() * categories.length)],
        statusId: statuses[Math.floor(Math.random() * statuses.length)],
        reservationId: reservationIds[Math.floor(Math.random() * reservationIds.length)],
        createdByUsername: usernames[Math.floor(Math.random() * usernames.length)],
        assigneeUsername: Math.random() > 0.3 ? operators[0] : null, // 70% chance of being assigned
      });
    }

    await queryInterface.bulkInsert('complaints', complaints, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('complaints', null, {});
  }
};