const { hashPassword } = require('../../utils/passwordHasher')

'use strict';

module.exports = {
	up: async (queryInterface, Sequelize) => {
		return queryInterface.bulkInsert('Users', [
			{
				name: 'Stefan',
				surname: 'T',
				username: 'stefan123',
				password: hashPassword('stefan123'),
				email: 'stefan@gmail.com',
				address: JSON.stringify({
					latitude: 45.25,
					longitude: 19.84
				}),
				role: 'user',
			},
			{
				name: 'Jovan',
				surname: 'T',
				username: 'jovan123',
				password: hashPassword('jovan123'),
				email: 'jovan@gmail.com',
				address: JSON.stringify({
					latitude: 45.23,
					longitude: 19.82
				}),
				role: 'user',
			},
			{
				name: 'Ana',
				surname: 'M',
				username: 'ana123',
				password: hashPassword('ana123'),
				email: 'ana@gmail.com',
				address: JSON.stringify({
					latitude: 44.82,
					longitude: 20.45
				}),
				role: 'operator',
			},
			{
				name: 'Boris',
				surname: 'G',
				username: 'boris123',
				password: hashPassword('boris123'),
				email: 'boris@gmail.com',
				address: JSON.stringify({
					latitude: 44.81,
					longitude: 20.48
				}),
				role: 'admin',
			},
			{
				name: 'Anja',
				surname: 'V',
				username: 'anja123',
				password: hashPassword('anja123'),
				email: 'anja@gmail.com',
				address: JSON.stringify({
					latitude: 45.26,
					longitude: 19.85
				}),
				role: 'manager',
			},
		], {});
	},

	down: async (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('Users', null, {});
	}
};
