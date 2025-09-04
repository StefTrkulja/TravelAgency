'use strict';
const { Model: SequelizeModel } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Itinerary extends SequelizeModel {
    static associate(models) {
      Itinerary.belongsTo(models.Departure, { foreignKey: 'departureId', as: 'departure' });
      Itinerary.hasMany(models.ItineraryActivity, { foreignKey: 'itineraryId', as: 'activities' });
    }
  }

  Itinerary.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    departureId: { type: DataTypes.INTEGER, allowNull: false },
    dayNo: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    date: { type: DataTypes.DATEONLY },
    startTime: { type: DataTypes.TIME },
    endTime: { type: DataTypes.TIME },
    location: { type: DataTypes.STRING }
  }, { 
    sequelize, 
    modelName: 'Itinerary',
    timestamps: true   
  });

  return Itinerary;
};
