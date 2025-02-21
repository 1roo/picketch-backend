const gameRoomRouter = require("express").Router();
const gameRoomController = require("../controllers/gameRoomController");
const authMiddleware = require("../middleware/authMiddleware");

gameRoomRouter.get("/", authMiddleware, gameRoomController.getGameRoom);
gameRoomRouter.post("/", authMiddleware, gameRoomController.addGameRoom);
gameRoomRouter.delete("/:room_id", authMiddleware, gameRoomController.deleteGameRoom);
module.exports = gameRoomRouter;
