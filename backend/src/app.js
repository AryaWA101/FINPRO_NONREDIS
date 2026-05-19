const express = require('express')
const cors = require('cors')
require('dotenv').config()

const apiRoutes = require('./routes/api')

const app = express()

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.FRONTEND_URL || ''
  ],
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api', apiRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'TicketWar API is running!' })
})

module.exports = app