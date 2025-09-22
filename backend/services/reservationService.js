const { Reservation, TravelArrangement, Destination, Country, User } = require('../models');

class ReservationService {
  generateReservationCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `REZ-${timestamp}-${random}`.toUpperCase();
  }

  async getAllReservations(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.customerUsername) {
        whereClause.customerUsername = filters.customerUsername;
      }
      
      if (filters.status) {
        whereClause.status = filters.status;
      }
      
      if (filters.arrangementId) {
        whereClause.arrangementId = filters.arrangementId;
      }

      const reservations = await Reservation.findAll({
        where: whereClause,
        include: [
          {
            association: 'arrangement',
            attributes: ['id', 'title', 'basePricePerPerson'],
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
              }
            ]
          },
          {
            association: 'customer',
            attributes: ['username', 'name', 'surname', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      return { success: true, data: reservations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getReservationById(id) {
    try {
      const reservation = await Reservation.findByPk(id, {
        include: [
          {
            association: 'arrangement',
            include: [
              {
                association: 'destination',
                include: [
                  {
                    association: 'country',
                    attributes: ['id', 'name']
                  }
                ]
              }
            ]
          },
          {
            association: 'customer',
            attributes: ['username', 'name', 'surname', 'email', 'address']
          }
        ]
      });
      
      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }
      
      return { success: true, data: reservation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getReservationByCode(code) {
    try {
      const reservation = await Reservation.findOne({
        where: { code },
        include: [
          {
            association: 'arrangement',
            include: [
              {
                association: 'destination',
                include: [
                  {
                    association: 'country',
                    attributes: ['id', 'name']
                  }
                ]
              }
            ]
          },
          {
            association: 'customer',
            attributes: ['username', 'name', 'surname', 'email', 'address']
          }
        ]
      });
      
      if (!reservation) {
        return { success: false, error: 'Reservation not found' };
      }
      
      return { success: true, data: reservation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createReservation(reservationData) {
    try {
      const arrangement = await TravelArrangement.findByPk(reservationData.arrangementId);
      
      if (!arrangement) {
        return { success: false, error: 'Arrangement not found' };
      }

      const totalPrice = parseFloat(arrangement.basePricePerPerson) * reservationData.numberOfPeople;

      const code = this.generateReservationCode();

      const reservationDataWithCalculations = {
        ...reservationData,
        code,
        totalPrice,
        startsAt: arrangement.startDate,
        endsAt: arrangement.endDate
      };

      const reservation = await Reservation.create(reservationDataWithCalculations);
      
      const createdReservation = await Reservation.findByPk(reservation.id, {
        include: [
          {
            association: 'arrangement',
            include: [
              {
                association: 'destination',
                include: [
                  {
                    association: 'country',
                    attributes: ['id', 'name']
                  }
                ]
              }
            ]
          },
          {
            association: 'customer',
            attributes: ['username', 'name', 'surname', 'email']
          }
        ]
      });
      
      return { success: true, data: createdReservation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateReservation(id, updateData) {
    try {
      if (updateData.numberOfPeople) {
        const reservation = await Reservation.findByPk(id, {
          include: [{ association: 'arrangement' }]
        });
        
        if (reservation) {
          updateData.totalPrice = parseFloat(reservation.arrangement.basePricePerPerson) * updateData.numberOfPeople;
        }
      }

      const [updatedRowsCount] = await Reservation.update(updateData, {
        where: { id }
      });
      
      if (updatedRowsCount === 0) {
        return { success: false, error: 'Reservation not found' };
      }
      
      const updatedReservation = await Reservation.findByPk(id, {
        include: [
          {
            association: 'arrangement',
            include: [
              {
                association: 'destination',
                include: [
                  {
                    association: 'country',
                    attributes: ['id', 'name']
                  }
                ]
              }
            ]
          },
          {
            association: 'customer',
            attributes: ['username', 'name', 'surname', 'email']
          }
        ]
      });
      
      return { success: true, data: updatedReservation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteReservation(id) {
    try {
      const deletedRowsCount = await Reservation.destroy({
        where: { id }
      });
      
      if (deletedRowsCount === 0) {
        return { success: false, error: 'Reservation not found' };
      }
      
      return { success: true, message: 'Reservation deleted successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async cancelReservation(id) {
    try {
      const [updatedRowsCount] = await Reservation.update(
        { status: 'CANCELLED' },
        { where: { id } }
      );
      
      if (updatedRowsCount === 0) {
        return { success: false, error: 'Reservation not found' };
      }
      
      const cancelledReservation = await this.getReservationById(id);
      return cancelledReservation;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async confirmReservation(id) {
    try {
      const [updatedRowsCount] = await Reservation.update(
        { status: 'CONFIRMED' },
        { where: { id } }
      );
      
      if (updatedRowsCount === 0) {
        return { success: false, error: 'Reservation not found' };
      }
      
      const confirmedReservation = await this.getReservationById(id);
      return confirmedReservation;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserReservations(username) {
    try {
      const reservations = await Reservation.findAll({
        where: { customerUsername: username },
        include: [
          {
            association: 'arrangement',
            attributes: ['id', 'title', 'basePricePerPerson'],
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
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      return { success: true, data: reservations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ReservationService();
