'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ActivityAnalytics extends Model {
    static associate(models) {
      ActivityAnalytics.belongsTo(models.Activity, { foreignKey: 'activity_id', as: 'activity' });
      ActivityAnalytics.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }

  ActivityAnalytics.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    numberOfParticipants: { type: DataTypes.INTEGER, allowNull: false },
    fullIncome: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    profits: { type: DataTypes.DECIMAL(12, 2), allowNull: false },

    numberOfReviews: { type: DataTypes.INTEGER, allowNull: false },
    averageOverallRating: { type: DataTypes.FLOAT, allowNull: true },
    averageGuideRating: { type: DataTypes.FLOAT, allowNull: true },
    averageSafetyRating: { type: DataTypes.FLOAT, allowNull: true },
    revisitingRate: { type: DataTypes.FLOAT, allowNull: true },

    occupancyRate: { type: DataTypes.FLOAT, allowNull: true }, // "stop popunjenost"
    cancellationRate: { type: DataTypes.FLOAT, allowNull: true },

    requestedAt: { type: DataTypes.DATE, allowNull: false },
    fromDate: { type: DataTypes.DATEONLY, allowNull: false },
    toDate: { type: DataTypes.DATEONLY, allowNull: false },
  }, {
    sequelize,
    modelName: 'ActivityAnalytics',
    tableName: 'ActivityAnalytics',
    timestamps: false, 
  });

  return ActivityAnalytics;
};
