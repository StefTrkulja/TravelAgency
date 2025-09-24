'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OfferSelection extends Model {
    static associate(models) {
      OfferSelection.belongsTo(models.TravelArrangement, { foreignKey: 'arrangementId', as: 'arrangement' });
      OfferSelection.belongsTo(models.SupplierOffer, { foreignKey: 'offerId', as: 'offer' });
      OfferSelection.belongsTo(models.User, { foreignKey: 'selectedByUsername', targetKey: 'username', as: 'selectedBy' });
    }
  }

  OfferSelection.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    arrangementId: { type: DataTypes.INTEGER, allowNull: false },
    offerId: { type: DataTypes.INTEGER, allowNull: false, unique: true }, // može ostati
    category: {                                     // ★ NOVO
      type: DataTypes.ENUM('TRANSPORT','ACCOMMODATION','TOUR'),
      allowNull: false
    },
    selectedByUsername: { type: DataTypes.STRING, allowNull: false },
    selectedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, { 
    sequelize, 
    modelName: 'OfferSelection',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['arrangementId','category'] } // ★ jedinstvena selekcija po kategoriji
    ]
  });

  return OfferSelection;
};
