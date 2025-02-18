const express = require("express");
const router = express.Router();
const authRouter = require("./auth");
const userRouter = require("./user");
const gameRouter = require("./game");
const rankingRouter = require("./ranking");
const friendRouter = require("./friend");
const gameRoomRouter = require("./game-room");

// /api/auth
router.use("/auth", authRouter);

// /api/user
router.use("/user", userRouter);

// /api/game
router.use("/game", gameRouter);

// /friend
router.use("/friend", friendRouter);

// /ranking
router.use("/ranking", rankingRouter);

// /game-room
router.use("/game-room", gameRoomRouter);

module.exports = router;
