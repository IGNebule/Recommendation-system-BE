const service = require("./services");

const getTopics = async (req, res) => {
  try {
    const topics = await service.getTopics();

    return res.json({
      total: topics.length,
      topics,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch genre topics",
    });
  }
};

const getGamesByTopic = async (req, res) => {
  try {
    const { genre } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;

    const result = await service.getGamesByTopic({
      topic: genre,
      page,
      limit,
    });

    return res.json({
      topic: genre,
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
  getTopics,
  getGamesByTopic,
};
