const service = require("./services");

const getCacheStatus = async (req, res) => {
  try {
    return res.json(service.getGameCacheStatus())
  } catch (err) {
    return res.status(500).json({
      error: "Failed to get cache status"
    })
  }
}

const clearCache = async (req, res) => {
  try {
      const result = service.clearGameCache()

      return res.json(result)
  } catch (err) {
    return res.status(500).json({
      error: "failed to clear cache"
    })
  }
}

const getGames = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const minYear = Number(req.query.minYear) || undefined;
    const minReviews = Number(req.query.minReviews) || 0;

    const { genre, tag, category, sort = "trending" } = req.query;

    const games = await service.loadGames({
      page,
      limit,
      minYear,
      genre,
      tag,
      category,
      sort,
      minReviews,
    });

    return res.json(games);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch games",
    });
  }
};

const getGameById = async (req, res) => {
  try {
    const { appid } = req.params;

    const game = await service.getGameById(appid);

    if (!game) {
      return res.status(404).json({
        error: "Game not found",
      });
    }

    return res.json(game);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch data",
    });
  }
};

module.exports = {
  getGames,
  getGameById,
  getCacheStatus,
  clearCache,
};
