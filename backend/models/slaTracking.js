// models/slaTracking.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SlaTracking extends Model {
    static associate(models) {
      SlaTracking.belongsTo(models.Complaint, { foreignKey: 'id', as: 'complaint' });
    }
  }

  SlaTracking.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true }, // = Complaint.id

      // First response
      responseDueAt: { type: DataTypes.DATE, allowNull: true },
      firstResponseAt: { type: DataTypes.DATE, allowNull: true },
      responseBreachedChecked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      // Resolution
      resolutionStartedAt: { type: DataTypes.DATE, allowNull: true },
      resolutionDueAt: { type: DataTypes.DATE, allowNull: true },
      pauseStartedAt: { type: DataTypes.DATE, allowNull: true },
      totalPausedMs: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
      resolvedAt: { type: DataTypes.DATE, allowNull: true },
      resolutionBreachedChecked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      // Summary
      breachesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lastCheckedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'SlaTracking',
      tableName: 'sla_tracking',
      timestamps: false,
    }
  );

  return SlaTracking;
};
