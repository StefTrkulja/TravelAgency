'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    static associate(models) {
      Reservation.hasMany(models.Complaint, { foreignKey: 'reservationId', as: 'complaints' });
      Reservation.hasMany(models.Payment, { foreignKey: 'reservationId', as: 'payments' });
      Reservation.belongsTo(models.TravelArrangement, { foreignKey: 'arrangementId', as: 'arrangement' });
      Reservation.belongsTo(models.User, { foreignKey: 'customerUsername',  targetKey: 'username', as: 'customer' });
      Reservation.belongsTo(models.Departure, { foreignKey: 'departureId', as: 'departure' });

    }
  }
  Reservation.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    arrangementId: { type: DataTypes.BIGINT, allowNull: false },
    departureId: { type: DataTypes.INTEGER, allowNull: true, field: 'departure_id' },
    customerUsername: { type: DataTypes.STRING, allowNull: false },
    numberOfPeople: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    totalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: { type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED'), allowNull: false, defaultValue: 'PENDING' },
    specialRequests: { type: DataTypes.TEXT, allowNull: true },
    startsAt: { type: DataTypes.DATE, allowNull: true },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: true },
    updatedAt: { type: DataTypes.DATE, allowNull: true },
    numberOfKids: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
  }, {
    sequelize,
    modelName: 'Reservation',
    tableName: 'reservations',
    timestamps: true,
  });
  return Reservation;
};
