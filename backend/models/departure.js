'use strict';
// @ts-ignore
const { Model: Model } = require('sequelize');

const DepartureStatus = { 
  SCHEDULED: 'SCHEDULED', 
  ON_SALE: 'ON_SALE', 
  SOLD_OUT: 'SOLD_OUT', 
  CANCELLED: 'CANCELLED', 
  COMPLETED: 'COMPLETED' 
};

module.exports = (sequelize, DataTypes) => {
  class Departure extends Model {
    static associate(models) {
      Departure.belongsTo(models.TravelArrangement, { foreignKey: 'arrangementId', as: 'arrangement' });
      Departure.hasMany(models.Itinerary, { foreignKey: 'departureId', as: 'itinerary' });
    }
  }

  Departure.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    arrangementId: { type: DataTypes.INTEGER, allowNull: false },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    endDate: { type: DataTypes.DATEONLY },
    capacityTotal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { 
      type: DataTypes.ENUM(...Object.values(DepartureStatus)), 
      allowNull: false, 
      defaultValue: 'SCHEDULED' 
    }
  }, { 
    sequelize, 
    modelName: 'Departure',
    timestamps: true  
  });

  Departure.DepartureStatus = DepartureStatus;
  return Departure;
};
