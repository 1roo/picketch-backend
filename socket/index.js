const socketIO = require("socket.io");
const { validationError } = require("../utils/common");
const { dmChatSocket } = require("./dmChat");
const { authSocketMiddleware } = require("../middleware/socketMiddleware");
const { gameSocket } = require("./game/gameSocket");
const { syncGameInfoFromDB } = require("./game/gameUtils");

async function socketHandler(server) {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });
  const game = io.of("/game");
  const dmChat = io.of("/dmChat");

  game.use(authSocketMiddleware);
  // 서버 재실행시 is_waiting이 true인 방만 메모리에 저장
  // 나중에 방만들때는 메모리에 저장해야함
  // await syncGameInfoFromDB();

  // game
  game.on("connection", (socket) => gameSocket(io, socket));
  // dmChat
  dmChat.on("connection", (socket) => dmChatSocket(socket));
}

module.exports = { socketHandler };
