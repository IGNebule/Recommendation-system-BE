const axios = require("axios");

const getRecommendations = async (gameName) => {
  const response = await axios.post("http://127.0.0.1:8000/recommend", {
    game_name: gameName,
    top_n: 5,
  });

  return response.data.recommendations;
};

const generatePersonalizedRecommendations = async (preferences) => {
  const scoreMap = {};

  for (const prefGame of preferences) {
    const recs = await getRecommendations(prefGame);

    recs.forEach((rec) => {
      const gameName = rec.game;
      const simScore = rec.score;

      // skip existing preferences
      if (preferences.includes(gameName)) {
        return;
      }

      if (!scoreMap[gameName]) {
        scoreMap[gameName] = 0;
      }

      scoreMap[gameName] += simScore;
    });
  }

  const totalPreferences = preferences.length;

  const ranked = Object.entries(scoreMap)
    .map(([game, totalScore]) => ({
      game,
      score: totalScore / totalPreferences,
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => ({
      game: item.game,
      score: Number(item.score.toFixed(4)),
    }));

  return ranked;
};

module.exports = {
  getRecommendations,
  generatePersonalizedRecommendations,
};
