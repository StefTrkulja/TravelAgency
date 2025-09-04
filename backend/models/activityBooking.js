'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ActivityBooking extends Model {
    static associate(models) {
      ActivityBooking.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      ActivityBooking.belongsTo(models.ActivitySchedule, { foreignKey: 'activity_schedule_id', as: 'activitySchedule' });
      ActivityBooking.belongsTo(models.ArrangementBooking, { foreignKey: 'arrangement_booking_id', as: 'arrangementBooking' });
    }
  }

  ActivityBooking.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    bookingDate: { type: DataTypes.DATE, allowNull: false },
    numberOfParticipants: { type: DataTypes.INTEGER, allowNull: false },
    totalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    isCancelled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    cancellationReason: { type: DataTypes.STRING, allowNull: true },
    petsIncluded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    sequelize,
    modelName: 'ActivityBooking',
    tableName: 'activity_bookings',
    timestamps: false,
  });

  return ActivityBooking;
};
