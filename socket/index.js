const socketIO = require("socket.io");
const { joinGameRoomHandler, leaveGameRoomHandler } = require("./gameConnection");
const { gameChatHandler } = require("./gameChat");

let io;
// {[socket_id] : { nickname : string, user_id: string, roomName :string}
// userId는 socket.userId로 저장
const userInfo = {};
function socketHandler(server) {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  // 소켓연결 전 유효한 토큰 검증 로직
  // io.use((socket, next) => {
  //   try {
  //     const tokenHeader = socket.handshake.headers["authorization"];
  //     const token = tokenHeader?.slice(7);
  //     if (!token) {
  //       throw new Error("토큰이 존재 하지 않습니다.");
  //     }

  //     // 토큰 복호화
  //     // 복호화 성공시
  //     // next()
  //     // 복호화 실패시
  //     next();
  //   } catch (err) {
  //     // 에러발생시 클라이언트에서 connect_error 이벤트로 소켓 연결 실패 수신
  //     console.log(err);
  //   }
  // });

  io.on("connect", async (socket) => {
    // 입장 시 토큰에서 user_id  혹은 닉네임 추출
    console.log("연결 클라이언트 소켓 id는 ", socket.id);

    // 토큰 검증

    // 사용자 체크 임시 작성
    socket.emit("message", socket.id);
    userInfo[socket.id] = { nickname: "닭고기", userId: 55 };

    // 게임방 입장
    socket.on("joinGame", async (roomName, inputPw) => {
      await joinGameRoomHandler(io, socket, userInfo, roomName, inputPw);
    });
    // 게임방 퇴장
    socket.on("leaveGame", async () => {
      await leaveGameRoomHandler(io, socket, userInfo, true);
    });
    // 게임방 채팅
    socket.on("sendGameMessage", async (payload) => {
      await gameChatHandler(io, socket, userInfo, payload);
    });
    // 연결 종료
    socket.on("disconnect", async () => {
      await leaveGameRoomHandler(io, socket, userInfo, false);
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
