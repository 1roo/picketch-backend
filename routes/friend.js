const friendRouter = require("express").Router()
const controller = require("../controllers/FriendController")


friendRouter.get("/", controller.getFriend);
friendRouter.get("/:friend_id", controller.addFriend);
friendRouter.delete("/:friend_id", controller.deleteFriend);

module.exports = friendRouter;
