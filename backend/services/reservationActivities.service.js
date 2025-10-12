const { ReservationActivity } = require('../models');

class ReservationActivitiesService {

    async createReservationActivity(reservationActivityData) {
        
        const createdReservationActivity = await ReservationActivity.create(reservationActivityData);
        
        return { success: true, data: createdReservationActivity };
    }
    
}
module.exports = new ReservationActivitiesService();