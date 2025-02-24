const { socketGamesInfo } = require("./gameStore");
const {
  getPlayerFromUsersInfo,
  isUserInGame,
  getGameInfoByGameId,
  updateScoreToGameInfo,
  finishCurrentRound,
  getErrorRes,
  getUpdateGameInfoRes,
  getEndRoundRes,
} = require("./gameUtils");

exports.gameChatHandler = (io, socket, payload) => {
  // 게임 채팅 보내기
  const { message } = payload;
  try {
    const userInfo = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(userInfo.gameId);
    console.log("채팅보내는사람은", userInfo.userId, userInfo.nickname, userInfo.gameId);

    // message 유효성 검사
    if (!message) {
      throw new Error("메세지가 존재 하지 않습니다.");
    }
    if (typeof message !== "string") {
      throw new Error("message가 문자열이 아닙니다.");
    }

    // 내가 참가중인 방인지 확인
    const isEntering = isUserInGame(userInfo.gameId, userInfo.userId);
    if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");

    const sendMsgRes = {
      type: "SUCCESS",
      senderId: userInfo.userId,
      senderNick: userInfo.nickname,
      gameMessage: message,
    };

    // 전체에게 메세지만 전달
    io.of("/game").to(userInfo.gameId).emit("gameMessage", sendMsgRes);

    // 게임 시작 상태 AND 방장이 아닌 유저인 경우 정답 확인
    if (
      !gameInfo.isWaiting &&
      gameInfo.currentTurnUserId !== userInfo.userId &&
      !gameInfo.isAnswerFound
    ) {
      console.log("현재게임정보", socketGamesInfo[gameId]);
      console.log("채팅치는 사람 id와 메세지", userInfo.userId, message);
      console.log("현재 턴", gameInfo.currentRound);
      console.log("현재 턴의 정답", socketGamesInfo[gameId].keywords);
      console.log("현재 턴의 키워드", socketGamesInfo[gameId].currentRoundKeyword);
      const isAnswer = message === socketGamesInfo[gameId].currentRoundKeyword;
      console.log("보낸 메세지가 정답인가요?", isAnswer);
      if (isAnswer) {
        // 정답자는 gameInfo에 점수 업데이트
        // 임시 점수 - 추후 상의
        const SCORE = 10;
        updateScoreToGameInfo({
          userId: userInfo.userId,
          gameId: userInfo.gameId,
          score: SCORE,
        });
        // 정답 맞추면 해당 라운드 종료 처리 isAnswerFound 값을 true로 변경
        finishCurrentRound(userInfo.gameId);
        console.log("정답시 정답자가 누군지 전체 메세지 보내기");

        const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
        const endRoundRes = getEndRoundRes(socket.id);

        io.of("/game").to(userInfo.gameId).emit("endRound", endRoundRes);
        io.of("/game").to(userInfo.gameId).emit("updateGameInfo", updateGameInfoRes);
      }
    }
  } catch (err) {
    console.log(err);
    const gameMessageErrRes = getErrorRes(socket.id, err.message);
    socket.emit("gameMessage", gameMessageErrRes);
  }
};
// exports.gameChatHandler = (io, socket, payload) => {
//   // 게임 채팅 보내기
//   const { message } = payload;
//   try {
//     const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
//     console.log("채팅보내는사람은", userId, nickname, gameId);
//     const game = getGameInfoByGameId(gameId);
//     const {
//       name,
//       currentTurnUserId,
//       currentRound,
//       isAnswerFound,
//       maxRound,
//       isLock,
//       pw,
//       manager,
//       isWaiting,
//       players,
//     } = game;
//     // message 유효성 검사
//     if (!message) {
//       throw new Error("메세지가 존재 하지 않습니다.");
//     }
//     if (typeof message !== "string") {
//       throw new Error("message가 문자열이 아닙니다.");
//     }

//     // 내가 참가중인 방인지 확인
//     const isEntering = isUserInGame(gameId, userId);
//     if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");

//     const sendMsgRes = {
//       type: "SUCCESS",
//       senderId: userId,
//       senderNick: nickname,
//       gameMessage: message,
//     };

//     // 전체에게 메세지만 전달
//     io.of("/game").to(gameId).emit("gameMessage", sendMsgRes);

//     // 게임 시작 상태 AND 방장이 아닌 유저인 경우 정답 확인
//     if (!isWaiting && currentTurnUserId !== userId && !isAnswerFound) {
//       console.log("현재게임정보", socketGamesInfo[gameId]);
//       console.log("채팅치는 사람 id와 메세지", userId, message);
//       console.log("현재 턴", currentRound);
//       console.log("현재 턴의 정답", socketGamesInfo[gameId].keywords);
//       console.log("현재 턴의 키워드", socketGamesInfo[gameId].currentRoundKeyword);
//       const isAnswer = message === socketGamesInfo[gameId].currentRoundKeyword;
//       console.log("보낸 메세지가 정답인가요?", isAnswer);
//       if (isAnswer) {
//         // 정답자는 gameInfo에 점수 업데이트
//         // 임시 점수 - 추후 상의
//         const SCORE = 10;
//         updateScoreToGameInfo({ userId, gameId, score: SCORE });
//         // 정답 맞추면 해당 라운드 종료 처리 isAnswerFound 값을 true로 변경
//         finishCurrentRound(gameId);
//         console.log("정답시 정답자가 누군지 전체 메세지 보내기");

//         const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
//         const endRoundRes = getEndRoundRes(socket.id);

//         io.of("/game").to(gameId).emit("endRound", endRoundRes);
//         io.of("/game").to(gameId).emit("updateGameInfo", updateGameInfoRes);
//       }
//     }
//   } catch (err) {
//     console.log(err);
//     const gameMessageErrRes = getErrorRes(socket.id, err.message);
//     socket.emit("gameMessage", gameMessageErrRes);
//   }
// };
