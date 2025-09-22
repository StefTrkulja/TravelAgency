'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Voucher extends Model {
    static associate(models) {
      Voucher.belongsTo(models.User, {
        foreignKey: 'userUsername',
        as: 'user'
      });
      Voucher.belongsTo(models.Reservation, {
        foreignKey: 'reservationId',
        as: 'reservation'
      });
    }
  }

  Voucher.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    discountType: { type: DataTypes.ENUM('PERCENT', 'AMOUNT'), allowNull: false, defaultValue: 'PERCENT' },
    discountValue: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    validFrom: { type: DataTypes.DATEONLY, allowNull: true },
    validTo: { type: DataTypes.DATEONLY, allowNull: true },
    isUsed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    userUsername: { type: DataTypes.STRING, allowNull: true },
    reservationId: { type: DataTypes.BIGINT, allowNull: true },
  }, {
    sequelize,
    modelName: 'Voucher',
    tableName: 'vouchers',
    timestamps: true,
  });

  return Voucher;
};
