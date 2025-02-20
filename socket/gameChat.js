const { socketUsersInfo, socketGamesInfo } = require("./gameStore");
const {
  checkValidRoom,
  getPlayerFromUsersInfo,
  getGameRoom,
  isUserInGame,
} = require("./gameUtils");

exports.gameChatHandler = async (io, socket, payload) => {
  // 게임 채팅 보내기
  console.log("페이로드는", payload);

  const { message } = payload;
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  const game = getPlayerFromUsersInfo(gameId);
  const {
    name,
    currentTurnId,
    currentRound,
    maxRound,
    isLock,
    pw,
    manager,
    isWaiting,
    players,
  } = game;
  try {
    // message 유효성 검사
    if (!message) {
      throw new Error("메세지가 존재 하지 않습니다.");
    }
    if (typeof message !== "string") {
      throw new Error("message가 문자열이 아닙니다.");
    }

    // 내가 참가중인 방인지 확인
    const isEntering = isUserInGame(gameId, userId);
    if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");

    const sendMsgRes = {
      type: "SUCCESS",
      senderId: userId,
      senderNick: nickname,
      gameMessage: message,
    };

    // 게임 시작시 정답여부 체크해서 보냄
    if (!isWaiting) {
      sendMsgRes.isAnswer = true;
    }

    io.to(gameId).emit("sendGameMessage", sendMsgRes); // 참여중인 방에 메세지 보내기
  } catch (err) {
    console.log(err);

    const sendMsgRes = {
      type: "FAIL",
      message: err.message,
      data: {
        senderId: userId,
        senderNick: nickname,
        gameMessage: message || null,
      },
    };

    socket.emit("sendGameMessage", sendMsgRes);
  }
};
