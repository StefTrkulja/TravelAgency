'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    static associate(models) {

      // Veza: jedna rezervacija pripada jednom korisniku (customer)
      Reservation.belongsTo(models.User, { 
        foreignKey: 'customerUsername',
        targetKey: 'username',   // jer je username primarni ključ u User
        as: 'customer'
      });

      // Veza: rezervacija ima više žalbi
      Reservation.hasMany(models.Complaint, { 
        foreignKey: 'reservationId', 
        as: 'complaints' 
      });

    }
  }

  Reservation.init({

    id: { 
      type: DataTypes.BIGINT, 
      autoIncrement: true, 
      primaryKey: true 
    },
    code: { 
      type: DataTypes.STRING(64), 
      allowNull: false, 
      unique: true 
    },
    startsAt: { type: DataTypes.DATE },
    endsAt: { type: DataTypes.DATE },
    customerUsername: { 
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Users',     // ime tabele (ne modela!)
        key: 'username'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },

  }, {
    sequelize,
    modelName: 'Reservation',
    tableName: 'reservations',
    timestamps: true,
  });

  return Reservation;
};
