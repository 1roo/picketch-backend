const rankingRouter = require("express").Router();
const rankingController = require("../controllers/rankingController");
const authMiddleware = require("../middleware/authMiddleware");

rankingRouter.get("/user", rankingController.getRankingUser);
rankingRouter.get("/region", rankingController.getRankingRegion);

module.exports = rankingRouter;
