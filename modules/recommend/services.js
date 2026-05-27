const axios = require("axios");
const User = require("../../models/user");
const { parseGames } = require("../games/services");
const { toGameCard } = require("../games/serializers");

const enrichGames = async (recommendations) => {
  const { map } = await parseGames();

  return recommendations
    .map((rec) => {
      const game = map.get(String(rec.appid));

      if (!game) return null;

      return toGameCard(game, {
        similarity_score: Number(rec.score.toFixed(4)),
      });
    })
    .filter(Boolean);
};

const requestRecommendations = async (appid, top_n = 10) => {
  const res = await axios.post(process.env.ML_SERVICE_URL, {
    appid: String(appid),
    top_n,
  });

  return res.data.recommendations || [];
};

const getRecommendations = async (appid) => {
  const recommendations = await requestRecommendations(appid, 10);

  return enrichGames(recommendations);
};

const generatePersonalizedRecommendations = async (email) => {
  const user = await User.findOne({
    email,
  });

  if (!user || !user.preferences?.length) {
    return [];
  }

  const scoreMap = {};

  for (const appid of user.preferences) {
    const recs = await requestRecommendations(appid, 5);

    recs.forEach((rec) => {
      const recAppid = String(rec.appid);

      if (user.preferences.includes(recAppid)) {
        return;
      }

      if (!scoreMap[recAppid]) {
        scoreMap[recAppid] = 0;
      }

      scoreMap[recAppid] += Number(rec.score) || 0;
    });
  }

  const ranked = Object.entries(scoreMap)
    .map(([appid, totalScore]) => ({
      appid,
      score: totalScore / user.preferences.length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return enrichGames(ranked);
};

module.exports = {
  getRecommendations,
  generatePersonalizedRecommendations,
};
