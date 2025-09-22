const { Booking, User, Departure } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class BookingService {
  async createBooking(payload) {
    try {
      const booking = await Booking.create(payload);
      return new Result(StatusEnum.SUCCESS, 201, booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAllBookings() {
    try {
      const bookings = await Booking.findAll({
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email'] },
          { model: Departure, as: 'departure' }
        ]
      });
      return new Result(StatusEnum.SUCCESS, 200, bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getBookingById(id) {
    try {
      const booking = await Booking.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email'] },
          { model: Departure, as: 'departure' }
        ]
      });

      if (!booking) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Booking not found' });
      }

      return new Result(StatusEnum.SUCCESS, 200, booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getBookingsByUser(username) {
    try {
      const bookings = await Booking.findAll({
        where: { userUsername: username },
        include: [{ model: Departure, as: 'departure' }]
      });
      return new Result(StatusEnum.SUCCESS, 200, bookings);
    } catch (error) {
      console.error("Error fetching bookings by user:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getBookingsByDeparture(departureId) {
    try {
      const bookings = await Booking.findAll({
        where: { departure_id: departureId },
        include: [{ model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email'] }]
      });
      return new Result(StatusEnum.SUCCESS, 200, bookings);
    } catch (error) {
      console.error("Error fetching bookings by departure:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async updateBooking(id, updates) {
    try {
      const booking = await Booking.findByPk(id);
      if (!booking) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Booking not found' });
      }

      await booking.update(updates);
      return new Result(StatusEnum.SUCCESS, 200, booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async deleteBooking(id) {
    try {
      const deletedCount = await Booking.destroy({ where: { id } });
      if (deletedCount === 0) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Booking not found' });
      }
      return new Result(StatusEnum.SUCCESS, 200, { deleted: true });
    } catch (error) {
      console.error("Error deleting booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }
}

module.exports = new BookingService();
