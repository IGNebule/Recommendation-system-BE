const service = require("./services");

const getGames = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 15

    const games = await service.loadGames({
        page,
        limit,
    });

    res.json(games);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch games",
    });
  }
};

const getGameById = async (req, res) => {
    try {
        const { appid } = req.params

        const game = await service.getGameById(appid)
        
        if (!game) {
            return res.status(404).json({
                error: "Game not found",
            })            
        }

        res.json(game)
    } catch (err) {
        console.error(err)

        res.status(500).json({
            error: "Failed to fetch data"
        })
    }
}

module.exports = { getGames, getGameById };