const express = require("express");

const router = express.Router();

const controller = require("./controller");
const authMiddleware = require("../../middleware/auth");
const uploadAvatar = require("../../middleware/uploadAvatar");

router.get("/me", authMiddleware, controller.getMyProfile);

router.put("/me", authMiddleware, controller.updateMyProfile);

router.put(
  "/me/avatar",
  authMiddleware,
  uploadAvatar.single("avatar"),
  controller.updateAvatar,
);

module.exports = router;
