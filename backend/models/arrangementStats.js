'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ArrangementStats extends Model {
    static associate(models) {
      ArrangementStats.belongsTo(models.TravelArrangement, {
        foreignKey: 'arrangementId',
        as: 'arrangement',
      });
    }
  }

  ArrangementStats.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    arrangementId: { type: DataTypes.BIGINT, allowNull: false },
    totalReservations: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalPeople: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    totalRevenue: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    avgPricePerPerson: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    occupancyRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true }, // % popunjenosti
    kidsShare: { type: DataTypes.DECIMAL(5, 2), allowNull: true }, // % djece u ukupnom broju putnika
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    sequelize,
    modelName: 'ArrangementStats',
    tableName: 'arrangement_stats',
    timestamps: false
  });

  return ArrangementStats;
};
