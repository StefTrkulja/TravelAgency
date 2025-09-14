const {Reservation} = require('../models');
const { StatusEnum, Result} = require('../utils/result');
const { body, param } = require('express-validator');
const jwtParser = require('../utils/jwtParser');
const {parseSequelizeErrors} = require('../utils/errorParser');	
const sequelize = require('../models/index').sequelize;

class ReservationService {

	async findReservationsByUsername(username) {
		const reservations = await Reservation.findAll({
			where: { customerUsername: username }});
		return new Result(StatusEnum.OK, 200, reservations);
	}
	async findReservationById(reservationId) {
		const reservation = await Reservation.findByPk(reservationId);
		if (!reservation) {
			return new Result(StatusEnum.FAIL, 404, null, [{ message: 'Reservation not found' }]);
		}
		return new Result(StatusEnum.OK, 200, reservation);
	}
}
module.exports = new ReservationService();