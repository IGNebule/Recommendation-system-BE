const service = require("./services");

const getTrendingGames = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;

    const result = await service.getTrendingGames({
      page,
      limit,
    });

    return res.json({
      type: "trending",
      sortBy: "trending_score",
      ...result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch trending games",
    });
  }
};

const getTopRatedGames = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const minReviews = Number(req.query.minReviews) || 100;

    const result = await service.getTopRatedGames({
      page,
      limit,
      minReviews,
    });

    return res.json({
      type: "top-rated",
      sortBy: "rating_percent",
      minReviews,
      ...result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch top-rated games",
    });
  }
};

const getMostPlayedGames = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;

    const result = await service.getMostPlayedGames({
      page,
      limit,
    });

    return res.json({
        type: "most-played",
        sortBy: "average_playtime",
        ...result,
    })
  } catch (err) {
    console.error(err)

    return res.status(500).json({
        error: "Failed to fetch most-played games",
    })
  }
};

module.exports = {
    getTrendingGames,
    getTopRatedGames,
    getMostPlayedGames
}