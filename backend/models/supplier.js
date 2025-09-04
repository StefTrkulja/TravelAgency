'use strict';
const { Model: SequelizeModel } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Supplier extends SequelizeModel {
    static associate(models) {
      Supplier.belongsTo(models.User, {
        foreignKey: 'accountUsername',
        targetKey: 'username',
        as: 'account'
      });
      Supplier.hasMany(models.SupplierOffer, { foreignKey: 'supplierId', as: 'offers' });
    }
  }

  Supplier.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    accountUsername: { type: DataTypes.STRING, allowNull: false }, // 1:1 ka User.username
    companyName: { type: DataTypes.STRING, allowNull: false },
    capabilities: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] }
  }, { sequelize, modelName: 'Supplier', timestamps: true });

  return Supplier;
};
