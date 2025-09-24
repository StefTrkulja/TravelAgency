'use strict';
const { Model } = require('sequelize');

const RecipientStatus = { SENT: 'SENT', VIEWED: 'VIEWED', RESPONDED: 'RESPONDED', DECLINED: 'DECLINED' };

module.exports = (sequelize, DataTypes) => {
  class OfferInquiryRecipient extends Model {
    static associate(models) {
      OfferInquiryRecipient.belongsTo(models.OfferInquiry, { foreignKey: 'inquiryId', as: 'inquiry' });
      OfferInquiryRecipient.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
    }
  }

  OfferInquiryRecipient.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    inquiryId: { type: DataTypes.INTEGER, allowNull: false },
    supplierId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM(...Object.values(RecipientStatus)), allowNull: false, defaultValue: 'SENT' },
    deliveredAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    respondedAt: { type: DataTypes.DATE },
    meta: { type: DataTypes.JSONB }
  }, { sequelize, modelName: 'OfferInquiryRecipient', timestamps: true });

  OfferInquiryRecipient.RecipientStatus = RecipientStatus;
  return OfferInquiryRecipient;
};
