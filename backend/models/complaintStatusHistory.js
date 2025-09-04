'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ComplaintStatusHistory extends Model {
    static associate(models) {
      ComplaintStatusHistory.belongsTo(models.Complaint, { foreignKey: 'complaintId', as: 'complaint' });
      ComplaintStatusHistory.belongsTo(models.Status, { foreignKey: 'fromStatusId', as: 'fromStatus' });
      ComplaintStatusHistory.belongsTo(models.Status, { foreignKey: 'toStatusId', as: 'toStatus' });
      ComplaintStatusHistory.belongsTo(models.User, { foreignKey: 'changedByUsername', as: 'changedBy' });
    }
  }
  ComplaintStatusHistory.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    complaintId: { type: DataTypes.BIGINT, allowNull: false },
    fromStatusId: { type: DataTypes.BIGINT, allowNull: true },
    toStatusId: { type: DataTypes.BIGINT, allowNull: false },
    changedAt: { type: DataTypes.DATE, allowNull: false },
    changedByUsername: { type: DataTypes.STRING, allowNull: false },
    note: { type: DataTypes.TEXT },
  }, {
    sequelize,
    modelName: 'ComplaintStatusHistory',
    tableName: 'complaint_status_history',
    timestamps: false,
  });
  return ComplaintStatusHistory;
};
