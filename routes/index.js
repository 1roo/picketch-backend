const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const userRouter = require("./user");
const gameRouter = require("./game");
const rankingRouter = require("./ranking");
const friendRouter = require("./friend");
const gameRoomRouter = require("./game-room");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 유저 추가 수정 삭제 조회
 */

// GET /api
router.get("/", controller.getLogin);

// /user
router.use("/user", userRouter);

// /game
router.use("/game", gameRouter);

// /friend
router.use("/friend", friendRouter);

// /ranking
router.use("/ranking", rankingRouter);

// /game-room
router.use("/game-room", gameRoomRouter);

module.exports = router;
