require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/routes");
const recRoutes = require("./modules/recommend/routes");
const genreRoutes = require("./modules/genres/routes");
const discoverRoutes = require("./modules/discover/routes");
const prefRoutes = require("./modules/preferences/routes");
const gameRoutes = require("./modules/games/routes");
const searchRoutes = require("./modules/search/routes");
const authMiddleware = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/genres", genreRoutes);
app.use("/api/discover", discoverRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/recommendations", authMiddleware, recRoutes);
app.use("/api/preferences", authMiddleware, prefRoutes);

app.get("/", (req, res) => {
  res.send("BACKEND RUNNING!");
});

module.exports = app;
