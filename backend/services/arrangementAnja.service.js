const { Op } = require('sequelize');
const {
  TravelArrangement,
  Destination,
  Country,
  User,
} = require('../models');

class ArrangementAnjaService {
  async getAllArrangements(filters = {}) {
    try {
      const whereClause = {};

      if (filters.destinationId) {
        whereClause.destinationId = filters.destinationId;
      }
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.transportType) {
        whereClause.transportType = filters.transportType; 
      }
      if (filters.accommodationType) {
        whereClause.accommodationType = filters.accommodationType; 
      }

      const arrangements = await TravelArrangement.findAll({
        where: whereClause,
        include: [
          {
            association: 'destination',
            attributes: ['id', 'name'],
            include: [
              {
                association: 'country',
                attributes: ['id', 'name'],
              },
            ],
          },
          
        ],
        order: [['createdAt', 'DESC']],
      });

      return { success: true, data: arrangements };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getArrangementById(id) {
    try {
      const arrangement = await TravelArrangement.findByPk(id, {
        include: [
          {
            association: 'destination',
            attributes: ['id', 'name', 'description'],
            include: [
              {
                association: 'country',
                attributes: ['id', 'name'],
              },
            ],
          }
        ],
      });

      if (!arrangement) {
        return { success: false, error: 'Arrangement not found' };
      }

      return { success: true, data: arrangement };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getArrangementsByDestination(destinationId) {
    try {
      const arrangements = await TravelArrangement.findAll({
        where: {
          destinationId,
          status: 'ACTIVE', // You can also use TravelArrangement.ArrangementStatus.ACTIVE
        },
        include: [
          {
            association: 'destination',
            attributes: ['id', 'name'],
            include: [{ association: 'country', attributes: ['id', 'name'] }],
          },
        ],
        order: [['basePricePerPerson', 'ASC']],
      });

      return { success: true, data: arrangements };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async searchArrangements(searchParams) {
    try {
      const { query, minPrice, maxPrice, transportType, accommodationType } = searchParams;

      const whereClause = {
        status: 'ACTIVE',
      };

      if (minPrice || maxPrice) {
        whereClause.basePricePerPerson = {};
        if (minPrice !== undefined && minPrice !== null) {
          whereClause.basePricePerPerson[Op.gte] = minPrice;
        }
        if (maxPrice !== undefined && maxPrice !== null) {
          whereClause.basePricePerPerson[Op.lte] = maxPrice;
        }
      }

      if (transportType) {
        whereClause.transportType = transportType;
      }

      if (accommodationType) {
        whereClause.accommodationType = accommodationType;
      }

      const arrangements = await TravelArrangement.findAll({
        where: whereClause,
        include: [
          {
            association: 'destination',
            attributes: ['id', 'name'],
            include: [
              {
                association: 'country',
                attributes: ['id', 'name'],
              },
            ],
            // Allow search by destination or country name
            where: query ? {
                  [Op.or]: [
                    { name: { [Op.iLike]: `%${query}%` } },
                    { '$destination.country.name$': { [Op.iLike]: `%${query}%` } }
                  ]
                } : undefined
              },
            ],
            
            order: [['basePricePerPerson', 'ASC']],
            subQuery: false,
      });

   

      return { success: true, data: arrangements };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }


   async createArrangement(arrangementData) {
    try {
      const arrangement = await TravelArrangement.create(arrangementData);
      
      const createdArrangement = await TravelArrangement.findByPk(arrangement.id, {
        include: [
          {
            association: 'destination',
            attributes: ['id', 'name'],
            include: [
              {
                association: 'country',
                attributes: ['id', 'name']
              }
            ]
          },
        ]
      });
      
      return { success: true, data: createdArrangement };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

}

module.exports = new ArrangementAnjaService();
