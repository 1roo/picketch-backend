const friendRouter = require("express").Router();
const controller = require("../controllers/friendController");

friendRouter.get("/", controller.getFriend);
friendRouter.post("/", controller.addFriend);
friendRouter.delete("/:friend_id", controller.deleteFriend);

module.exports = friendRouter;
