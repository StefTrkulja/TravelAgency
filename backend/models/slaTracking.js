'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SlaTracking extends Model {
    static associate(models) {
      SlaTracking.belongsTo(models.Complaint, { foreignKey: 'id', as: 'complaint' }); // PK = FK
    }
  }
  SlaTracking.init({
    id: { type: DataTypes.BIGINT, primaryKey: true }, // deli PK sa Complaint
    responseDueAt: { type: DataTypes.DATE, allowNull: true },
    resolutionDueAt: { type: DataTypes.DATE, allowNull: true },
    firstResponseAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    breachesCount: { type: DataTypes.INTEGER, allowNull: true },
    lastCheckedAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'SlaTracking',
    tableName: 'sla_tracking',
    timestamps: false,
  });
  return SlaTracking;
};
