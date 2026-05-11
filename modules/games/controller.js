const service = require("./services")

const getGames = async (req, res) => {
    try {
        const games = await service.getGames()

        res.json(games)
    } catch (err) {
        console.error(err)

        res.status(500).json({
            error: "Failed to fetch games"
        })
    }
}

module.exports = { getGames, }