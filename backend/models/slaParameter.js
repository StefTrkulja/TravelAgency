'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SlaParameter extends Model {
    static associate(models) {}
  }

  SlaParameter.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

      priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        allowNull: false,
        unique: true,
      },

      // rok za prvi odgovor (min)
      targetResponseMins:   { type: DataTypes.INTEGER, allowNull: false },

      // rok za potpuno rešavanje (min)
      targetResolutionMins: { type: DataTypes.INTEGER, allowNull: false },

      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: 'slaParameter',
      tableName: 'sla_parameter',
      timestamps: false,
    }
  );

  return SlaParameter;
};
