const express = require('express');
const cors = require('cors');

const { serverPort } = require('./config');

const app = express();

app.use(express.json());
app.use(cors());

// Routes
// User actions like (login/register/resetPS/changePS)
app.use('/user', require('./routes/v1/user'));
app.use('/patient', require('./routes/v1/patients'));
app.use('/logs', require('./routes/v1/logs'));

// Testing
app.get('/', (req, res) => {
  res.send('ok');
});

app.all('*', (req, res) => res.status(404).send({ msg: 'Page not found' }));

app.listen(serverPort, () => console.log(`Server is running on port ${serverPort}`));
