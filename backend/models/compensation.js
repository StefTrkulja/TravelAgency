'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Ako imaš tačne enum vrednosti u JPA (CompensationType/Status), zameni STRING sa ENUM
  class Compensation extends Model {
    static associate(models) {
      Compensation.belongsTo(models.Complaint, { foreignKey: 'complaintId', as: 'complaint' });
      Compensation.hasOne(models.CompensationApproval, { foreignKey: 'compensationId', as: 'approval' });
      Compensation.belongsTo(models.User, { foreignKey: 'managerUsername', targetKey: 'username', as: 'manager' });

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
    createdAt: { type: DataTypes.DATE },
    validUntil: { type: DataTypes.DATE },
    managerUsername: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'Compensation',
    tableName: 'compensations',
    timestamps: false,
    indexes: [{ name: 'ix_compensation_complaint', fields: ['complaintId'] }],
  });
  return Compensation;
};
