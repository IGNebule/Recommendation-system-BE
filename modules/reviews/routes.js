const express = require("express");

const router = express.Router();

const controller = require("./controller");
const authMiddleware = require("../../middleware/auth");

router.get("/", controller.getReviews);
router.post("/", authMiddleware, controller.createReview);

module.exports = router;
