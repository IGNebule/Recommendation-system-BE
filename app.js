require('dotenv').config()

const express = require('express')
const cors = require('cors')

const authRoutes = require('./modules/auth/routes')
const recRoutes = require('./modules/recommend/routes')
const gameRoutes = require("./modules/games/routes");
const authMiddleware = require('./middleware/auth')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use("/api/games", gameRoutes);
app.use('/api/recommend', authMiddleware, recRoutes)

app.get('/', (req, res) => {
    res.send('BACKEND RUNNING!')
})

module.exports = app