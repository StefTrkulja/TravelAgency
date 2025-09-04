'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ActivityReview extends Model {
    static associate(models) {
      // Relations
      ActivityReview.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
      ActivityReview.belongsTo(models.ActivityBooking, { foreignKey: 'activity_booking_id', as: 'activityBooking' });
    }
  }

  ActivityReview.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    overallRating: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    organizationRating: { type: DataTypes.INTEGER, allowNull: false },
    guideRating: { type: DataTypes.INTEGER, allowNull: false },
    valueForMoneyRating: { type: DataTypes.INTEGER, allowNull: false },
    safetyRating: { type: DataTypes.INTEGER, allowNull: false },
    funRating: { type: DataTypes.INTEGER, allowNull: false },
    wouldRevisit: { type: DataTypes.BOOLEAN, allowNull: false },
  }, {
    sequelize,
    modelName: 'ActivityReview',
    tableName: 'activity_reviews',
    timestamps: false,
  });

  return ActivityReview;
};
