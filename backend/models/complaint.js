'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Complaint extends Model {
    static associate(models) {
      Complaint.belongsTo(models.Status, { foreignKey: 'statusId', as: 'status' });
      Complaint.hasMany(models.Attachment, { foreignKey: 'complaintId', as: 'attachments' });
      Complaint.hasMany(models.ComplaintMessage, { foreignKey: 'complaintId', as: 'messages' });
      Complaint.hasMany(models.ComplaintStatusHistory, { foreignKey: 'complaintId', as: 'statusHistory' });
      Complaint.hasOne(models.SlaTracking, { 
        foreignKey: 'id', 
        sourceKey: 'id',
        as: 'sla' 
      }); // deljenje PK
      Complaint.hasOne(models.Escalation, { foreignKey: 'complaintId', as: 'escalation' });
      Complaint.hasMany(models.Compensation, { foreignKey: 'complaintId', as: 'compensations' });
      Complaint.hasOne(models.CustomerSatisfaction, { foreignKey: 'complaintId', as: 'satisfaction' });
      Complaint.belongsTo(models.Reservation, { foreignKey: 'reservationId', as: 'reservation' });
      Complaint.belongsTo(models.User, { foreignKey: 'createdByUsername', as: 'createdBy' });
      Complaint.belongsTo(models.User, { foreignKey: 'assigneeUsername', as: 'assignee' });
    }
  }
  Complaint.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    priority: { type: DataTypes.ENUM('LOW','MEDIUM','HIGH','CRITICAL'), allowNull: true }, 
    createdAt: { type: DataTypes.DATE, allowNull: true },
    lastActivityAt: { type: DataTypes.DATE, allowNull: true },
    category: { type: DataTypes.STRING(100), allowNull: false },
        // FK polja:
    statusId: { type: DataTypes.BIGINT, allowNull: true },
    reservationId: { type: DataTypes.BIGINT, allowNull: true },
    createdByUsername: { type: DataTypes.STRING, allowNull: false },
    assigneeUsername: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'Complaint',
    tableName: 'complaints',
    timestamps: false, 
  });
  return Complaint;
};
