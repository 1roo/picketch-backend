const gameRoomRouter = require("express").Router();
const controller = require("../controllers/GameRoomController");

gameRoomRouter.get("/", controller.getGameRoom);
gameRoomRouter.post("/", controller.addGameRoom);
gameRoomRouter.delete("/", controller.deleteGameRoom);
module.exports = gameRoomRouter;
