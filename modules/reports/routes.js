const express = require("express");
const router = express.Router();

const controller = require("./controller");

router.get("/", controller.getReport);
router.post("/debug", controller.debugVector);

module.exports = router;
