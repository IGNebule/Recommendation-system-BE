const fs = require("fs");
const path = require("path");

const service = require("./services");
const User = require("../../models/user");

const getRecommend = async (req, res) => {
  try {
    const { game } = req.query;

    const recs = await service.getRecommendations(game);

    res.json({ recommendations: recs });
  } catch (err) {
    console.error("ML Error: ", err.message);
    return res.status(500).json({ error: err.message });
  }
};

const savePreference = async (req, res) => {
  try {
    const { game } = req.body;
    const email = req.user.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        Error: "User not found",
      });
    }

    if (!game) {
      return res.status(400).json({
        Error: "Game is required",
      });
    }

    if (!user.preferences) {
      user.preferences = [];
    }

    if (!user.preferences.includes(game)) {
      user.preferences.push(game);
      await user.save();
    }

    return res.json({
      Message: "Preference saved",
      preferences: user.preferences,
    });
  } catch (err) {
    console.error(err.message);
  }
};

const getPersonalized = async (req, res) => {
  const email = req.user.email;
  const user = await User.findOne({ email });

  if (!user || !user.preferences || user.preferences.length === 0) {
    return res.json({
      preferences: [],
      recommendations: [],
    });
  }

  try {
    const scoreMap = {};
    const countMap = {};

    for (let prefGame of user.preferences) {
      const recs = await service.getRecommendations(prefGame);

      recs.forEach((rec) => {
        const gameName = rec.game;
        const simScore = rec.score;

        // 🚫 skip already liked games
        if (user.preferences.includes(gameName)) {
          return;
        }

        // initialize
        if (!scoreMap[gameName]) {
          scoreMap[gameName] = 0;
          countMap[gameName] = 0;
        }

        // accumulate similarity
        scoreMap[gameName] += simScore;
        countMap[gameName] += 1;
      });
    }

    const totalPreferences = user.preferences.length;

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

    const logData = ranked.slice(0, 20).map((item) => ({
      game: item.game,
      score: item.score,
    }));

    fs.writeFileSync(
      path.join(__dirname, "../../../preprocessing/evaluation/logs.json"),
      JSON.stringify(
        {
          user: req.user.email,
          preferences: user.preferences,
          recommendations: logData,
        },
        null,
        2,
      ),
    );

    return res.json({
      preferences: user.preferences,
      recommendations: logData,
    });
  } catch (err) {
    console.error("ML ERROR: ", err.message);
    return res.status(500).json({ Error: "ML Service error" });
  }
};

const removePreference = async (req, res) => {
  try {
    const { game } = req.body;

    const email = req.user.email;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        Error: "User not found",
      });
    }

    if (!game) {
      return res.status(400).json({
        Error: "Game is required",
      });
    }

    // remove selected game
    user.preferences = user.preferences.filter((g) => g !== game);

    await user.save();

    return res.json({
      Message: "Preference removed",
      preferences: user.preferences,
    });
  } catch (err) {
    console.error(err.message);

    return res.status(500).json({
      Error: "Server error",
    });
  }
};

module.exports = {
  getRecommend,
  savePreference,
  getPersonalized,
  removePreference,
};
