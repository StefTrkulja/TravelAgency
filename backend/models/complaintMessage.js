'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ComplaintMessage extends Model {
    static associate(models) {
      ComplaintMessage.belongsTo(models.Complaint, { foreignKey: 'complaintId', as: 'complaint' });
      ComplaintMessage.belongsTo(models.User, { foreignKey: 'authorUsername', as: 'author' });
    }
  }
  ComplaintMessage.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true }, // u JPA ima embeddable ID; ovde pojednostavljeno
    complaintId: { type: DataTypes.BIGINT, allowNull: false },
    authorUsername: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'ComplaintMessage',
    tableName: 'complaint_messages',
    timestamps: false,
    indexes: [{ name: 'ix_message_complaint', fields: ['complaintId'] }],
  });
  return ComplaintMessage;
};
