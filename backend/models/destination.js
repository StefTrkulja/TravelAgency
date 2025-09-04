'use strict';
// @ts-ignore
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Destination extends Model {
    static associate(models) {
      Destination.belongsTo(models.Country, { foreignKey: 'countryId', as: 'country' });
      Destination.belongsTo(models.User, { foreignKey: 'createdByUsername', targetKey: 'username', as: 'creator' });
      Destination.hasMany(models.TravelArrangement, { foreignKey: 'destinationId', as: 'arrangements' });
    }
  }

  Destination.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    countryId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdByUsername: { type: DataTypes.STRING, allowNull: false }
  }, { 
    sequelize, 
    modelName: 'Destination',
    timestamps: true   
  });

  return Destination;
};
