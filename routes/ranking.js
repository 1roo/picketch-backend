const rankingRouter = require("express").Router();
const controller = require("../controllers/rankingController");

rankingRouter.get("/user", controller.getRankingUser);
rankingRouter.get("/region", controller.getRankingRegion);

module.exports = rankingRouter;
