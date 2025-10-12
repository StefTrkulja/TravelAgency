'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DynamicPriceChange extends Model {
    static associate(models) {
      DynamicPriceChange.belongsTo(models.TravelArrangement, {
        foreignKey: 'arrangementId',
        as: 'arrangement',
      });
    }
  }

  DynamicPriceChange.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    arrangementId: { type: DataTypes.BIGINT, allowNull: false },
    oldPrice: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    newPrice: { type: DataTypes.DECIMAL(12,2), allowNull: false },
    ruleApplied: { type: DataTypes.STRING(128), allowNull: false },
    explanation: { type: DataTypes.TEXT, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    sequelize,
    modelName: 'DynamicPriceChange',
    tableName: 'dynamic_price_changes',
    updatedAt: false,
  });

  return DynamicPriceChange;
};