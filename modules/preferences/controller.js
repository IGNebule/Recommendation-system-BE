const service = require("./services");

const getPreferences = async (req, res) => {
  try {
    const result = await service.getLibrary(req.user.email);

    return res.json(result);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch library",
    });
  }
};

const addPreference = async (req, res) => {
  try {
    const { appid } = req.params;

    const result = await service.addPreference({
      email: req.user.email,
      appid,
    });

    return res.json({
      message: "Game added to library",
      ...result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to add preference",
    });
  }
};

const updatePreferenceWeight = async (req, res) => {
  try {
    const { appid } = req.params;
    const { weight } = req.body;

    const result = await service.updatePreferenceWeight({
      email: req.user.email,
      appid,
      weight,
    });

    return res.json({
      message: "Preference weight updated",
      ...result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to update preference weight",
    });
  }
};

const removePreference = async (req, res) => {
  try {
    const { appid } = req.params;

    const result = await service.removePreference({
      email: req.user.email,
      appid,
    });

    return res.json({
      message: "Game removed from library",
      ...result,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to remove preference",
    });
  }
};

module.exports = {
  getPreferences,
  addPreference,
  updatePreferenceWeight,
  removePreference,
};
