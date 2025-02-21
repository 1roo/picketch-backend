const express = require("express");
const authRouter = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

authRouter.post("/refresh", authController.refreshToken);
authRouter.post("/kakao", authController.kakaoLogin);
authRouter.post("/google", authController.googleLogin);
authRouter.post("/naver", authController.naverLogin);
authRouter.post("/logout", authMiddleware, authController.accountLogout);

module.exports = authRouter;
