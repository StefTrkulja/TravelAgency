const { ActivitySchedule, Activity, TravelArrangement, Destination, Departure, ActivityBooking, User } = require('../models');
const { Op } = require('sequelize');
const { Result, StatusEnum } = require('../utils/result');

class CalendarService {
  /**
   * Get activity schedules with booking information for calendar view
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Result>} - Calendar data with schedules
   */
  async getActivitySchedules(filters = {}) {
    try {
      const whereClause = {};
      const activityWhere = {};
      const arrangementWhere = {};

      // Date range filter
      if (filters.fromDate) {
        whereClause.startTime = { [Op.gte]: new Date(filters.fromDate) };
      }
      if (filters.toDate) {
        whereClause.endTime = { [Op.lte]: new Date(filters.toDate + 'T23:59:59') };
      }

      // Destination filter
      if (filters.destinationId) {
        arrangementWhere.destinationId = filters.destinationId;
      }

      // Arrangement filter
      if (filters.arrangementId) {
        activityWhere.arrangement_id = filters.arrangementId;
      }

      const schedules = await ActivitySchedule.findAll({
        where: whereClause,
        include: [
          {
            model: Activity,
            as: 'activity',
            where: Object.keys(activityWhere).length > 0 ? activityWhere : undefined,
            include: [
              {
                model: TravelArrangement,
                as: 'arrangement',
                where: Object.keys(arrangementWhere).length > 0 ? arrangementWhere : undefined,
                include: [
                  {
                    model: Destination,
                    as: 'destination',
                    attributes: ['id', 'name']
                  }
                ]
              }
            ]
          }
        ],
        order: [['startTime', 'ASC']]
      });

      // Get booking information for each schedule
      const calendarData = await Promise.all(
        schedules.map(async (schedule) => {
          const bookings = await ActivityBooking.findAll({
            where: { activity_schedule_id: schedule.id },
            attributes: ['numberOfParticipants', 'isCancelled']
          });

          const activeBookings = bookings.filter(b => !b.isCancelled);
          const bookedParticipants = activeBookings.reduce(
            (sum, booking) => sum + booking.numberOfParticipants, 0
          );

          const conflicts = await this.detectConflicts(schedule);

          return {
            id: schedule.id,
            activityId: schedule.activity.id,
            activityName: schedule.activity.name,
            arrangementId: schedule.activity.arrangement.id,
            arrangementTitle: schedule.activity.arrangement.title,
            destinationName: schedule.activity.arrangement.destination.name,
            transportType: schedule.activity.arrangement.transportType,
            accommodationType: schedule.activity.arrangement.accommodationType,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            maxCapacity: schedule.activity.maxCapacity,
            bookedParticipants,
            hasConflicts: conflicts.length > 0,
            conflicts
          };
        })
      );

      return new Result(StatusEnum.SUCCESS, 200, calendarData);
    } catch (error) {
      console.error('Error fetching activity schedules:', error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  /**
   * Detect scheduling conflicts for a given schedule
   * @param {Object} schedule - Activity schedule to check
   * @returns {Array} - Array of conflict objects
   */
  async detectConflicts(schedule) {
    const conflicts = [];

    try {
      // Check for overbooking
      const bookings = await ActivityBooking.findAll({
        where: { 
          activity_schedule_id: schedule.id,
          isCancelled: false
        }
      });

      const totalBooked = bookings.reduce((sum, b) => sum + b.numberOfParticipants, 0);
      if (totalBooked > schedule.activity.maxCapacity) {
        conflicts.push({
          id: `overbook-${schedule.id}`,
          type: 'overbooking',
          message: `Overbooked by ${totalBooked - schedule.activity.maxCapacity} participants`,
          severity: 'high'
        });
      }

      // Check for time conflicts with other activities in the same destination
      const overlappingSchedules = await ActivitySchedule.findAll({
        where: {
          id: { [Op.ne]: schedule.id },
          [Op.or]: [
            {
              startTime: {
                [Op.between]: [schedule.startTime, schedule.endTime]
              }
            },
            {
              endTime: {
                [Op.between]: [schedule.startTime, schedule.endTime]
              }
            },
            {
              [Op.and]: [
                { startTime: { [Op.lte]: schedule.startTime } },
                { endTime: { [Op.gte]: schedule.endTime } }
              ]
            }
          ]
        },
        include: [
          {
            model: Activity,
            as: 'activity',
            include: [
              {
                model: TravelArrangement,
                as: 'arrangement',
                where: {
                  destinationId: schedule.activity.arrangement.destinationId
                }
              }
            ]
          }
        ]
      });

      if (overlappingSchedules.length > 0) {
        overlappingSchedules.forEach(overlap => {
          conflicts.push({
            id: `overlap-${schedule.id}-${overlap.id}`,
            type: 'time_conflict',
            message: `Time conflict with "${overlap.activity.name}" (${new Date(overlap.startTime).toLocaleTimeString()} - ${new Date(overlap.endTime).toLocaleTimeString()})`,
            severity: 'medium'
          });
        });
      }

      // Check if activity is scheduled during arrangement booking period
      const arrangement = schedule.activity.arrangement;
      const departures = await Departure.findAll({
        where: { arrangementId: arrangement.id }
      });

      let isWithinArrangementPeriod = false;
      for (const departure of departures) {
        const departureStart = new Date(departure.startDate);
        const departureEnd = new Date(departure.endDate || departure.startDate);
        const scheduleDate = new Date(schedule.startTime);

        if (scheduleDate >= departureStart && scheduleDate <= departureEnd) {
          isWithinArrangementPeriod = true;
          break;
        }
      }

      if (!isWithinArrangementPeriod) {
        conflicts.push({
          id: `period-${schedule.id}`,
          type: 'period_mismatch',
          message: 'Activity scheduled outside of any arrangement departure period',
          severity: 'high'
        });
      }

    } catch (error) {
      console.error('Error detecting conflicts:', error);
    }

    return conflicts;
  }

  /**
   * Get schedule conflicts summary for dashboard
   * @returns {Promise<Result>} - Conflict summary statistics
   */
  async getConflictsSummary() {
    try {
      const schedules = await ActivitySchedule.findAll({
        include: [
          {
            model: Activity,
            as: 'activity',
            include: [
              {
                model: TravelArrangement,
                as: 'arrangement',
                include: [
                  {
                    model: Destination,
                    as: 'destination'
                  }
                ]
              }
            ]
          }
        ]
      });

      let totalConflicts = 0;
      let overbookings = 0;
      let timeConflicts = 0;
      let periodMismatches = 0;

      for (const schedule of schedules) {
        const conflicts = await this.detectConflicts(schedule);
        totalConflicts += conflicts.length;

        conflicts.forEach(conflict => {
          switch (conflict.type) {
            case 'overbooking':
              overbookings++;
              break;
            case 'time_conflict':
              timeConflicts++;
              break;
            case 'period_mismatch':
              periodMismatches++;
              break;
          }
        });
      }

      const summary = {
        totalSchedules: schedules.length,
        totalConflicts,
        conflictsByType: {
          overbookings,
          timeConflicts,
          periodMismatches
        },
        conflictRate: schedules.length > 0 ? (totalConflicts / schedules.length * 100).toFixed(1) : 0
      };

      return new Result(StatusEnum.SUCCESS, 200, summary);
    } catch (error) {
      console.error('Error getting conflicts summary:', error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  /**
   * Validate if a new schedule can be created without conflicts
   * @param {Object} scheduleData - New schedule data
   * @returns {Promise<Result>} - Validation result with conflicts if any
   */
  async validateNewSchedule(scheduleData) {
    try {
      const { activityId, startTime, endTime } = scheduleData;

      // Get activity and arrangement info
      const activity = await Activity.findByPk(activityId, {
        include: [
          {
            model: TravelArrangement,
            as: 'arrangement',
            include: [
              {
                model: Destination,
                as: 'destination'
              }
            ]
          }
        ]
      });

      if (!activity) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Activity not found' });
      }

      // Create temporary schedule object for conflict detection
      const tempSchedule = {
        id: 'temp',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        activity
      };

      const conflicts = await this.detectConflicts(tempSchedule);

      const isValid = conflicts.length === 0;
      const result = {
        isValid,
        conflicts,
        recommendations: this.generateRecommendations(conflicts, tempSchedule)
      };

      return new Result(StatusEnum.SUCCESS, 200, result);
    } catch (error) {
      console.error('Error validating schedule:', error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  /**
   * Generate recommendations to resolve conflicts
   * @param {Array} conflicts - Array of conflicts
   * @param {Object} schedule - Schedule object
   * @returns {Array} - Array of recommendations
   */
  generateRecommendations(conflicts, schedule) {
    const recommendations = [];

    conflicts.forEach(conflict => {
      switch (conflict.type) {
        case 'time_conflict':
          recommendations.push({
            type: 'reschedule',
            message: 'Consider rescheduling to avoid time conflicts with other activities',
            suggestedTimes: this.suggestAlternativeTimes(schedule)
          });
          break;
        case 'period_mismatch':
          recommendations.push({
            type: 'adjust_dates',
            message: 'Schedule the activity within the arrangement departure period',
            departureInfo: 'Check departure dates for this arrangement'
          });
          break;
        case 'overbooking':
          recommendations.push({
            type: 'capacity_management',
            message: 'Increase activity capacity or limit bookings',
            actions: ['Increase maxCapacity', 'Cancel excess bookings', 'Add additional schedule']
          });
          break;
      }
    });

    return recommendations;
  }

  /**
   * Suggest alternative time slots
   * @param {Object} schedule - Current schedule
   * @returns {Array} - Array of suggested time slots
   */
  suggestAlternativeTimes(schedule) {
    const suggestions = [];
    const duration = new Date(schedule.endTime) - new Date(schedule.startTime);
    
    // Suggest +2 hours, +4 hours, -2 hours from current time
    [-2, 2, 4].forEach(hourOffset => {
      const newStart = new Date(schedule.startTime);
      newStart.setHours(newStart.getHours() + hourOffset);
      
      const newEnd = new Date(newStart.getTime() + duration);
      
      suggestions.push({
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
        label: `${newStart.toLocaleTimeString()} - ${newEnd.toLocaleTimeString()}`
      });
    });

    return suggestions;
  }
}

module.exports = new CalendarService();
