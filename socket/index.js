const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const { joinGameRoomHandler, leaveGameRoomHandler } = require("./gameConnection");
const { gameChatHandler } = require("./gameChat");
const db = require("../models");

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
  io.use(async (socket, next) => {
    try {
      const tokenHeader = socket.handshake.headers["authorization"];
      if (!tokenHeader.startsWith("Bearer")) throw new Error("잘못된 토큰 형식입니다.");
      const token = tokenHeader.split(" ")[1];
      console.log("토큰내용은 ", token);
      // if (!token) {
      //   throw new Error("토큰값이 존재 하지 않습니다.");
      // }

      // 토큰 복호화
      // const auth = jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      //   if (err) {
      //     let message;
      //     if (err.name === "TokenExpiredError") {
      //       message = "토큰이 만료되었습니다.";
      //     } else if (err.name === "JsonWebTokenError") {
      //       message = "토큰값이 잘못되었습니다.";
      //     } else {
      //       message = "기타 토큰 에러";
      //     }
      //     return next(new Error(message));
      //   } else {
      //     // 복호화 성공시
      //     decoded.userId = auth.user_id;
      //     return next();
      //   }
      // });
      socket.userId = 3;

      // user_id값의 실제 유저 존재 여부 확인(토큰 변조)
      const user = await db.User.findByPk(socket.userId);
      if (!user) {
        return next(new Error("존재하지 않는 유저입니다."));
      }
      return next();
    } catch (err) {
      // 에러발생시 클라이언트에서 connect_error 이벤트로 소켓 연결 실패 수신
      console.log(err);
      return next(err);
    }
  });

  io.on("connect", async (socket) => {
    // 입장 시 토큰에서 user_id  혹은 닉네임 추출
    console.log("연결 클라이언트 소켓 id는 ", socket.id);
    console.log("연결 클라이언트 user id는 ", socket.userId);

    // user_id에 맞는 유저의 정보 메모리에 저장
    if (!userInfo[socket.id]) {
      userInfo[socket.id] = {};
      userInfo[socket.id].userId = socket.userId;
    }
    console.log(userInfo);

    // 연결 테스트 확인용 임시 작성
    socket.emit("message", socket.id);

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
