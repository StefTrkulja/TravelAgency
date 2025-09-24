'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ActivitySchedule extends Model {
    static associate(models) {
      ActivitySchedule.belongsTo(models.Activity, { foreignKey: 'activity_id', as: 'activity' });
    }
  }

  ActivitySchedule.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
  }, {
    sequelize,
    modelName: 'ActivitySchedule',
    tableName: 'activity_schedules',
    timestamps: false, 
  });

  return ActivitySchedule;
};
