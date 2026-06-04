const service = require("./services");

const getMyProfile = async (req, res) => {
  try {
    const profile = await service.getMyProfile(req.user.email);

    if (!profile) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json({
      profile,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to fetch profile",
    });
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { name = "", username = "", bio = "" } = req.body;

    const profile = await service.updateMyProfile({
      email: req.user.email,
      name,
      username,
      bio,
    });

    return res.json({
      message: "Profile updated",
      profile,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Avatar image is required",
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const profile = await service.updateAvatar({
      email: req.user.email,
      avatarUrl,
    });

    return res.json({
      message: "Avatar updated",
      profile,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: err.message || "Failed to update avatar",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  updateAvatar,
};
