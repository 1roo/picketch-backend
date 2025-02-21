const socketIO = require("socket.io");
const { joinGameRoomHandler, leaveGameRoomHandler } = require("./gameConnection");
const { gameChatHandler } = require("./gameChat");
const { authSocketMiddleware } = require("../middleware/socketMiddleware");
const {
  syncUserInfoFromDB,
  expireGameFromDB,
  syncGameInfoFromDB,
} = require("./gameUtils");
const { startGameHandler, readyGameHandler } = require("./gameSetup");
const { drawCanvasHandler, clearCanvasHandler } = require("./gameCanvas");

let io;

async function socketHandler(server) {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  // 소켓연결 토큰에서 user_id 추출
  io.use(authSocketMiddleware);

  // 서버 재실행시 기존 방 만료처리
  // await expireGameFromDB();
  await syncGameInfoFromDB();

  io.on("connect", async (socket) => {
    console.log("소켓아이디", socket.id, typeof socket.id);
    // 소켓연결하는 유저 저장 (socketUserInfo)
    await syncUserInfoFromDB(socket, socket.userId);

    // 연결 테스트 확인용 임시 작성
    socket.emit("message", socket.id);

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
    // 게임방 퇴장
    socket.on("leaveGame", async () => {
      await leaveGameRoomHandler(io, socket, true);
    });
    // 게임방 채팅
    socket.on("gameMessage", async (payload) => {
      await gameChatHandler(io, socket, payload);
    });
    // 게임방 그림 그리기
    socket.on("drawCanvas", async (payload) => {
      await drawCanvasHandler(io, socket, payload);
    });
    // 게임방 그림 초기화
    socket.on("clearCanvas", async () => {
      await clearCanvasHandler(io, socket);
    });
    // 연결 종료
    socket.on("disconnect", async () => {
      await leaveGameRoomHandler(io, socket, false);
    });
  });
}

module.exports = { io, socketHandler };

// 클라이언트에서 헤더에 토큰보내는법
// const socket = io("http://localhost:5000", {
//   extraHeaders: {
//     Authorization: "Bearer your_token_here",
//   },
// });
