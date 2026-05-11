const axios = require("axios");

const getRecommendations = async (gameName) => {
  const response = await axios.post("http://127.0.0.1:8000/recommend", {
    game_name: gameName,
    top_n: 5,
  });

  return response.data.recommendations;
};

module.exports = {
  getRecommendations
}