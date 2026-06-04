const User = require("../../models/user");

const sanitizeUser = (user) => {
  if (!user) return null;

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    preferences: user.preferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const getMyProfile = async (email) => {
  const user = await User.findOne({ email });

  return sanitizeUser(user);
};

const updateMyProfile = async ({ email, name, username, bio }) => {
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        username,
        bio,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  return sanitizeUser(user);
};

const updateAvatar = async ({ email, avatarUrl }) => {
  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        avatarUrl,
      },
    },
    {
      new: true,
    },
  );

  return sanitizeUser(user);
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  updateAvatar,
};
