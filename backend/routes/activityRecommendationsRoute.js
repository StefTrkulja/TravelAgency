const express = require('express');
const router = express.Router();
const activityRecommendationService = require('../services/activityRecommendationService');

/**
 * GET /api/activities/recommendations/:bookingId/:arrangementId
 * Get recommended activities for a specific booking
 */
router.get('/recommendations/:bookingId/:arrangementId', async (req, res) => {
  try {
    const { bookingId, arrangementId } = req.params;
    
    if (!bookingId || !arrangementId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and Arrangement ID are required'
      });
    }

    const result = await activityRecommendationService.getRecommendedActivities(
      parseInt(bookingId), 
      parseInt(arrangementId)
    );

    if (result.status === 'SUCCESS') {
      res.status(result.code).json({
        success: true,
        data: result.data,
        message: 'Recommendations retrieved successfully'
      });
    } else {
      res.status(result.code).json({
        success: false,
        message: result.error?.message || 'Failed to get recommendations',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in recommendations route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/activities/recommendations/:bookingId/:arrangementId/detailed
 * Get detailed recommended activities with full scoring breakdown
 */
router.get('/recommendations/:bookingId/:arrangementId/detailed', async (req, res) => {
  try {
    const { bookingId, arrangementId } = req.params;
    
    if (!bookingId || !arrangementId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID and Arrangement ID are required'
      });
    }

    const result = await activityRecommendationService.getRecommendedActivities(
      parseInt(bookingId), 
      parseInt(arrangementId)
    );

    if (result.status === 'SUCCESS') {
      // Add additional detailed information for debugging/admin purposes
      const detailedData = result.data.map(activity => ({
        ...activity,
        scoreBreakdown: {
          finalScore: activity.recommendationScore,
          reasons: activity.recommendationReasons,
          timestamp: new Date().toISOString()
        }
      }));

      res.status(result.code).json({
        success: true,
        data: detailedData,
        message: 'Detailed recommendations retrieved successfully'
      });
    } else {
      res.status(result.code).json({
        success: false,
        message: result.error?.message || 'Failed to get recommendations',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in detailed recommendations route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
