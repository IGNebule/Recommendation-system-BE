const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const User = require("../../models/user");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (user) => {
  return jwt.sign(
    {
      email: user.email,
    },
    process.env.JWT_SECRET,
  );
};

const register = async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(400).json({
      Error: "User already exists!",
    });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashed,
    authProvider: "local",
  });

  res.json({
    Message: "User Registered",
    user,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      Error: "User not found",
    });
  }

  if (user.authProvider === "google" && !user.password) {
    return res.status(400).json({
      Error: "This account uses Google login",
    });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).json({
      Error: "Wrong password",
    });
  }

  const token = createToken(user);

  res.json({
    token,
  });
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        Error: "Google credential is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({
        Error: "Google account email not found",
      });
    }

    const email = payload.email.toLowerCase();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        authProvider: "google",
        googleId: payload.sub,
        name: payload.name || "",
        avatarUrl: payload.picture || "",
      });
    } else {
      user.googleId = user.googleId || payload.sub;
      user.authProvider = user.authProvider || "google";
      user.name = user.name || payload.name || "";
      user.avatarUrl = user.avatarUrl || payload.picture || "";

      await user.save();
    }

    const token = createToken(user);

    return res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(401).json({
      Error: "Invalid Google credential",
    });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
};
