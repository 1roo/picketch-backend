const gameRouter = require("express").Router();
const gameController = require("../controllers/gameController");
const authMiddleware = require("../middleware/authMiddleware");

gameRouter.post("/", authMiddleware, gameController.joinGameRoom);

module.exports = gameRouter;
