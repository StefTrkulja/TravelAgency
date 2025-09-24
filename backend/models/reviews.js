'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, {
        foreignKey: 'userUsername',
        as: 'user'
      });
      Review.belongsTo(models.TravelArrangement, {
        foreignKey: 'arrangementId',
        as: 'arrangement'
      });
    }
  }

  Review.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    userUsername: { type: DataTypes.STRING, allowNull: false },
    arrangementId: { type: DataTypes.BIGINT, allowNull: false },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 }
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
  }, {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    timestamps: true,
  });

  return Review;
};
