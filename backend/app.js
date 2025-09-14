const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRoute = require('./routes/userRoute');
const reservationRoute = require('./routes/reservationRoute');
const complaintRoute = require('./routes/complaintRoute');
const statusRoute = require('./routes/statusRoute');
const escalationRoute = require('./routes/escalationRoute');
const compensationRoute = require('./routes/compensationRoute');	
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
app.use('/api/reservation', reservationRoute);
app.use('/api/complaint', complaintRoute);	
app.use('/api/status', statusRoute);
app.use('/api/escalation', escalationRoute);
app.use('/api/compensation', compensationRoute);
// app.use('/api/post', postRoute);
// app.use('/api/location', locationRoute);
// app.use('/api/image', imageRoute);
// app.use('/api/stats', statsRoute);
// app.use('/api/group', groupRoute);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



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
