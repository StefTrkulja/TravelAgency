'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Destination extends Model {
    static associate(models) {
      Destination.belongsTo(models.Country, { foreignKey: 'countryId', as: 'country' });
      Destination.hasMany(models.TravelArrangement, { foreignKey: 'destinationId', as: 'arrangements' });
    }
  }
  Destination.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    countryId: { type: DataTypes.BIGINT, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: true },
    updatedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'Destination',
    tableName: 'destinations',
    timestamps: true,
  });
  return Destination;
};
