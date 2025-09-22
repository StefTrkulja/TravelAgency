'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ItineraryActivity extends Model {
    static associate(models) {
      ItineraryActivity.belongsTo(models.Itinerary, { foreignKey: 'itineraryId', as: 'itinerary' });
    }
  }

  ItineraryActivity.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    itineraryId: { type: DataTypes.INTEGER, allowNull: false },
    startTime: { type: DataTypes.TIME },
    endTime: { type: DataTypes.TIME },
    activityTitle: { type: DataTypes.STRING, allowNull: false },
    activityDescription: { type: DataTypes.TEXT },
    extraCost: { type: DataTypes.DECIMAL },
    providerNote: { type: DataTypes.STRING }
  }, { sequelize, modelName: 'ItineraryActivity', timestamps: true });

  return ItineraryActivity;
};
