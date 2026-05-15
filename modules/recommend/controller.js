const User = require("../../models/user");

const service = require("./services");
const logger = require("./utils/logger");

// =========================
// GET SINGLE GAME RECOMMENDATION
// =========================

const getRecommend = async (req, res) => {
  try {
    const { game } = req.query;

    const recommendations = await service.getRecommendations(game);

    return res.json({
      recommendations,
    });
  } catch (err) {
    console.error("ML ERROR:", err.message);

    return res.status(500).json({
      Error: "ML Service error",
    });
  }
};

// =========================
// GET PERSONALIZED RECOMMENDATIONS
// =========================

const getPersonalized = async (req, res) => {
  try {
    const email = req.user.email;

    const user = await User.findOne({ email });

    if (!user || !user.preferences?.length) {
      return res.json({
        preferences: [],
        recommendations: [],
      });
    }

    const recommendations = await service.generatePersonalizedRecommendations(
      user.preferences,
    );

    // save logs
    logger.saveLogs({
      user: req.user.email,
      preferences: user.preferences,
      recommendations: recommendations.slice(0, 20),
    });

    return res.json({
      preferences: user.preferences,
      recommendations,
    });
  } catch (err) {
    console.error("ML ERROR:", err.message);

    return res.status(500).json({
      Error: "ML Service error",
    });
  }
};

// =========================
// SAVE PREFERENCE
// =========================

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

    return res.status(500).json({
      Error: "Server error",
    });
  }
};

// =========================
// REMOVE PREFERENCE
// =========================

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
  getPersonalized,
  savePreference,
  removePreference,
};
