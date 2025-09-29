'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CustomerSatisfaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CustomerSatisfaction.belongsTo(models.Complaint, {
        foreignKey: 'complaintId',
        as: 'complaint'
      });
      
      CustomerSatisfaction.belongsTo(models.User, {
        foreignKey: 'customerUsername',
        as: 'customer'
      });
    }
  }
  CustomerSatisfaction.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    complaintId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      field: 'complaint_id',
    },
    customerUsername: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'customer_username',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
        isInt: true
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    timestamps: false,
    modelName: 'CustomerSatisfaction',
    tableName: 'customer_satisfaction',
  });
  return CustomerSatisfaction;
};