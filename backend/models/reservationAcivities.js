'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ResrvationActivities extends Model {
    static associate(models) {
      ResrvationActivities.belongsTo(models.ItineraryActivity, { foreignKey: 'itineraryId', as: 'itineraryActivity' });
      ResrvationActivities.belongsTo(models.Reservation, { foreignKey: 'reservationId', as: 'reservation' });
    }
  }

  ResrvationActivities.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    itineraryId: { type: DataTypes.INTEGER, allowNull: false },
    reservationId: { type: DataTypes.INTEGER, allowNull: false },
  }, { sequelize, modelName: 'ResrvationActivities', timestamps: true });

  return ResrvationActivities;
};
