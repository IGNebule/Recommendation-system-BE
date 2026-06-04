const express = require("express");

const router = express.Router();

const controller = require("./controller");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/google", controller.googleLogin);

module.exports = router;
