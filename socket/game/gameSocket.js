const { drawCanvasHandler, clearCanvasHandler } = require("./gameCanvas");
const { gameChatHandler } = require("./gameChat");
const { joinGameRoomHandler, leaveGameRoomHandler } = require("./gameConnection");
const {
  readyGameHandler,
  startGameHandler,
  nextTurnHandler,
  endGameHandler,
} = require("./gameSetup");
const { setPlayerToUsersInfo } = require("./gameUtils");

exports.gameSocket = async (io, socket) => {
  // 소켓연결하는 유저 저장 (socketUserInfo)
  setPlayerToUsersInfo(socket.id, socket.userInfo);

  // 게임방 입장
  socket.on("joinGame", async (payload) => {
    await joinGameRoomHandler(io, socket, payload);
  });
  // 게임 준비
  socket.on("readyGame", async () => {
    await readyGameHandler(io, socket);
  });
  // 게임 시작
  socket.on("startGame", async () => {
    await startGameHandler(io, socket);
  });
  // 다음 라운드 시작
  socket.on("nextTurn", () => {
    nextTurnHandler(io, socket);
  });
  // 게임 종료
  socket.on("endGame", async () => {
    await endGameHandler(io, socket);
  });
  // 게임방 퇴장
  socket.on("leaveGame", async () => {
    await leaveGameRoomHandler(io, socket, true);
  });
  // 게임방 채팅
  socket.on("gameMessage", async (payload) => {
    gameChatHandler(io, socket, payload);
  });
  // 게임방 그림 그리기
  socket.on("drawCanvas", async (payload) => {
    drawCanvasHandler(io, socket, payload);
  });
  // 게임방 그림 초기화
  socket.on("clearCanvas", async (cb) => {
    clearCanvasHandler(io, socket, cb);
  });
  // 연결 종료
  socket.on("disconnect", async () => {
    await leaveGameRoomHandler(io, socket, false);
  });
};
