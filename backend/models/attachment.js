// models/attachment.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Attachment extends Model {
    static associate(models) {
      Attachment.belongsTo(models.Complaint, {
        foreignKey: 'complaintId',
        as: 'complaint',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  Attachment.init({
    id:         { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    complaintId:{ type: DataTypes.BIGINT, allowNull: false },
    storageKey: { type: DataTypes.STRING(512), allowNull: false }, // relativna putanja
  }, {
    sequelize,
    modelName: 'Attachment',
    tableName: 'attachments',
    timestamps: false,
    indexes: [{ name: 'ix_attachment_complaint', fields: ['complaintId'] }],
  });

  return Attachment;
};
