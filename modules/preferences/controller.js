const service = require("./services");

const getPreferences = async (req, res) => {
  try {
    const email = req.user.email;
    const preferences = await service.getUserPreferences(email);

    return res.json({
      preferences,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch preferences",
    });
  }
};

const savePreference = async (req, res) => {
  try {
    const { appid } = req.params;
    const email = req.user.email;
    const preferences = await service.saveUserPreference(email, appid);

    return res.json({
      message: "preference saved",
      preferences,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to save preference",
    });
  }
};

const removePreference = async (req, res) => {
  try {
    const { appid } = req.params;
    const email = req.user.email
    const preferences = await service.removeUserPreference(email, appid)

    return res.json({
        message: "Preference removed",
        preferences,
    })
  } catch (err) {
    console.error(err)

    return res.status(500).json({
        error: "Failed to remove preference"
    })
  }
};

module.exports = {
    getPreferences,
    savePreference,
    removePreference
}