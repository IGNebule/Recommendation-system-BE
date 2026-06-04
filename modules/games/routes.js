const express = require("express");
const router = express.Router();

const controller = require("./controller");

router.get("/cache/status", controller.getCacheStatus)
router.delete("/cache", controller.clearCache)

router.get("/", controller.getGames);
router.get("/:appid", controller.getGameById);

module.exports = router;
