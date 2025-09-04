'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Attachment extends Model {
    static associate(models) {
      Attachment.belongsTo(models.Complaint, {
        foreignKey: 'complaintId',
        as: 'complaint',
      });
    }
  }
  Attachment.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    originalFilename: { type: DataTypes.STRING(255), allowNull: false },
    contentType: { type: DataTypes.STRING(100), allowNull: false },
    sizeBytes: { type: DataTypes.BIGINT, allowNull: false },
    storageKey: { type: DataTypes.STRING(512), allowNull: false },
    uploadedAt: { type: DataTypes.DATE, allowNull: true }, // CreationTimestamp u JPA
  }, {
    sequelize,
    modelName: 'Attachment',
    tableName: 'attachments',
    timestamps: false,
    indexes: [{ name: 'ix_attachment_complaint', fields: ['complaintId'] }],
  });
  return Attachment;
};
