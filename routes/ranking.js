const rankingRouter = require("express").Router();
const rankingController = require("../controllers/rankingController");
const authMiddleware = require("../middleware/authMiddleware");

rankingRouter.get("/user", authMiddleware, rankingController.getRankingUser);
rankingRouter.get("/region", authMiddleware, rankingController.getRankingRegion);

module.exports = rankingRouter;
