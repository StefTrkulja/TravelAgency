'use strict';
const { Model } = require('sequelize');

const InquiryStatus = { OPEN: 'OPEN', CLOSED: 'CLOSED', CANCELLED: 'CANCELLED' };

module.exports = (sequelize, DataTypes) => {
  class OfferInquiry extends Model {
    static associate(models) {
      OfferInquiry.belongsTo(models.Destination, { foreignKey: 'destinationId', as: 'destination' });
      OfferInquiry.belongsTo(models.User, { foreignKey: 'requestedByUsername', targetKey: 'username', as: 'requestedBy' });
      OfferInquiry.hasMany(models.OfferInquiryRecipient, { foreignKey: 'inquiryId', as: 'recipients' });
      OfferInquiry.hasMany(models.SupplierOffer, { foreignKey: 'inquiryId', as: 'offers' }); // ponude na osnovu ovog upita
    }
  }

  OfferInquiry.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    destinationId: { type: DataTypes.INTEGER, allowNull: false },
    requestedByUsername: { type: DataTypes.STRING, allowNull: false },
    dateFrom: { type: DataTypes.DATEONLY, allowNull: false },
    dateTo: { type: DataTypes.DATEONLY, allowNull: false },
    notes: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM(...Object.values(InquiryStatus)), allowNull: false, defaultValue: 'OPEN' }
  }, { sequelize, modelName: 'OfferInquiry', timestamps: true });

  OfferInquiry.InquiryStatus = InquiryStatus;
  return OfferInquiry;
};
