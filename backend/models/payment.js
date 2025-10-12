'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      // Svaka uplata pripada jednoj rezervaciji
      Payment.belongsTo(models.Reservation, {
        foreignKey: 'reservationId',
        as: 'reservation',
        onDelete: 'CASCADE',
      });
    }
  }

  Payment.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      reservationId: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      stripePaymentIntentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      stripeChargeId: {
        type: DataTypes.STRING,
        allowNull: true, // puni se ako koristiš charges API
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'eur',
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true, // npr. 'card', 'sepa_debit'
      },
      receiptUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      timestamps: true,
    }
  );

  return Payment;
};