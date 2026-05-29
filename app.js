require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/routes");
const recRoutes = require("./modules/recommend/routes");
const genreRoutes = require("./modules/genres/routes");
const tagRoutes = require("./modules/tags/routes");
const discoverRoutes = require("./modules/discover/routes");
const prefRoutes = require("./modules/preferences/routes");
const gameRoutes = require("./modules/games/routes");
const searchRoutes = require("./modules/search/routes");
const authMiddleware = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

// hit
app.use("/api/auth", authRoutes);

// hit
app.use("/api/games", gameRoutes);

// hit
app.use("/api/genres", genreRoutes);

// hit
app.use("/api/tags", tagRoutes);

// hit {trending: trending_score, top-rated: rating_percent, most-played: average_playtime}
app.use("/api/discover", discoverRoutes);

// hit
app.use("/api/search", searchRoutes);

// hit
app.use("/api/recommendations", authMiddleware, recRoutes);

// hit
app.use("/api/preferences", authMiddleware, prefRoutes);

app.get("/", (req, res) => {
  res.send("BACKEND RUNNING!");
});

module.exports = app;
