const socketIO = require("socket.io");
const { validationError } = require("../utils/common");
const { dmChatSocket } = require("./dmChat/dmChat");
const { authSocketMiddleware } = require("../middleware/socketMiddleware");

// 요건 왜 있을꼬
let io;

function socketHandler(server) {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });
  const game = io.of("/game");
  const dmChat = io.of("/dmChat");

  io.use(authSocketMiddleware);

  // game
  game.on("connection", (socket) => gameSocket(socket));
  // dmChat
  dmChat.on("connection", (socket) => dmChatSocket(socket));
}

module.exports = { io, socketHandler };
