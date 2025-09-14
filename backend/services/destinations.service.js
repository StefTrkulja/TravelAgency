const { Destination, Country, User } = require('../models');

class DestinationService {
  async getAllDestinations(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.countryId) {
        whereClause.countryId = filters.countryId;
      }
      
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      const destinations = await Destination.findAll({
        where: whereClause,
        include: [
          {
            association: 'country',
            attributes: ['id', 'name']
          },
        ],
        order: [['name', 'ASC']]
      });
      
      return { success: true, data: destinations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getDestinationById(id) {
    try {
      const destination = await Destination.findByPk(id, {
        include: [
          {
            association: 'country',
            attributes: ['id', 'name']
          },
          {
            association: 'arrangements',
            where: { status: ['ACTIVE', 'PENDING'] },
            required: false
          }
        ]
      });
      
      if (!destination) {
        return { success: false, error: 'Destination not found' };
      }
      
      return { success: true, data: destination };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createDestination(destinationData) {
    try {
      const destination = await Destination.create(destinationData);
      
      const createdDestination = await Destination.findByPk(destination.id, {
        include: [
          {
            association: 'country',
            attributes: ['id', 'name']
          },
        ]
      });
      
      return { success: true, data: createdDestination };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update destination
  async updateDestination(id, updateData) {
    try {
      const [updatedRowsCount] = await Destination.update(updateData, {
        where: { id }
      });
      
      if (updatedRowsCount === 0) {
        return { success: false, error: 'Destination not found' };
      }
      
      const updatedDestination = await Destination.findByPk(id, {
        include: [
          {
            association: 'country',
            attributes: ['id', 'name']
          },
        ]
      });
      
      return { success: true, data: updatedDestination };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete destination
  async deleteDestination(id) {
    try {
      const deletedRowsCount = await Destination.destroy({
        where: { id }
      });
      
      if (deletedRowsCount === 0) {
        return { success: false, error: 'Destination not found' };
      }
      
      return { success: true, message: 'Destination deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get destinations by country
  async getDestinationsByCountry(countryId) {
    try {
      const destinations = await Destination.findAll({
        where: { 
          countryId,
          isActive: true 
        },
        include: [
          {
            association: 'country',
            attributes: ['id', 'name']
          }
        ],
        order: [['name', 'ASC']]
      });
      
      return { success: true, data: destinations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new DestinationService();
