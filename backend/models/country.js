'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Country extends Model {
    static associate(models) {
      Country.hasMany(models.Destination, { foreignKey: 'countryId', as: 'destinations' });
    }
  }
  Country.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true }
  }, { 
    sequelize, 
    modelName: 'Country',
    timestamps: true   
  });
  return Country;
};
