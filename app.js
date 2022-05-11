const express = require('express')
const cors = require('cors')

const { serverPort } = require('./config')

const app = express()

app.use(express.json())
app.use(cors())

// Routes

// Authentication for doctor(login/register) route!!!
app.use('/', require('./routes/v1/authentication'))
app.use('/', require('./routes/v1/forgot_changePassword'))

// info for doctor dashboard route (all patients and their info)

app.get('/', (req, res) => {
  res.send('ok')
})

app.listen(serverPort, () =>
  console.log(`Server is running on port ${serverPort}`)
)
