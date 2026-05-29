const service = require("./services");

const getTags = async (req, res) => {
  try {
    const tags = await service.getTags();

    return res.json({
      total: tags.length,
      tags,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch tags",
    });
  }
};

const getGamesByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;

    if (!tag) {
      return res.status(400).json({
        error: "tag param is required!",
      });
    }

    const result = await service.getGamesByTag({
      tag,
      page,
      limit,
    });

    return res.json({
      tag,
      ...result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch games by tag",
    });
  }
};

module.exports = {
  getTags,
  getGamesByTag,
};
