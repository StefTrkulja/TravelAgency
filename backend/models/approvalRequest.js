'use strict';
// @ts-ignore
const { Model } = require('sequelize');

const ApprovalDecision = { 
  PENDING: 'PENDING', 
  APPROVED: 'APPROVED', 
  REJECTED: 'REJECTED' 
};

module.exports = (sequelize, DataTypes) => {
  class ApprovalRequest extends Model {
    static associate(models) {
      ApprovalRequest.belongsTo(models.TravelArrangement, { foreignKey: 'arrangementId', as: 'arrangement' });
      ApprovalRequest.belongsTo(models.User, { foreignKey: 'requestedByUsername', targetKey: 'username', as: 'requestedBy' });
      ApprovalRequest.belongsTo(models.User, { foreignKey: 'approvedByUsername', targetKey: 'username', as: 'approvedBy' });
    }
  }

  ApprovalRequest.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    arrangementId: { type: DataTypes.INTEGER, allowNull: false },
    requestedByUsername: { type: DataTypes.STRING, allowNull: false },
    approvedByUsername: { type: DataTypes.STRING },
    requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    decision: { 
      type: DataTypes.ENUM(...Object.values(ApprovalDecision)), 
      allowNull: false, 
      defaultValue: 'PENDING' 
    },
    decidedAt: { type: DataTypes.DATE },
    comment: { type: DataTypes.STRING }
  }, { 
    sequelize, 
    modelName: 'ApprovalRequest',
    timestamps: true   
  });

  ApprovalRequest.ApprovalDecision = ApprovalDecision;
  return ApprovalRequest;
};
