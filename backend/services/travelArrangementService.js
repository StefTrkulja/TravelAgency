const { TravelArrangement, User, Destination, Country } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class TravelArrangementService {
  async createTravelArrangement(payload) {
    try {
      const arrangement = await TravelArrangement.create(payload);
      return new Result(StatusEnum.SUCCESS, 201, arrangement);
    } catch (error) {
      console.error("Error creating travel arrangement:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAllTravelArrangements() {
    try {
      const arrangements = await TravelArrangement.findAll({
        include: [
          { 
            model: User, 
            as: 'creator', 
            attributes: ['username', 'name', 'surname', 'email', 'role'] 
          },
          { 
            model: Destination, 
            as: 'destination',
            include: [
              { model: Country, as: 'country' }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      return new Result(StatusEnum.SUCCESS, 200, arrangements);
    } catch (error) {
      console.error("Error fetching travel arrangements:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getTravelArrangementById(id) {
    try {
      const arrangement = await TravelArrangement.findByPk(id, {
        include: [
          { 
            model: User, 
            as: 'creator', 
            attributes: ['username', 'name', 'surname', 'email', 'role'] 
          },
          { 
            model: Destination, 
            as: 'destination',
            include: [
              { model: Country, as: 'country' }
            ]
          }
        ]
      });

      if (!arrangement) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Travel arrangement not found' });
      }

      return new Result(StatusEnum.SUCCESS, 200, arrangement);
    } catch (error) {
      console.error("Error fetching travel arrangement:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getTravelArrangementsByCreator(createdByUsername) {
    try {
      const arrangements = await TravelArrangement.findAll({
        where: { createdByUsername },
        include: [
          { 
            model: User, 
            as: 'creator', 
            attributes: ['username', 'name', 'surname', 'email', 'role'] 
          },
          { 
            model: Destination, 
            as: 'destination',
            include: [
              { model: Country, as: 'country' }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return new Result(StatusEnum.SUCCESS, 200, arrangements);
    } catch (error) {
      console.error("Error fetching travel arrangements by creator:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getTravelArrangementsByDestination(destinationId) {
    try {
      const arrangements = await TravelArrangement.findAll({
        where: { destinationId },
        include: [
          { 
            model: User, 
            as: 'creator', 
            attributes: ['username', 'name', 'surname', 'email', 'role'] 
          },
          { 
            model: Destination, 
            as: 'destination',
            include: [
              { model: Country, as: 'country' }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return new Result(StatusEnum.SUCCESS, 200, arrangements);
    } catch (error) {
      console.error("Error fetching travel arrangements by destination:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async updateTravelArrangement(id, updates) {
    try {
      const arrangement = await TravelArrangement.findByPk(id);
      if (!arrangement) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Travel arrangement not found' });
      }

      await arrangement.update(updates);
      return new Result(StatusEnum.SUCCESS, 200, arrangement);
    } catch (error) {
      console.error("Error updating travel arrangement:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async deleteTravelArrangement(id) {
    try {
      const deletedCount = await TravelArrangement.destroy({ where: { id } });
      if (deletedCount === 0) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Travel arrangement not found' });
      }
      return new Result(StatusEnum.SUCCESS, 200, { deleted: true });
    } catch (error) {
      console.error("Error deleting travel arrangement:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async updateStatus(arrangementId, newStatus) {
    try {
      const arrangement = await TravelArrangement.findByPk(arrangementId);
      if (!arrangement) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Travel arrangement not found' });
      }

      arrangement.status = newStatus;
      await arrangement.save();
      return new Result(StatusEnum.SUCCESS, 200, arrangement);
    } catch (error) {
      console.error("Error updating travel arrangement status:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }
}

module.exports = new TravelArrangementService();