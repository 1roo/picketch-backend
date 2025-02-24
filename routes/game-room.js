const gameRoomRouter = require("express").Router();
const gameRoomController = require("../controllers/gameRoomController");
const authMiddleware = require("../middleware/authMiddleware");

gameRoomRouter.get("/", gameRoomController.getGameRoom);
gameRoomRouter.post("/", gameRoomController.addGameRoom);
gameRoomRouter.delete("/:room_id", gameRoomController.deleteGameRoom);
module.exports = gameRoomRouter;
