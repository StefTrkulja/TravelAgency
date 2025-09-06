const { ActivityReview, User, ActivityBooking } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class ActivityReviewService {
  async createReview(payload) {
    try {
      // optional existence checks
      const user = await User.findByPk(payload.userUsername);
      if (!user) return new Result(StatusEnum.FAIL, 400, null, { message: 'Invalid user_id' });

      const booking = await ActivityBooking.findByPk(payload.activity_booking_id);
      if (!booking) return new Result(StatusEnum.FAIL, 400, null, { message: 'Invalid activity_booking_id' });

      const review = await ActivityReview.create(payload);
      return new Result(StatusEnum.SUCCESS, 201, review);
    } catch (error) {
      console.error("Error creating review:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getAllReviews() {
    try {
      const reviews = await ActivityReview.findAll({
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: ActivityBooking, as: 'activityBooking' }
        ]
      });
      return new Result(StatusEnum.SUCCESS, 200, reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getReviewById(id) {
    try {
      const review = await ActivityReview.findByPk(id, {
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: ActivityBooking, as: 'activityBooking' }
        ]
      });
      if (!review) return new Result(StatusEnum.FAIL, 404, null, { message: 'Review not found' });
      return new Result(StatusEnum.SUCCESS, 200, review);
    } catch (error) {
      console.error("Error fetching review:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getReviewsByUserId(username) {
    try {
      const reviews = await ActivityReview.findAll({
        where: { userUsername: username },
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: ActivityBooking, as: 'activityBooking' }
        ]
      });
      return new Result(StatusEnum.SUCCESS, 200, reviews);
    } catch (error) {
      console.error("Error fetching reviews by user:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async getReviewsByBookingId(bookingId) {
    try {
      const reviews = await ActivityReview.findAll({
        where: { activity_booking_id: bookingId },
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname', 'email', 'role'] },
          { model: ActivityBooking, as: 'activityBooking' }
        ]
      });
      return new Result(StatusEnum.SUCCESS, 200, reviews);
    } catch (error) {
      console.error("Error fetching reviews by booking:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async updateReview(id, updates) {
    try {
      const review = await ActivityReview.findByPk(id);
      if (!review) return new Result(StatusEnum.FAIL, 404, null, { message: 'Review not found' });

      await review.update(updates);
      return new Result(StatusEnum.SUCCESS, 200, review);
    } catch (error) {
      console.error("Error updating review:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  async deleteReview(id) {
    try {
      const deleted = await ActivityReview.destroy({ where: { id } });
      if (deleted === 0) return new Result(StatusEnum.FAIL, 404, null, { message: 'Review not found' });

      return new Result(StatusEnum.SUCCESS, 200, { deleted: true });
    } catch (error) {
      console.error("Error deleting review:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }
}

module.exports = new ActivityReviewService();
