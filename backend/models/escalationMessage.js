'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EscalationMessage extends Model {
    static associate(models) {
      EscalationMessage.belongsTo(models.Escalation, { foreignKey: 'escalationId', as: 'escalation' });
      EscalationMessage.belongsTo(models.User, { foreignKey: 'authorUsername', as: 'author' });
    }
  }
  EscalationMessage.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    escalationId: { type: DataTypes.BIGINT, allowNull: false },
    authorUsername: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    sequelize,
    modelName: 'EscalationMessage',
    tableName: 'escalation_messages',
    timestamps: false,
  });
  return EscalationMessage;
};
