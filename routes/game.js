const express = require("express");
const gameRouter = express.Router();
const gameController = require("../controllers/gameController");

// gameRouter.get("/keyword", gameController.getRandomKeyword);
// gameRouter.post("/score", gameController.setFinalScore);

module.exports = gameRouter;
