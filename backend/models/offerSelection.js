'use strict';
const { Model: SequelizeModel } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OfferSelection extends SequelizeModel {
    static associate(models) {
      OfferSelection.belongsTo(models.TravelArrangement, { foreignKey: 'arrangementId', as: 'arrangement' });
      OfferSelection.belongsTo(models.SupplierOffer, { foreignKey: 'offerId', as: 'offer' });
      OfferSelection.belongsTo(models.User, { foreignKey: 'selectedByUsername', targetKey: 'username', as: 'selectedBy' });
    }
  }

  OfferSelection.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    arrangementId: { type: DataTypes.INTEGER, allowNull: false },
    offerId: { type: DataTypes.INTEGER, allowNull: false, unique: true }, // 1:1 izbor
    selectedByUsername: { type: DataTypes.STRING, allowNull: false },
    selectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { sequelize, modelName: 'OfferSelection', timestamps: true });

  return OfferSelection;
};
