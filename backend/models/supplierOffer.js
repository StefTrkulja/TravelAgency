'use strict';
const { Model: Model } = require('sequelize');

const OfferType = { HOTEL:'HOTEL', AIRLINE:'AIRLINE', BUS:'BUS', GUIDE:'GUIDE', TOUR:'TOUR', OTHER:'OTHER' };
const OfferStatus = { SENT:'SENT', RECEIVED:'RECEIVED', ACCEPTED:'ACCEPTED', REJECTED:'REJECTED' };
const BoardType = { RO:'RO', BB:'BB', HB:'HB', FB:'FB', AI:'AI' }; // room only, bed&breakfast, half/full board, all inclusive
const TransportMode = { BUS:'BUS', PLANE:'PLANE' };

module.exports = (sequelize, DataTypes) => {
  class SupplierOffer extends Model {
    static associate(models) {
      SupplierOffer.belongsTo(models.TravelArrangement, { foreignKey: 'arrangementId', as: 'arrangement' });
      SupplierOffer.belongsTo(models.Supplier, { foreignKey: 'supplierId', as: 'supplier' });
      SupplierOffer.belongsTo(models.User, { foreignKey: 'decisionByUsername', targetKey: 'username', as: 'decisionBy' });
      SupplierOffer.hasOne(models.OfferSelection, { foreignKey: 'offerId', as: 'selection' });
      SupplierOffer.hasMany(models.SupplierOfferOption, { foreignKey: 'offerId', as: 'options' });
      SupplierOffer.hasMany(models.SupplierOfferItineraryItem, { foreignKey: 'offerId', as: 'itineraryItems' });
      SupplierOffer.belongsTo(models.OfferInquiry, { foreignKey: 'inquiryId', as: 'inquiry' });

    }
  }

  SupplierOffer.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    arrangementId: { type: DataTypes.INTEGER, allowNull: true },
    supplierId: { type: DataTypes.INTEGER, allowNull: false },
    inquiryId: { type: DataTypes.INTEGER },

    // Osnovno
    offerType: { type: DataTypes.ENUM(...Object.values(OfferType)), allowNull: false },
    title: { type: DataTypes.STRING },      // npr "Hotel Ibis – 3 noći BB" ili "Prevoz busom, 50 mesta"
    terms: { type: DataTypes.TEXT },        // slobodni uslovi
    currency: { type: DataTypes.STRING, defaultValue: 'EUR' },
    priceTotal: { type: DataTypes.DECIMAL, allowNull: false, defaultValue: 0 }, // suma ili referentna cena
    capacityTotal: { type: DataTypes.INTEGER, defaultValue: 0 },

    availabilityStart: { type: DataTypes.DATE }, // period važenja ponude
    availabilityEnd: { type: DataTypes.DATE },

    // Polja za HOTEL/SMEŠTAJ
    hotelName: { type: DataTypes.STRING },
    hotelStars: { type: DataTypes.INTEGER },
    board: { type: DataTypes.ENUM(...Object.values(BoardType)) }, // BB/HB/...

    // Polja za PREVOZ (BUS/PLANE)
    transportCompany: { type: DataTypes.STRING },
    transportMode: { type: DataTypes.ENUM(...Object.values(TransportMode)) },
    fromLocation: { type: DataTypes.STRING },
    toLocation: { type: DataTypes.STRING },

    // Polja za GUIDE / jednodnevni izlet
    guideName: { type: DataTypes.STRING },
    guideLanguage: { type: DataTypes.STRING },
    durationHours: { type: DataTypes.INTEGER },

    // Meta kao JSONB – za bilo šta dodatno (dozvole, linkovi, pravila otkaza...)
    meta: { type: DataTypes.JSONB },

    // Status lifecycle
    requestSentAt: { type: DataTypes.DATE },
    receivedAt: { type: DataTypes.DATE },
    status: { type: DataTypes.ENUM(...Object.values(OfferStatus)), allowNull: false, defaultValue: 'SENT' },
    decisionByUsername: { type: DataTypes.STRING },
    decisionAt: { type: DataTypes.DATE }
  }, { sequelize, modelName: 'SupplierOffer', timestamps: true });

  SupplierOffer.OfferType = OfferType;
  SupplierOffer.OfferStatus = OfferStatus;
  SupplierOffer.BoardType = BoardType;
  SupplierOffer.TransportMode = TransportMode;
  return SupplierOffer;
};
