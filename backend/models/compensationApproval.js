'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const DECISION = ['APPROVED','REJECTED'];

  class CompensationApproval extends Model {
    static associate(models) {
      CompensationApproval.belongsTo(models.Compensation, {
        foreignKey: 'compensationId',
        as: 'compensation',
        unique: true,
      });
      CompensationApproval.belongsTo(models.User, {
        foreignKey: 'managerUsername',
        as: 'manager',
      });
    }
  }
  CompensationApproval.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    compensationId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    decision: { type: DataTypes.ENUM(...DECISION), allowNull: false },
    decidedAt: { type: DataTypes.DATE, allowNull: false },
    managerUsername: { type: DataTypes.STRING, allowNull: false },
  }, {
    sequelize,
    modelName: 'CompensationApproval',
    tableName: 'compensation_approvals',
    timestamps: false,
    indexes: [{ name: 'ix_approval_compensation', fields: ['compensationId'], unique: true }],
  });
  return CompensationApproval;
};
