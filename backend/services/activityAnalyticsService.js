const { ActivityAnalytics, ActivityBooking, ActivitySchedule, ActivityReview } = require('../models');
const { Op } = require('sequelize');
const { Result, StatusEnum } = require('../utils/result');

class ActivityAnalyticsService {
  async generateAnalytics(activityId, fromDate, toDate, username) {
    try {
      // Get bookings for this activity in timeframe
      const bookings = await ActivityBooking.findAll({
        include: [{ model: ActivitySchedule, as: 'activitySchedule', where: { activity_id: activityId } }],
        where: {
          bookingDate: { [Op.between]: [fromDate, toDate] }
        }
      });

      const numberOfParticipants = bookings.reduce((sum, b) => sum + (b.numberOfParticipants || 0), 0);
      const fullIncome = bookings.reduce((sum, b) => sum + parseFloat(b.totalPrice || 0), 0);
      const cancelled = bookings.filter(b => b.isCancelled).length;
      const cancellationRate = bookings.length > 0 ? cancelled / bookings.length : 0;

      // Reviews
      const reviews = await ActivityReview.findAll({
        where: { activity_booking_id: bookings.map(b => b.id) }
      });
      const numberOfReviews = reviews.length;
      const avg = (key) => reviews.length ? reviews.reduce((s, r) => s + (r[key] || 0), 0) / reviews.length : null;

      const analytics = await ActivityAnalytics.create({
        activity_id: activityId,
        userUsername: username,
        numberOfParticipants,
        fullIncome,
        profits: fullIncome * 0.2, // mock: 20% profit
        numberOfReviews,
        averageOverallRating: avg('overallRating'),
        averageGuideRating: avg('guideRating'),
        averageSafetyRating: avg('safetyRating'),
        revisitingRate: reviews.length ? reviews.filter(r => r.wouldRevisit).length / reviews.length : null,
        occupancyRate: null, // placeholder until seats capacity logic
        cancellationRate,
        requestedAt: new Date(),
        fromDate,
        toDate
      });

      return new Result(StatusEnum.SUCCESS, 201, analytics);
    } catch (err) {
      console.error("Error generating analytics:", err);
      return new Result(StatusEnum.FAIL, 500, null, { message: err.message });
    }
  }

  async getById(id) {
    try {
      const a = await ActivityAnalytics.findByPk(id);
      if (!a) return new Result(StatusEnum.FAIL, 404, null, { message: 'Not found' });
      return new Result(StatusEnum.SUCCESS, 200, a);
    } catch (err) {
      return new Result(StatusEnum.FAIL, 500, null, { message: err.message });
    }
  }
}

module.exports = new ActivityAnalyticsService();
