const { ActivityBookingParticipant, ActivityBooking } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class ActivityParticipantService {
  async createParticipant(payload) {
    try {
      // check if booking exists
      const booking = await ActivityBooking.findByPk(payload.activity_booking_id);
      if (!booking) {
        return new Result(StatusEnum.FAIL, 400, null, { message: 'Invalid activity_booking_id' });
      }

      const participant = await ActivityBookingParticipant.create(payload);
      return new Result(StatusEnum.SUCCESS, 201, participant);
    } catch (error) {
      console.error("Error creating participant:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAllParticipants() {
    try {
      const participants = await ActivityBookingParticipant.findAll({
        include: [{ model: ActivityBooking, as: 'activityBooking' }]
      });
      return new Result(StatusEnum.SUCCESS, 200, participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getParticipantById(id) {
    try {
      const participant = await ActivityBookingParticipant.findByPk(id, {
        include: [{ model: ActivityBooking, as: 'activityBooking' }]
      });
      if (!participant) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Participant not found' });
      }
      return new Result(StatusEnum.SUCCESS, 200, participant);
    } catch (error) {
      console.error("Error fetching participant:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getParticipantsByBookingId(activityBookingId) {
    try {
      const participants = await ActivityBookingParticipant.findAll({
        where: { activity_booking_id: activityBookingId },
        include: [{ model: ActivityBooking, as: 'activityBooking' }]
      });
      return new Result(StatusEnum.SUCCESS, 200, participants);
    } catch (error) {
      console.error("Error fetching participants by booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async updateParticipant(id, updates) {
    try {
      const participant = await ActivityBookingParticipant.findByPk(id);
      if (!participant) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Participant not found' });
      }

      await participant.update(updates);
      return new Result(StatusEnum.SUCCESS, 200, participant);
    } catch (error) {
      console.error("Error updating participant:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async deleteParticipant(id) {
    try {
      const deleted = await ActivityBookingParticipant.destroy({ where: { id } });
      if (deleted === 0) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Participant not found' });
      }
      return new Result(StatusEnum.SUCCESS, 200, { deleted: true });
    } catch (error) {
      console.error("Error deleting participant:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }
}

module.exports = new ActivityParticipantService();
