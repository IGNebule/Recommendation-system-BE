const service = require("./services");

const searchGames = async (req, res) => {
  try {
    const { q } = req.query;
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 15

    if (!q) {
      return res.status(400).json({
        error: "Search query is required!",
      });
    }

    const results = await service.searchGames({
      query: req.query.q,
      page,
      limit,
    });

    return res.json({
      query: q,
      total: results.length,
      results,
    });
  } catch (err) {
    console.error(err)

    return res.status(500).json({
        error: "Search failed"
    })
  }
};

module.exports = {
    searchGames
}