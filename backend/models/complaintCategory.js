'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ComplaintCategory extends Model {
    static associate(models) {
      ComplaintCategory.hasMany(models.Complaint, { foreignKey: 'categoryId', as: 'complaints' });
    }
  }
  ComplaintCategory.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(512) },
  }, {
    sequelize,
    modelName: 'ComplaintCategory',
    tableName: 'complaint_categories',
    timestamps: false,
  });
  return ComplaintCategory;
};
