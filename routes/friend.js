const friendRouter = require("express").Router();
const friendController = require("../controllers/friendController");
const authMiddleware = require("../middleware/authMiddleware");

friendRouter.get("/", authMiddleware, friendController.getFriend);
friendRouter.get("/request/:friend_id", authMiddleware, friendController.friendRequest);
friendRouter.get(
  "/accept/:sender_id",
  authMiddleware,
  friendController.acceptFriendRequest,
);
friendRouter.get(
  "/reject/:sender_id",
  authMiddleware,
  friendController.rejectFriendRequest,
);
friendRouter.delete("/:friend_id", authMiddleware, friendController.deleteFriend);

module.exports = friendRouter;
