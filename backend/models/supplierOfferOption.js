'use strict';
const { Model: Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SupplierOfferOption extends Model {
    static associate(models) {
      SupplierOfferOption.belongsTo(models.SupplierOffer, { foreignKey: 'offerId', as: 'offer' });
    }
  }

  SupplierOfferOption.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    offerId: { type: DataTypes.INTEGER, allowNull: false },

    optionLabel: { type: DataTypes.STRING, allowNull: false }, // npr "Polazak 12.10. – 3 noći"
    dateStart: { type: DataTypes.DATE },
    dateEnd: { type: DataTypes.DATE },
    priceTotal: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 },
    capacity: { type: DataTypes.INTEGER, defaultValue: 0 },

    meta: { type: DataTypes.JSONB } // npr raspored soba, tip busa, tarife aviona, cancellation policy, itd.
  }, { sequelize, modelName: 'SupplierOfferOption', timestamps: true });

  return SupplierOfferOption;
};
