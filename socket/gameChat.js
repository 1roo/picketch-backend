const { socketUsersInfo, socketGamesInfo } = require("./gameStore");
const {
  checkValidRoom,
  getPlayerFromUsersInfo,
  getGameRoom,
  isUserInGame,
  getGameInfoByGameId,
  updateScoreToGameInfo,
  finishCurrentRound,
} = require("./gameUtils");

exports.gameChatHandler = async (io, socket, payload) => {
  // 게임 채팅 보내기
  const { message } = payload;
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  console.log("채팅보내는사람은", userId, nickname, gameId);
  const game = getGameInfoByGameId(gameId);
  const {
    name,
    currentTurnUserId,
    currentRound,
    isAnswerFound,
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

    console.log("채팅보낼때 게임 정보", socketGamesInfo["1"]);
    console.log("isWaiting은", isWaiting);
    console.log("isWaiting은", typeof isWaiting);
    console.log("currentTurnId는", currentTurnUserId);
    console.log("userId", userId);
    // 전체에게 메세지만 전달
    io.to(gameId).emit("gameMessage", sendMsgRes);

    // 게임 시작 상태 AND 방장이 아닌 유저인 경우 정답 확인
    if (!isWaiting && currentTurnUserId !== userId && !isAnswerFound) {
      console.log("현재게임정보", socketGamesInfo[gameId]);
      console.log("채팅치는 사람 id와 메세지", userId, message);
      console.log("현재 턴", currentRound);
      console.log("현재 턴의 정답", socketGamesInfo[gameId].keywords);
      console.log("현재 턴의 키워드", socketGamesInfo[gameId].keywords[currentRound - 1]);

      const isAnswer = message === socketGamesInfo[gameId].keywords[currentRound - 1];
      console.log("보낸 메세지가 정답인가요?", isAnswer);
      if (isAnswer) {
        // 정답자는 gameInfo에 점수 업데이트
        // 임시 점수 - 추후 상의
        const SCORE = 10;
        updateScoreToGameInfo({ userId, gameId, score: SCORE });
        // 정답 맞추면 해당 라운드 종료 처리 isAnswerFound 값을 true로 변경
        finishCurrentRound(gameId);
        console.log("정답시 정답자가 누군지 전체 메세지 보내기");
        io.to(gameId).emit("correctAnswer", { correctUserId: userId });
      }
    }
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
