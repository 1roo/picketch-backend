const express = require("express");
const router = express.Router();
const authRouter = require("./auth");
const userRouter = require("./user");
const rankingRouter = require("./ranking");
const friendRouter = require("./friend");
const gameRoomRouter = require("./game-room");

// /api/auth
router.use("/auth", authRouter);

// /api/user
router.use("/user", userRouter);

// api/friend
router.use("/friend", friendRouter);

// api/ranking
router.use("/ranking", rankingRouter);

// api/game-room
router.use("/game-room", gameRoomRouter);

module.exports = router;
