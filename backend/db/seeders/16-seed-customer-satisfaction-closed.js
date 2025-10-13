'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch all CLOSED complaints
    const [closedComplaints] = await queryInterface.sequelize.query(`
      SELECT c.id, c."createdByUsername", c."createdAt"
      FROM complaints c
      INNER JOIN statuses s ON s.id = c."statusId"
      WHERE s.code = 'CLOSED'
      ORDER BY c.id;
    `);

    if (closedComplaints.length === 0) {
      console.log('⚠️  No CLOSED complaints found. Skipping customer satisfaction seeding.');
      return;
    }

    console.log(`Found ${closedComplaints.length} CLOSED complaints`);

    const satisfactionData = [];
    const comments = [
      'Very satisfied with the resolution. Thank you!',
      'The issue was resolved quickly and professionally.',
      'Great service! The operator was very helpful.',
      'Problem solved, but it took longer than expected.',
      'Good outcome, but communication could be better.',
      'Excellent support! Highly recommend.',
      'Fair resolution. Could have been faster.',
      'Not entirely happy with the solution, but acceptable.',
      'Outstanding service! Very impressed.',
      'Resolution was okay, nothing special.',
      'Fast response and effective solution.',
      'The operator went above and beyond to help.',
      'Satisfied with the result.',
      'Issue resolved to my satisfaction.',
      'Professional and courteous service.',
      'Could have been better, but problem is fixed.',
      'Very pleased with how this was handled.',
      'Acceptable resolution, though not ideal.',
      'Excellent communication throughout the process.',
      'Happy with the outcome.',
      null, // Some without comments
      'Quick and efficient service.',
      'The resolution exceeded my expectations.',
      'Adequate service.',
      'Problem resolved satisfactorily.',
    ];

    closedComplaints.forEach((complaint, index) => {
      // Rating distribution: more 4s and 5s (positive bias)
      let rating;
      const rand = Math.random();
      if (rand < 0.40) rating = 5;        // 40% - 5 stars
      else if (rand < 0.75) rating = 4;   // 35% - 4 stars
      else if (rand < 0.90) rating = 3;   // 15% - 3 stars
      else if (rand < 0.97) rating = 2;   //  7% - 2 stars
      else rating = 1;                     //  3% - 1 star

      // Random comment or null (70% have comments)
      const comment = Math.random() < 0.7 
        ? comments[Math.floor(Math.random() * comments.length)]
        : null;

      // Created at: 1-3 days after complaint was created
      const complaintCreatedAt = new Date(complaint.createdAt);
      const createdAt = new Date(complaintCreatedAt);
      createdAt.setDate(createdAt.getDate() + Math.floor(Math.random() * 3) + 1);
      createdAt.setHours(Math.floor(Math.random() * 24));
      createdAt.setMinutes(Math.floor(Math.random() * 60));

      satisfactionData.push({
        complaint_id: complaint.id,
        customer_username: complaint.createdByUsername,
        rating: rating,
        comment: comment,
        created_at: createdAt,
      });
    });

    // Insert into database
    await queryInterface.bulkInsert('customer_satisfaction', satisfactionData, {});

    console.log(`✓ Seeded ${satisfactionData.length} customer satisfaction records`);
    console.log(`  5 stars: ${satisfactionData.filter(s => s.rating === 5).length}`);
    console.log(`  4 stars: ${satisfactionData.filter(s => s.rating === 4).length}`);
    console.log(`  3 stars: ${satisfactionData.filter(s => s.rating === 3).length}`);
    console.log(`  2 stars: ${satisfactionData.filter(s => s.rating === 2).length}`);
    console.log(`  1 star:  ${satisfactionData.filter(s => s.rating === 1).length}`);
  },

  async down(queryInterface, Sequelize) {
    // Get all closed complaint IDs
    const [closedComplaints] = await queryInterface.sequelize.query(`
      SELECT c.id
      FROM complaints c
      INNER JOIN statuses s ON s.id = c."statusId"
      WHERE s.code = 'CLOSED';
    `);

    const complaintIds = closedComplaints.map(c => c.id);

    if (complaintIds.length > 0) {
      await queryInterface.bulkDelete('customer_satisfaction', {
        complaint_id: {
          [Sequelize.Op.in]: complaintIds
        }
      }, {});
    }
  }
};
