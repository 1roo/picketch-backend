const socketIO = require("socket.io");
const { joinGameRoomHandler, leaveGameRoomHandler } = require("./gameConnection");
const { gameChatHandler } = require("./gameChat");
const { authSocketMiddleware } = require("../middleware/socketMiddleware");
const { socketUsersInfo, socketGamesInfo } = require("./gameStore");
const { editPlayerToUsersInfo } = require("./gameUtils");
const { startGameHandler, readyGameHandler } = require("./gameSetup");

let io;

function socketHandler(server) {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  // 소켓연결 전 유효한 토큰 검증 로직
  io.use(authSocketMiddleware);

  io.on("connect", async (socket) => {
    // 입장 시 토큰에서 user_id  혹은 닉네임 추출
    console.log("연결 클라이언트 소켓 id는 ", socket.id);
    console.log("연결 클라이언트 user id는 ", socket.userId);

    // 소켓연결 성공 시 user_id에 맞는 유저의 정보 메모리에 저장
    editPlayerToUsersInfo(socket.id, socket.user.userId, socket.user.nickname);
    console.log("socketUsersInfo", socketUsersInfo);
    console.log("socketGamesInfo은", socketGamesInfo);

    // 연결 테스트 확인용 임시 작성
    socket.emit("message", socket.id);

    // 게임방 입장
    socket.on("joinGame", async (payload) => {
      await joinGameRoomHandler(io, socket, payload);
    });
    // 게임 시작
    socket.on("readyGame", async () => {
      await readyGameHandler(io, socket);
    });
    // 게임방 퇴장
    socket.on("leaveGame", async () => {
      await leaveGameRoomHandler(io, socket, true);
    });
    // 게임방 채팅
    socket.on("sendGameMessage", async (payload) => {
      await gameChatHandler(io, socket, payload);
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
