'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const ESCALATION_STATUS = ['PENDING','ACCEPTED','REJECTED','RESOLVED','CLOSED'];

  class Escalation extends Model {
    static associate(models) {
      Escalation.belongsTo(models.Complaint, { foreignKey: 'complaintId', as: 'complaint', unique: true });
      Escalation.belongsTo(models.User, { foreignKey: 'managerUsername', as: 'manager' }); // menadžer koji odlučuje
      Escalation.hasMany(models.EscalationMessage, { foreignKey: 'escalationId', as: 'messages' });
    }
  }
  Escalation.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    complaintId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    reason: { type: DataTypes.TEXT, allowNull: false },
    escalatedAt: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.ENUM(...ESCALATION_STATUS), allowNull: false, defaultValue: 'PENDING' },
    managerNote: { type: DataTypes.TEXT }, // opcionalno polje iz JPA
    managerUsername: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'Escalation',
    tableName: 'escalations',
    timestamps: false,
  });
  return Escalation;
};
