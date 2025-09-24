'use strict';
// @ts-ignore
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ArrangementVersion extends Model {
    static associate(models) {
      ArrangementVersion.belongsTo(models.TravelArrangement, { foreignKey: 'arrangementId', as: 'arrangement' });
    }
  }

  ArrangementVersion.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    arrangementId: { type: DataTypes.INTEGER, allowNull: false },
    versionNo: { type: DataTypes.INTEGER, allowNull: false },
    changedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    changeNote: { type: DataTypes.STRING(1024) }
  }, { 
    sequelize, 
    modelName: 'ArrangementVersion',
    timestamps: true   
  });

  return ArrangementVersion;
};
