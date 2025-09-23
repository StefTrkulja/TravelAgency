const { Activity, Booking, BookingParticipant, User, TravelArrangement } = require('../models');
const { Result, StatusEnum } = require('../utils/result');

class ActivityRecommendationService {
  /**
   * Get recommended activities for a specific booking
   * @param {number} bookingId - The booking ID to get recommendations for
   * @param {number} arrangementId - The arrangement ID to filter activities
   * @returns {Promise<Result>} - Top 2 recommended activities with scores
   */
  async getRecommendedActivities(bookingId, arrangementId) {
    try {
      // Get booking details with participants
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        return new Result(StatusEnum.FAIL, 404, null, { message: 'Booking not found' });
      }

      const participants = await BookingParticipant.findAll({
        where: { booking_id: bookingId }
      });

      // Get all activities for the arrangement
      const activities = await Activity.findAll({
        where: { 
          arrangement_id: arrangementId,
          status: 'ACTIVE'
        },
        include: [
          { model: User, as: 'user', attributes: ['username', 'name', 'surname'] },
          { model: TravelArrangement, as: 'arrangement' }
        ]
      });

      if (activities.length === 0) {
        return new Result(StatusEnum.SUCCESS, 200, []);
      }

      // Calculate scores for each activity
      const scoredActivities = activities.map(activity => {
        const score = this.calculateActivityScore(activity, booking, participants);
        return {
          ...activity.toJSON(),
          recommendationScore: score,
          recommendationReasons: this.getRecommendationReasons(activity, booking, participants)
        };
      });

      // Sort by score (highest first) and take top 2
      const topRecommendations = scoredActivities
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 2);

      return new Result(StatusEnum.SUCCESS, 200, topRecommendations);
    } catch (error) {
      console.error("Error getting activity recommendations:", error);
      return new Result(StatusEnum.FAIL, 500, null, { message: error.message });
    }
  }

  /**
   * Calculate recommendation score for an activity based on booking and participant data
   * @param {Object} activity - The activity object
   * @param {Object} booking - The booking object
   * @param {Array} participants - Array of booking participants
   * @returns {number} - Calculated score (0-100)
   */
  calculateActivityScore(activity, booking, participants) {
    let score = 50; // Base score
    const reasons = [];

    // 1. Value field weight (most important factor)
    const valueWeight = this.calculateValueWeight(activity.value);
    score += valueWeight;

    // 2. Booking preferences matching
    const bookingPreferenceScore = this.calculateBookingPreferenceScore(activity, booking);
    score += bookingPreferenceScore;

    // 3. Participant demographics and needs
    const participantScore = this.calculateParticipantScore(activity, participants);
    score += participantScore;

    // 4. Age group compatibility
    const ageScore = this.calculateAgeGroupScore(activity, participants);
    score += ageScore;

    // 5. Special considerations (medical conditions, allergies)
    const specialNeedsScore = this.calculateSpecialNeedsScore(activity, participants);
    score += specialNeedsScore;

    // 6. Activity difficulty vs participant capability
    const difficultyScore = this.calculateDifficultyScore(activity, participants);
    score += difficultyScore;

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate weight based on activity value field
   * @param {number} value - Activity value (default 5)
   * @returns {number} - Weight adjustment (-10 to +15)
   */
  calculateValueWeight(value) {
    const baseValue = 5;
    if (value > baseValue) {
      // Positive weight for values above 5 (up to +15 for value 10)
      return Math.min(15, (value - baseValue) * 3);
    } else if (value < baseValue) {
      // Negative weight for values below 5 (up to -10 for value 0)
      return Math.max(-10, (value - baseValue) * 2);
    }
    return 0; // Neutral for value = 5
  }

  /**
   * Calculate score based on booking preferences
   * @param {Object} activity - Activity object
   * @param {Object} booking - Booking object
   * @returns {number} - Score adjustment (-5 to +15)
   */
  calculateBookingPreferenceScore(activity, booking) {
    let score = 0;

    // Pet-friendly matching
    if (booking.isPetFriendly && activity.isPetFriendly) {
      score += 8; // Strong positive for pet-friendly match
    } else if (booking.isPetFriendly && !activity.isPetFriendly) {
      score -= 5; // Penalty for pet owners with non-pet-friendly activity
    }

    // Adventure matching
    if (booking.isAdventurous && activity.isAdventure) {
      score += 6; // Good match for adventure seekers
    } else if (!booking.isAdventurous && activity.isAdventure) {
      score -= 3; // Small penalty for non-adventurous people with adventure activities
    }

    // Business travelers might prefer different activities
    if (booking.isBusiness) {
      if (activity.isOutdoor) {
        score += 2; // Business travelers might enjoy outdoor activities for relaxation
      }
      if (activity.difficulty && activity.difficulty <= 3) {
        score += 3; // Business travelers might prefer easier activities
      }
    }

    return score;
  }

  /**
   * Calculate score based on participant characteristics
   * @param {Object} activity - Activity object
   * @param {Array} participants - Array of participants
   * @returns {number} - Score adjustment (-5 to +10)
   */
  calculateParticipantScore(activity, participants) {
    if (!participants || participants.length === 0) return 0;

    let score = 0;
    const hasChildren = participants.some(p => this.calculateAge(p.dateOfBirth) < 18);
    const hasElderly = participants.some(p => this.calculateAge(p.dateOfBirth) > 65);

    // Family-friendly bonus if there are children
    if (hasChildren && activity.isFamilyFriendly) {
      score += 10;
    } else if (hasChildren && !activity.isFamilyFriendly) {
      score -= 5;
    }

    // Consider elderly participants
    if (hasElderly) {
      if (activity.difficulty && activity.difficulty <= 3) {
        score += 5; // Lower difficulty is better for elderly
      } else if (activity.difficulty && activity.difficulty > 6) {
        score -= 3; // High difficulty activities might not be suitable
      }
    }

    return score;
  }

  /**
   * Calculate age group compatibility score
   * @param {Object} activity - Activity object
   * @param {Array} participants - Array of participants
   * @returns {number} - Score adjustment (-3 to +8)
   */
  calculateAgeGroupScore(activity, participants) {
    if (!participants || participants.length === 0) return 0;

    const ages = participants
      .filter(p => p.dateOfBirth)
      .map(p => this.calculateAge(p.dateOfBirth));

    if (ages.length === 0) return 0;

    const hasKids = ages.some(age => age < 13);
    const hasTeens = ages.some(age => age >= 13 && age < 18);
    const hasAdults = ages.some(age => age >= 18);

    let score = 0;

    switch (activity.targetAgeGroup) {
      case 'ALL':
        score += 5; // Universal activities are generally good
        break;
      case 'KIDS':
        if (hasKids) score += 8;
        else if (hasAdults && !hasKids) score -= 3;
        break;
      case 'TEENS':
        if (hasTeens) score += 8;
        else if (hasKids || (hasAdults && !hasTeens)) score -= 2;
        break;
      case 'ADULTS':
        if (hasAdults) score += 6;
        if (hasKids) score -= 3;
        break;
    }

    return score;
  }

  /**
   * Calculate score based on special needs (medical conditions, allergies)
   * @param {Object} activity - Activity object
   * @param {Array} participants - Array of participants
   * @returns {number} - Score adjustment (-8 to +3)
   */
  calculateSpecialNeedsScore(activity, participants) {
    if (!participants || participants.length === 0) return 0;

    let score = 0;
    const hasAllergies = participants.some(p => p.allergy && p.allergy !== 'NONE');
    const hasMedicalConditions = participants.some(p => p.medicalCondition && p.medicalCondition !== 'NONE');
    const hasAsthma = participants.some(p => p.medicalCondition === 'ASTHMA');
    const hasHeartCondition = participants.some(p => p.medicalCondition === 'HEART');

    // Outdoor activities might be problematic for people with certain conditions
    if (activity.isOutdoor) {
      if (hasAsthma) {
        score -= 4; // Outdoor activities might trigger asthma
      }
      if (hasAllergies) {
        score -= 2; // Outdoor activities might trigger allergies
      }
    } else {
      // Indoor activities might be safer for people with conditions
      if (hasAsthma || hasAllergies) {
        score += 3;
      }
    }

    // High-intensity activities might not be suitable for heart conditions
    if (hasHeartCondition) {
      if (activity.isAdventure || (activity.difficulty && activity.difficulty > 6)) {
        score -= 6;
      } else if (activity.difficulty && activity.difficulty <= 3) {
        score += 2;
      }
    }

    return score;
  }

  /**
   * Calculate difficulty score based on participant capability
   * @param {Object} activity - Activity object
   * @param {Array} participants - Array of participants
   * @returns {number} - Score adjustment (-5 to +5)
   */
  calculateDifficultyScore(activity, participants) {
    if (!activity.difficulty || !participants || participants.length === 0) return 0;

    const ages = participants
      .filter(p => p.dateOfBirth)
      .map(p => this.calculateAge(p.dateOfBirth));

    const avgAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 30;
    const hasElderly = ages.some(age => age > 65);
    const hasYoungChildren = ages.some(age => age < 8);

    let idealDifficulty;

    if (hasYoungChildren || hasElderly) {
      idealDifficulty = 3; // Lower difficulty for vulnerable groups
    } else if (avgAge < 30) {
      idealDifficulty = 6; // Higher difficulty for younger groups
    } else {
      idealDifficulty = 5; // Moderate difficulty for middle-aged groups
    }

    const difficultyDiff = Math.abs(activity.difficulty - idealDifficulty);
    
    if (difficultyDiff === 0) return 5;
    if (difficultyDiff === 1) return 3;
    if (difficultyDiff === 2) return 0;
    if (difficultyDiff >= 3) return -3;
    
    return 0;
  }

  /**
   * Get human-readable reasons for recommendation
   * @param {Object} activity - Activity object
   * @param {Object} booking - Booking object
   * @param {Array} participants - Array of participants
   * @returns {Array} - Array of reason strings
   */
  getRecommendationReasons(activity, booking, participants) {
    const reasons = [];

    // Value-based reasons
    if (activity.value > 5) {
      reasons.push(`Highly rated activity (${activity.value}/10)`);
    }

    // Booking preference reasons
    if (booking.isPetFriendly && activity.isPetFriendly) {
      reasons.push("Pet-friendly as requested");
    }
    if (booking.isAdventurous && activity.isAdventure) {
      reasons.push("Perfect for adventure seekers");
    }

    // Family reasons
    const hasChildren = participants.some(p => this.calculateAge(p.dateOfBirth) < 18);
    if (hasChildren && activity.isFamilyFriendly) {
      reasons.push("Great for families with children");
    }

    // Age group reasons
    if (activity.targetAgeGroup === 'ALL') {
      reasons.push("Suitable for all ages");
    }

    // Difficulty reasons
    if (activity.difficulty <= 3) {
      reasons.push("Easy difficulty level");
    } else if (activity.difficulty >= 7) {
      reasons.push("Challenging experience");
    }

    // Outdoor/Indoor reasons
    if (activity.isOutdoor) {
      reasons.push("Outdoor experience");
    }

    return reasons.slice(0, 3); // Limit to top 3 reasons
  }

  /**
   * Calculate age from date of birth
   * @param {string} dateOfBirth - Date of birth in YYYY-MM-DD format
   * @returns {number} - Age in years
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 30; // Default age if not provided
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

module.exports = new ActivityRecommendationService();
