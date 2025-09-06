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
const sequelize = require('./models/index').sequelize;
const { register } = require('./utils/metrics');
const path = require('path');

// require('./services/scheduler');
// require('./services/messageService');

const activityRoute = require('./routes/activityRoute');
const scheduleRoute = require('./routes/activityScheduleRoute');
const bookingRoute = require('./routes/activityBookingRoute');
const participantRoute = require('./routes/activityParticipantRoute');
const reviewRoute = require('./routes/activityReviewRoute');
const analyticsRoute = require('./routes/activityAnalyticsRoute');




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


app.use('/api/activities', activityRoute);
app.use('/api/activities/schedules', scheduleRoute);
app.use('/api/activities/bookings', bookingRoute);
app.use('/api/activities/participants', participantRoute);
app.use('/api/activities/reviews', reviewRoute);
app.use('/api/activities/analytics', analyticsRoute);
app.use('/api/user', userRoute);
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
