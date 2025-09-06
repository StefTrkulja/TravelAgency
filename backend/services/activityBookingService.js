const { ActivityBooking, User, ActivitySchedule, Booking } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class ActivityBookingService {
  async createBooking(payload) {
    try {
      // Optional existence checks
      const user = await User.findByPk(payload.user_id);
      if (!user) return new Result(StatusEnum.FAIL, 400, null, { message: 'Invalid user_id' });

      const schedule = await ActivitySchedule.findByPk(payload.activity_schedule_id);
      if (!schedule) return new Result(StatusEnum.FAIL, 400, null, { message: 'Invalid activity_schedule_id' });

      const arrangementBooking = await Booking.findByPk(payload.arrangement_booking_id);
      if (!arrangementBooking) return new Result(StatusEnum.FAIL, 400, null, { message: 'Invalid arrangement_booking_id' });

      const booking = await ActivityBooking.create(payload);
      return new Result(StatusEnum.SUCCESS, 201, booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAllBookings() {
    try {
      const bookings = await ActivityBooking.findAll({
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: ActivitySchedule, as: 'activitySchedule' },
          { model: Booking, as: 'arrangementBooking' }
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
      const booking = await ActivityBooking.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: ActivitySchedule, as: 'activitySchedule' },
          { model: Booking, as: 'arrangementBooking' }
        ]
      });

      if (!booking) return new Result(StatusEnum.FAIL, 404, null, { message: 'Booking not found' });

      return new Result(StatusEnum.SUCCESS, 200, booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getBookingsByUserId(userId) {
    try {
      const bookings = await ActivityBooking.findAll({
        where: { user_id: userId },
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: ActivitySchedule, as: 'activitySchedule' },
          { model: Booking, as: 'arrangementBooking' }
        ]
      });
      return new Result(StatusEnum.SUCCESS, 200, bookings);
    } catch (error) {
      console.error("Error fetching bookings by user:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getBookingsByArrangementBookingId(arrangementBookingId) {
    try {
      const bookings = await ActivityBooking.findAll({
        where: { arrangement_booking_id: arrangementBookingId },
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: ActivitySchedule, as: 'activitySchedule' },
          { model: Booking, as: 'arrangementBooking' }
        ]
      });
      return new Result(StatusEnum.SUCCESS, 200, bookings);
    } catch (error) {
      console.error("Error fetching bookings by arrangementBookingId:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getBookingsByActivityScheduleId(activityScheduleId) {
    try {
      const bookings = await ActivityBooking.findAll({
        where: { activity_schedule_id: activityScheduleId },
        include: [
          { model: User, as: 'user' },
          { model: ActivitySchedule, as: 'activitySchedule' },
          { model: Booking, as: 'arrangementBooking' }
        ]
      });
      return new Result(StatusEnum.SUCCESS, 200, bookings);
    } catch (error) {
      console.error("Error fetching bookings by activityScheduleId:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async updateBooking(id, updates) {
    try {
      const booking = await ActivityBooking.findByPk(id);
      if (!booking) return new Result(StatusEnum.FAIL, 404, null, { message: 'Booking not found' });

      await booking.update(updates);
      return new Result(StatusEnum.SUCCESS, 200, booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async deleteBooking(id) {
    try {
      const deleted = await ActivityBooking.destroy({ where: { id } });
      if (deleted === 0) return new Result(StatusEnum.FAIL, 404, null, { message: 'Booking not found' });

      return new Result(StatusEnum.SUCCESS, 200, { deleted: true });
    } catch (error) {
      console.error("Error deleting booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }
}

module.exports = new ActivityBookingService();
