const service = require("./services");
const logger = require("./utils/logger");

const getRecommend = async (req, res) => {
  try {
    const { appid } = req.params;

    if (!appid) {
      return res.status(400).json({
        error: "appid is required",
      });
    }

    const recommendations = await service.getRecommendations(appid);

    return res.json({
      recommendations,
    });
  } catch (err) {
    console.error("ML ERROR:", err.message);

    return res.status(500).json({
      error: "Failed to fetch recommendations",
    });
  }
};

const getPersonalized = async (req, res) => {
  try {
    const email = req.user.email;

    const recommendations =
      await service.generatePersonalizedRecommendations(email);

    logger.saveLogs({
      user: email,
      recommendations: recommendations.slice(0, 20),
    });

    return res.json({
      recommendations,
    });
  } catch (err) {
    console.error("ML ERROR:", err.message);

    return res.status(500).json({
      error: "Failed to fetch personalized recommendations",
    });
  }
};

module.exports = {
  getRecommend,
  getPersonalized,
};
