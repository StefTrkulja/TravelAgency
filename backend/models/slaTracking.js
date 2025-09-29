'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SlaTracking extends Model {
    static associate(models) {
      SlaTracking.belongsTo(models.Complaint, { 
        foreignKey: 'id', 
        targetKey: 'id',
        as: 'complaint' 
      });
    }
  }

  SlaTracking.init(
    {
      id: { type: DataTypes.BIGINT, primaryKey: true },

      // ===== Snapshot SLA parametara (zakucano pri accept-u) =====
      appliedResponseMins:   { type: DataTypes.INTEGER, allowNull: true }, 
      appliedResolutionMins: { type: DataTypes.INTEGER, allowNull: true }, 

      // ===== First response SLA =====
      responseDueAt:           { type: DataTypes.DATE, allowNull: true },
      firstResponseAt:         { type: DataTypes.DATE, allowNull: true },
      responseBreachedChecked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      responseBreached:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

      // ===== Resolution SLA =====
      resolutionStartedAt:      { type: DataTypes.DATE, allowNull: true },
      resolutionDueAt:          { type: DataTypes.DATE, allowNull: true },
      pauseStartedAt:           { type: DataTypes.DATE, allowNull: true },
      totalPausedMs:            { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
      resolvedAt:               { type: DataTypes.DATE, allowNull: true },
      resolutionBreachedChecked:{ type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      resolutionBreached:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      breachReason:             { type: DataTypes.STRING,  allowNull: true }, 

      // ===== “At-risk” (upozorenja pre isteka) =====
      atRiskSince:             { type: DataTypes.DATE, allowNull: true },
      atRiskType:              { type: DataTypes.ENUM('RESPONSE','RESOLUTION'), allowNull: true },

      // ===== Analitika (brže metrike) =====
      firstResponseMs:         { type: DataTypes.BIGINT, allowNull: true }, 
      effectiveResolutionMs:   { type: DataTypes.BIGINT, allowNull: true },    

      // ===== Sažetak / batchevi =====
      breachesCount:           { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lastCheckedAt:           { type: DataTypes.DATE, allowNull: true },
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
