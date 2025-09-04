'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StatusTransition extends Model {
    static associate(models) {
      StatusTransition.belongsTo(models.Status, { foreignKey: 'fromStatusId', as: 'from' });
      StatusTransition.belongsTo(models.Status, { foreignKey: 'toStatusId', as: 'to' });
    }
  }
  StatusTransition.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    fromStatusId: { type: DataTypes.BIGINT, allowNull: false },
    toStatusId: { type: DataTypes.BIGINT, allowNull: false },
  }, {
    sequelize,
    modelName: 'StatusTransition',
    tableName: 'status_transitions',
    timestamps: false,
    indexes: [
      { unique: true, name: 'ux_transition_from_to', fields: ['fromStatusId', 'toStatusId'] },
      { name: 'ix_transition_from', fields: ['fromStatusId'] },
      { name: 'ix_transition_to', fields: ['toStatusId'] },
    ],
  });
  return StatusTransition;
};
