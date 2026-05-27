const User = require("../../models/user");
const gameService = require("../games/services");

const getUserPreferences = async (email) => {
  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new Error("User not found!");
  }

  const preferences = (user.preferences || []).map((id) => String(id));
  const { map } = await gameService.parseGames();

  return preferences.map((appid) => map.get(String(appid))).filter(Boolean);
};

const saveUserPreference = async (email, appid) => {
  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new Error("User not found!");
  }

  if (!user.preferences.includes(appid)) {
    user.preferences.push(appid);

    await user.save();
  }

  return user.preferences;
};

const removeUserPreference = async (email, appid) => {
  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new Error("User not found!");
  }

  user.preferences = user.preferences.filter(
    (id) => String(id) !== String(appid),
  );

  await user.save();

  return user.preferences;
};

module.exports = {
  getUserPreferences,
  saveUserPreference,
  removeUserPreference,
};
