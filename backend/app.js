const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoute = require('./routes/userRoute');
// // const postRoute = require('./routes/postRoute');
// // const locationRoute = require('./routes/locationRoute');
// // const imageRoute = require('./routes/imageRoute');
// // const statsRoute = require('./routes/statsRoute');
// // const groupRoute = require('./routes/groupRoute');
// // const groupMessageRoute = require('./routes/groupMessageRoute');

const countryRoute = require('./routes/country.routes');
const destinationRoute = require('./routes/destinations.routes');
const arrangementAnjaRoute = require('./routes/arrangementsAnja.routes');
const reservationRoute = require('./routes/reservation.route');
const voucherRoute = require('./routes/vouchers.routes');
const reviewRoute = require('./routes/reviews.routes');
const sequelize = require('./models/index').sequelize;
const { register } = require('./utils/metrics');
const path = require('path');



// require('./services/scheduler');
// require('./services/messageService');




const app = express();

app.use(cors({
	origin: process.env.CLIENT_URL,
	credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.get('/test', (req, res) => {
	res.send('Hello World!');
});

app.use('/api/user', userRoute);
app.use('/api/arrangements', require('./routes/arrangements.routes'));
app.use('/api/offers', require('./routes/offers.routes'));
app.use('/api/approvals', require('./routes/approvals.routes'));
app.use('/api/departures', require('./routes/departures.routes'));
app.use('/api/itineraries', require('./routes/itineraries.routes'));
app.use('/api/activities', require('./routes/activities.routes'));
app.use('/api/destinations', destinationRoute);
app.use('/api/reservations', reservationRoute);
app.use('/api/countries', countryRoute);
app.use('/api/anjaArrangements', arrangementAnjaRoute);
app.use('/api/vouchers',voucherRoute);
app.use('/api/reviews',reviewRoute);
//app.use('/api/arrangement', require('./routes/arrangements.routes'));
// app.use('/api/post', postRoute);
// app.use('/api/location', locationRoute);
// app.use('/api/image', imageRoute);
// app.use('/api/stats', statsRoute);
// app.use('/api/group', groupRoute);

sequelize.authenticate().then(() => {
	console.log(`Connection to the ${process.env.DB_NAME} database has been established successfully!`);
	app.listen(process.env.PORT, () => {
		console.log(`Server is running on port ${process.env.PORT}`);
	});
}).catch(err => {
	console.error('Unable to connect to the database!', err);
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
