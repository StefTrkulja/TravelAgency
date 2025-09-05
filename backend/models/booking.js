'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const STATUS = ['INITIATED', 'CONFIRMED', 'CANCELLED', 'REFUNDED'];

  class Booking extends Model {
    static associate(models) {
      // Relations to other tables
      Booking.belongsTo(models.User, { foreignKey: 'traveler_id', as: 'traveler' });
      Booking.belongsTo(models.Departure, { foreignKey: 'departure_id', as: 'departure' });
    }
  }

  Booking.init({

    bookingDate: { type: DataTypes.DATE, allowNull: false },
    travelersCount: { type: DataTypes.INTEGER, allowNull: false },

    basePriceAtBooking: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discountPercentApplied: { type: DataTypes.FLOAT, allowNull: true },
    grandTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },

    status: { type: DataTypes.ENUM(...STATUS), allowNull: false, defaultValue: 'INITIATED' },
    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    cancelReason: { type: DataTypes.TEXT, allowNull: true },

    isPetFriendly: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isAdventurous: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isBusiness: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    timestamps: false,
  });

  return Booking;
};
