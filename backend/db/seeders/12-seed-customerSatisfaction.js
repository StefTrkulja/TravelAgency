'use strict';

const { CustomerSatisfaction } = require('../../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const customerSatisfactionData = [
      {
        complaintId: 1,
        customerUsername: 'stefan123',
        rating: 5,
        comment: 'Excellent service, very satisfied with the resolution.',
        createdAt: new Date('2024-05-15T10:30:00Z'),
      },
      {
        complaintId: 2,
        customerUsername: 'jovan123',
        rating: 4,
        comment: 'Good handling of my complaint, resolved quickly.',
        createdAt: new Date('2024-05-16T14:20:00Z'),
      },
      {
        complaintId: 5,
        customerUsername: 'stefan123',
        rating: 3,
        comment: 'Average experience, took longer than expected.',
        createdAt: new Date('2024-05-17T09:15:00Z'),
      },
      {
        complaintId: 8,
        customerUsername: 'jovan123',
        rating: 5,
        comment: 'Outstanding support team, highly recommend!',
        createdAt: new Date('2024-05-18T16:45:00Z'),
      },
      {
        complaintId: 12,
        customerUsername: 'stefan123',
        rating: 2,
        comment: 'Not satisfied with the response time.',
        createdAt: new Date('2024-05-19T11:30:00Z'),
      },
      {
        complaintId: 15,
        customerUsername: 'jovan123',
        rating: 4,
        comment: 'Professional handling, good communication.',
        createdAt: new Date('2024-05-20T13:15:00Z'),
      },
      {
        complaintId: 18,
        customerUsername: 'stefan123',
        rating: 5,
        comment: 'Perfect resolution, exceeded expectations.',
        createdAt: new Date('2024-05-21T17:30:00Z'),
      },
      {
        complaintId: 22,
        customerUsername: 'jovan123',
        rating: 3,
        comment: 'Acceptable solution, could be improved.',
        createdAt: new Date('2024-05-22T10:45:00Z'),
      }
    ];

    return CustomerSatisfaction.bulkCreate(customerSatisfactionData);
  },

  down: async (queryInterface, Sequelize) => {
    return CustomerSatisfaction.destroy({
      where: {},
      truncate: true
    });
  }
};