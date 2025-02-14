const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const userRouter = require('./user');
const gameRouter = require('./game');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 유저 추가 수정 삭제 조회
 */

// GET /api
router.get('/', controller.getLogin);

// /user
router.use('/user', userRouter);

// /game
router.use('/game', gameRouter);

module.exports = router;
