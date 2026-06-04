require("dotenv").config()

const app = require('./app')
const connectDB = require('./config/db')
const gameService = require("./modules/games/services")

connectDB()

const PORT = process.env.PORT || 3000

const startServer = async () => {
    try {
        await gameService.warmGameCache()

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })
    } catch (err) {
        console.error("Failed to warm game cache: ", err)

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })
    }
}

startServer()