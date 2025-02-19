const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

userRouter.post("/profile", authMiddleware, userController.createProfile);
userRouter.get("/profile/me", authMiddleware, userController.getUser);
userRouter.patch("/profile/me", authMiddleware, userController.patchUser);
userRouter.delete("/profile/me", authMiddleware, userController.deleteUser);

module.exports = userRouter;
