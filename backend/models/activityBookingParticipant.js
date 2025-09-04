'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Enum placeholders
  const ALLERGY = ['NONE', 'NUTS', 'GLUTEN', 'DAIRY', 'OTHER'];
  const MEDICAL_CONDITION = ['NONE', 'ASTHMA', 'DIABETES', 'HEART', 'OTHER'];

  class ActivityBookingParticipant extends Model {
    static associate(models) {
      ActivityBookingParticipant.belongsTo(models.ActivityBooking, { foreignKey: 'activity_booking_id', as: 'activityBooking' });
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

  ActivityBookingParticipant.init({
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    specialRequirements: { type: DataTypes.STRING, allowNull: true },
    allergy: { type: DataTypes.ENUM(...ALLERGY), allowNull: true },
    medicalCondition: { type: DataTypes.ENUM(...MEDICAL_CONDITION), allowNull: true },
    preferences: { type: DataTypes.STRING, allowNull: true },
  }, {
    sequelize,
    modelName: 'ActivityBookingParticipant',
    tableName: 'activity_booking_participants',
    timestamps: false, 
  });

  return ActivityBookingParticipant;
};
