const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require('../../models/user')

const register = async (req, res) => {
  const { email, password } = req.body;
  const existing = await User.findOne({ email })

  if (existing) {
    return res.status(400).json({
      Error: 'User already exists!'
    })
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashed
  })

  res.json({
    Message: "User Registered", user
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email })

  if (!user) {
    return res.status(400).json({ Error: "User not found" });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(400).json({ Error: "Wrong password" });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET);

  res.json({ token });
};

module.exports = {
  register,
  login,
};
