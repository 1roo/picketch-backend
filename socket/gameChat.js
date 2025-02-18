const { socketUsersInfo, socketGamesInfo } = require("./gameStore");
const { getActiveRoom, checkValidRoom, getPlayerFromUserInfo } = require("./gameUtils");

exports.gameChatHandler = async (io, socket, payload) => {
  // 게임 채팅 보내기
  console.log("페이로드는", payload);
  console.log("채팅메세지보낼때 socketUsersInfo ", socketUsersInfo);
  console.log("채팅메세지보낼때 socketGamesInfo", socketGamesInfo);

  const { message } = payload;
  const { userId, nickname, gameId } = getPlayerFromUserInfo(socket.id);
  try {
    // 메세지 페이로드가 없을때
    if (!message) {
      throw new Error("메세지가 존재 하지 않습니다.");
    }

    // 참가중인 방이 있는지 확인
    if (!gameId) throw new Error("참가중인 방이 없습니다.");

    // 해당방이 존재하는지 확인
    const { game } = await getActiveRoom(gameId);
    if (!game) throw new Error("존재하지 않는 방입니다.");

    const { game_id, name, manager, is_lock, pw, round, is_finish } = game;

    // 내가 참가중인 방인지 확인
    const checkResult = await checkValidRoom(game_id, userId);
    if (!checkResult) throw new Error("참가 중인 방이 아닙니다.");

    const sendMsgRes = {
      type: "SUCCESS",
      senderId: userId,
      senderNick: nickname,
      gameMessage: message,
      isAnswer: true,
    };

    io.to(gameId).emit("sendGameMessage", sendMsgRes); // 참여중인 방에 메세지 보내기
  } catch (err) {
    console.log(err);

    const sendMsgRes = {
      type: "FAIL",
      message: err.message,
      data: {
        senderId: userInfo[socket.id].userId,
        senderNick: userInfo[socket.id].nickname,
        gameMessage: message || null,
      },
    };
    console.log("socket.emit 실행 전");
    socket.emit("sendGameMessage", sendMsgRes);
    console.log("socket.emit 실행 후");
  }
};
