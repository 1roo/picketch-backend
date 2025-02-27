const gameRoomRouter = require("express").Router();
const gameRoomController = require("../controllers/GameRoomController");
const authMiddleware = require("../middleware/authMiddleware");

gameRoomRouter.get("/", authMiddleware, gameRoomController.getGameRoom);
gameRoomRouter.post("/", authMiddleware, gameRoomController.addGameRoom);
gameRoomRouter.post("/join", authMiddleware, gameRoomController.joinGameRoom);
gameRoomRouter.delete("/:room_id", authMiddleware, gameRoomController.deleteGameRoom);
module.exports = gameRoomRouter;
