const rankingRouter = require("express").Router();
const controller = require("../controllers/RankingController");


rankingRouter.get("/user", controller.getRankingUser);
rankingRouter.get("/user", controller.getRankingRegion);

module.exports = rankingRouter;
