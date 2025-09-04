'use strict';
// @ts-ignore
const { Model } = require('sequelize');

const OfferType = { HOTEL:'HOTEL', AIRLINE:'AIRLINE', BUS:'BUS', GUIDE:'GUIDE', OTHER:'OTHER' };
const OfferStatus = { SENT:'SENT', RECEIVED:'RECEIVED', ACCEPTED:'ACCEPTED', REJECTED:'REJECTED' };

module.exports = (sequelize, DataTypes) => {
  class SupplierOffer extends Model {
    static associate(models) {
      SupplierOffer.belongsTo(models.TravelArrangement, { foreignKey: 'arrangementId', as: 'arrangement' });
      SupplierOffer.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
      SupplierOffer.belongsTo(models.User, { foreignKey: 'decisionByUsername', targetKey: 'username', as: 'decisionBy' });
      SupplierOffer.hasOne(models.OfferSelection, { foreignKey: 'offerId', as: 'selection' });
    }
  }

  SupplierOffer.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    arrangementId: { type: DataTypes.INTEGER, allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: false },
    offerType: { type: DataTypes.ENUM(...Object.values(OfferType)), allowNull: false },
    terms: { type: DataTypes.TEXT },
    priceTotal: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    requestSentAt: { type: DataTypes.DATE },
    receivedAt: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM(...Object.values(OfferStatus)), allowNull: false, defaultValue: 'SENT' },
    decisionByUsername: { type: DataTypes.STRING },
    decisionAt: { type: DataTypes.DATE }
  }, { sequelize, modelName: 'SupplierOffer', timestamps: true });

  SupplierOffer.OfferType = OfferType;
  SupplierOffer.OfferStatus = OfferStatus;
  return SupplierOffer;
};