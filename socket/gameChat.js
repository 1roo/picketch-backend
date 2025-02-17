const db = require("../models");
const { getActiveRoom, checkValidRoom } = require("./gameUtils");

// {[socket_id] : { nickname : string, user_id: string, roomName :string}

exports.gameChatHandler = async (io, socket, userInfo, payload) => {
  try {
    // 게임 채팅 보내기
    const { message } = payload;
    const roomName = userInfo[socket.id].roomName;
    console.log(userInfo[socket.id].nickname, socket.id, message);
    console.log(socket.rooms);
    console.log("메세지", message);

    // 방에 참가한지 여부 확인
    const { room } = await getActiveRoom(roomName);
    const gameId = room.game_id;
    const userId = userInfo[socket.id].userId;
    const { checkResult } = await checkValidRoom(gameId, userId);

    if (!checkResult) throw new Error("참가 중인 방이 아닙니다.");

    const resBody = {
      senderNick: userInfo[socket.id].nickname,
      senderSocketId: socket.id,
      gameMessage: message,
    };
    io.to(userInfo[socket.id].roomName).emit("sendGameMessage", resBody); // 참여중인 방에 메세지 보내기
  } catch (err) {
    console.log(err);
    const payload = {
      type: "FAIL",
      message: err.message,
      data: {
        senderNick: userInfo[socket.id].nickname,
        senderSocketId: socket.id,
        gameMessage: message,
      },
    };
    socket.emit("sendGameMessage", payload);
  }
};
