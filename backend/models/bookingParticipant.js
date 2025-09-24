'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Enum placeholders
  const ALLERGY = ['NONE', 'NUTS', 'GLUTEN', 'DAIRY', 'OTHER'];
  const MEDICAL_CONDITION = ['NONE', 'ASTHMA', 'DIABETES', 'HEART', 'OTHER'];

  class BookingParticipant extends Model {
    static associate(models) {
      BookingParticipant.belongsTo(models.Booking, { foreignKey: 'booking_id', as: 'booking' });
    }

    get isChild() {
      if (!this.dateOfBirth) return false;
      const now = new Date();
      const dob = new Date(this.dateOfBirth);
      const age = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
        return age - 1 < 18;
      }
      return age < 18;
    }
  }

  BookingParticipant.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    firstName: { type: DataTypes.STRING, allowNull: false, field: 'firstname' },
    lastName: { type: DataTypes.STRING, allowNull: false, field: 'lastname' },
    email: { type: DataTypes.STRING, allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true, field: 'dateofbirth' },
    specialRequirements: { type: DataTypes.STRING, allowNull: true, field: 'specialrequirements' },
    allergy: { type: DataTypes.ENUM(...ALLERGY), allowNull: true },
    medicalCondition: { type: DataTypes.ENUM(...MEDICAL_CONDITION), allowNull: true, field: 'medicalcondition' },
    preferences: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'BookingParticipant',
    tableName: 'booking_participants',
    timestamps: false, 
  });

  return BookingParticipant;
};
