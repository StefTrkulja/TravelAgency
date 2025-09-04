'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    static associate(models) {
      Reservation.hasMany(models.Complaint, { foreignKey: 'reservationId', as: 'complaints' });
    }
  }
  Reservation.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    startsAt: { type: DataTypes.DATE },
    endsAt: { type: DataTypes.DATE },
    customerUsername: { type: DataTypes.STRING }, // ako treba povezati na User
  }, {
    sequelize,
    modelName: 'Reservation',
    tableName: 'reservations',
    timestamps: false,
  });
  return Reservation;
};
