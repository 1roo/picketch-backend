const socketIO = require("socket.io");
const { GameHandler } = require("./Game");

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

  io.on("connect", async (socket) => {
    // 입장 시 토큰에서 user_id  혹은 닉네임 추출
    console.log("연결 클라이언트 소켓 id는 ", socket.id);

    // 사용자 체크 임시 작성
    socket.emit("message", socket.id);
    userInfo[socket.id] = { nickname: "닭고기", userId: 55 };

    // 게임방 퇴장 이벤트
    GameHandler(io, socket, userInfo);
  });
}

module.exports = { io, socketHandler };
