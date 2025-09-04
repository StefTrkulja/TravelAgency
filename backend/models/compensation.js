'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Ako imaš tačne enum vrednosti u JPA (CompensationType/Status), zameni STRING sa ENUM
  class Compensation extends Model {
    static associate(models) {
      Compensation.belongsTo(models.Complaint, { foreignKey: 'complaintId', as: 'complaint' });
      Compensation.hasOne(models.CompensationApproval, { foreignKey: 'compensationId', as: 'approval' });
    }
  }
  Compensation.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    complaintId: { type: DataTypes.BIGINT, allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false }, // ISO 4217
    type: { type: DataTypes.STRING(32), allowNull: false },    // npr. 'REFUND','VOUCHER'…
    status: { type: DataTypes.STRING(32), allowNull: false },  // npr. 'PROPOSED','APPROVED','REJECTED'
    amount: { type: DataTypes.DECIMAL(19, 2), allowNull: false },
    note: { type: DataTypes.TEXT },
    proposedAt: { type: DataTypes.DATE },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE },
  }, {
    sequelize,
    modelName: 'Compensation',
    tableName: 'compensations',
    timestamps: false,
    indexes: [{ name: 'ix_compensation_complaint', fields: ['complaintId'] }],
  });
  return Compensation;
};
