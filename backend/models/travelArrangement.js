'use strict';
// @ts-ignore
const { Model } = require('sequelize');

const ArrangementType = { DAY_TRIP: 'DAY_TRIP', MULTI_DAY: 'MULTI_DAY' };
const ArrangementStatus = { DRAFT: 'DRAFT', PENDING: 'PENDING', ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' };
const TransportType = { BUS: 'BUS', PLANE: 'PLANE', OWN: 'OWN' };
const AccommodationType = { HOTEL: 'HOTEL', APT: 'APT', HOSTEL: 'HOSTEL', OTHER: 'OTHER' };

module.exports = (sequelize, DataTypes) => {
  class TravelArrangement extends Model {
    static associate(models) {
      TravelArrangement.belongsTo(models.Destination, { foreignKey: 'destinationId', as: 'destination' });
      TravelArrangement.belongsTo(models.User, { foreignKey: 'createdByUsername', targetKey: 'username', as: 'creator' });
      TravelArrangement.hasMany(models.ArrangementVersion, { foreignKey: 'arrangementId', as: 'versions' });
      TravelArrangement.hasMany(models.Departure, { foreignKey: 'arrangementId', as: 'departures' });
      TravelArrangement.hasMany(models.SupplierOffer, { foreignKey: 'arrangementId', as: 'offers' });
      TravelArrangement.hasOne(models.OfferSelection, { foreignKey: 'arrangementId', as: 'selection' });
      TravelArrangement.hasMany(models.ApprovalRequest, { foreignKey: 'arrangementId', as: 'approvals' });
    }
  }

  TravelArrangement.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    destinationId: { type: DataTypes.INTEGER, allowNull: false },
    createdByUsername: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    summary: { type: DataTypes.TEXT },
    basePricePerPerson: { type: DataTypes.DECIMAL, allowNull: false }, // po želji: DECIMAL(10,2)
    transportType: { type: DataTypes.ENUM(...Object.values(TransportType)), allowNull: false },
    accommodationType: { type: DataTypes.ENUM(...Object.values(AccommodationType)), allowNull: false },
    type: { type: DataTypes.ENUM(...Object.values(ArrangementType)), allowNull: false },
    status: { type: DataTypes.ENUM(...Object.values(ArrangementStatus)), allowNull: false, defaultValue: 'DRAFT' }
  }, { 
    sequelize, 
    modelName: 'TravelArrangement',
    timestamps: true   
  });

  TravelArrangement.ArrangementType = ArrangementType;
  TravelArrangement.ArrangementStatus = ArrangementStatus;
  TravelArrangement.TransportType = TransportType;
  TravelArrangement.AccommodationType = AccommodationType;

  return TravelArrangement;
};
