'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Status extends Model {
    static associate(models) {
      Status.hasMany(models.StatusTransition, { foreignKey: 'fromStatusId', as: 'outgoing' });
      Status.hasMany(models.StatusTransition, { foreignKey: 'toStatusId', as: 'incoming' });
      Status.hasMany(models.Complaint, { foreignKey: 'statusId', as: 'complaints' });
      Status.belongsTo(Status, { foreignKey: 'parentId', as: 'parent' });
      Status.hasMany(Status, { foreignKey: 'parentId', as: 'children' });
    }
  }
  Status.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(128), allowNull: false },
    description: { type: DataTypes.STRING(1024) },
    orderIndex: { type: DataTypes.INTEGER },
    parentId: { type: DataTypes.BIGINT, allowNull: true },
    // isTerminal, isInitial… ako postoje u JPA, dodaćemo po potrebi
  }, {
    sequelize,
    modelName: 'Status',
    tableName: 'statuses',
    timestamps: false,
  });
  return Status;
};
