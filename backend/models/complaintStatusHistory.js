// models/complaintStatusHistory.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ComplaintStatusHistory extends Model {
    static associate(models) {
      ComplaintStatusHistory.belongsTo(models.Complaint, { foreignKey: 'complaintId', as: 'complaint' });
      ComplaintStatusHistory.belongsTo(models.Status, { foreignKey: 'fromStatusId', as: 'fromStatus' });
      ComplaintStatusHistory.belongsTo(models.Status, { foreignKey: 'toStatusId', as: 'toStatus' });

      // ⬇️ OVO DODAJ: mapiraj changedByUsername -> Users.username
      ComplaintStatusHistory.belongsTo(models.User, {
        foreignKey: 'changedByUsername',
        targetKey: 'username',      // <— ključno
        as: 'changedBy',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',       // ili 'RESTRICT' / 'NO ACTION' po želji
      });
    }
  }

  ComplaintStatusHistory.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    complaintId: { type: DataTypes.BIGINT, allowNull: false },
    fromStatusId: { type: DataTypes.BIGINT, allowNull: true },
    toStatusId: { type: DataTypes.BIGINT, allowNull: false },
    changedAt: { type: DataTypes.DATE, allowNull: false },
    changedByUsername: { type: DataTypes.STRING, allowNull: false }, // FK na Users.username
    note: { type: DataTypes.TEXT },
  }, {
    sequelize,
    modelName: 'ComplaintStatusHistory',
    tableName: 'complaint_status_history',
    timestamps: false,
  });

  return ComplaintStatusHistory;
};
