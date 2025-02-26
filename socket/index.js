const socketIO = require("socket.io");
const { validationError } = require("../utils/common");
const { dmChatSocket } = require("./dmChat");
const { authSocketMiddleware } = require("../middleware/socketMiddleware");
const { gameSocket } = require("./game/gameSocket");
const { syncGameInfoWithPlayersFromDB } = require("./game/gameUtils");

function socketHandler(server) {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });
  const game = io.of("/game");
  const dmChat = io.of("/dmChat");

  syncGameInfoWithPlayersFromDB();
  game.use(authSocketMiddleware);
  dmChat.use(authSocketMiddleware);

  // game
  game.on("connection", (socket) => gameSocket(io, socket));
  // dmChat
  dmChat.on("connection", (socket) => dmChatSocket(io, socket));
}

module.exports = { socketHandler };
