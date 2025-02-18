const express = require("express");
const router = express.Router();
const authRouter = require("./auth");
const userRouter = require("./user");
const gameRouter = require("./game");

// /api/auth
router.use("/auth", authRouter);

// /api/user
router.use("/user", userRouter);

// /api/game
router.use("/game", gameRouter);

module.exports = router;
