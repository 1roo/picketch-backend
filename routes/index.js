const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const userRouter = require("./user");

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

module.exports = router;
