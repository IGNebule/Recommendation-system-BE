const service = require("./services");

const getGenres = async (req, res) => {
  try {
    const genres = await service.getGenres();

    return res.json({
      total: genres.length,
      genres,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch genres",
    });
  }
};

const getGamesByGenre = async (req, res) => {
  try {
    const { genre } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;

    const result = await service.getGamesByGenre({
      genre,
      page,
      limit,
    });

    return res.json({
      genre,
      ...result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch games by genre topic",
    });
  }
};

module.exports = {
  getGenres,
  getGamesByGenre,
};
