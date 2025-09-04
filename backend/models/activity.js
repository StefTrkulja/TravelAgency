'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // ENUM definitions
  const STATUS = ['ACTIVE', 'INACTIVE']; 
  const ACTIVITY_AGE_GROUP = ['KIDS', 'TEENS', 'ADULTS', 'ALL']; 
  const SEASON = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'ALL'];

  class Activity extends Model {
    static associate(models) {
      Activity.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      Activity.belongsTo(models.Arrangement, { foreignKey: 'arrangement_id', as: 'arrangement' });
    }
  }

  Activity.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM(...STATUS), allowNull: false },
    minCapacity: { type: DataTypes.INTEGER, allowNull: false },
    maxCapacity: { type: DataTypes.INTEGER, allowNull: false },
    isPetFriendly: { type: DataTypes.BOOLEAN, allowNull: false },
    isFamilyFriendly: { type: DataTypes.BOOLEAN, allowNull: false },
    targetAgeGroup: { type: DataTypes.ENUM(...ACTIVITY_AGE_GROUP), allowNull: false },
    isOutdoor: { type: DataTypes.BOOLEAN, allowNull: false },
    isAdventure: { type: DataTypes.BOOLEAN, allowNull: false },
    season: { type: DataTypes.ENUM(...SEASON), allowNull: false },
    difficulty: { type: DataTypes.INTEGER, allowNull: true },
    price: { type: DataTypes.DOUBLE, allowNull: false },
    lengthInMin: { type: DataTypes.DOUBLE, allowNull: false },
    isPremiumOption: { type: DataTypes.BOOLEAN, allowNull: false },
    value: { type: DataTypes.FLOAT, allowNull: false },
  }, {
    sequelize,
    modelName: 'Activity',
    tableName: 'activities',
    timestamps: false,
  });

  return Activity;
};
