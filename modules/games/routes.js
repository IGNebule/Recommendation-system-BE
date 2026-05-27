const express = require("express");
const router = express.Router();

const controller = require("./controller");

router.get("/", controller.getGames);
router.get("/:appid", controller.getGameById);

module.exports = router;
