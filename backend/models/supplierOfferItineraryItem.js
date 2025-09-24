'use strict';
const { Model: Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SupplierOfferItineraryItem extends Model {
    static associate(models) {
      SupplierOfferItineraryItem.belongsTo(models.SupplierOffer, { foreignKey: 'offerId', as: 'offer' });
    }
  }

  SupplierOfferItineraryItem.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    offerId: { type: DataTypes.INTEGER, allowNull: false },

    dayNo: { type: DataTypes.INTEGER, defaultValue: 1 }, // za jednodnevni izlet uglavnom 1
    orderNo: { type: DataTypes.INTEGER, defaultValue: 1 }, // redosled unutar dana
    startTime: { type: DataTypes.TIME },
    endTime: { type: DataTypes.TIME },
    title: { type: DataTypes.STRING, allowNull: false },       // "Louvre tour"
    description: { type: DataTypes.TEXT },                     // "Kratak opis"
    location: { type: DataTypes.STRING },
    extraCost: { type: DataTypes.DECIMAL }                     // npr ulaznice
  }, { sequelize, modelName: 'SupplierOfferItineraryItem', timestamps: true });

  return SupplierOfferItineraryItem;
};
