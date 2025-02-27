const db = require("../../models");
const { socketGamesInfo } = require("./gameStore");
const {
  getPlayerFromUsersInfo,
  toggleReadyGamesInfo,
  checkAllReady,
  setGameFromGamesInfo,
  getGameInfoByGameId,
  isUserInGame,
  updateWaitingStatus,
  getRandomKeywords,
  getErrorRes,
  getReadyRes,
  getUpdateGameInfoRes,
  emitRoundStartWithTurn,
  getEndGameRes,
  getParticipants,
  setPlayersScore,
  setGameEnd,
  getStartGameRes,
} = require("./gameUtils");

exports.readyGameHandler = async (io, socket) => {
  try {
    const userInfo = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(userInfo.gameId);

    // 참가 가능 방 여부 확인
    if (!gameInfo) throw new Error("존재하지 않는 방입니다.");
    if (!gameInfo.isWaiting) throw new Error("시작된 방입니다.");
    // 내가 참가중인 방인지 확인
    const isEntering = isUserInGame(userInfo.gameId, userInfo.userId);
    if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");
    // 방장 여부 확인
    if (gameInfo.manager === userInfo.userId)
      throw new Error("방장은 준비상태를 변경할 수 없습니다.");

    // 레디 상태 토글
    toggleReadyGamesInfo(userInfo.gameId, userInfo.userId);

    // readyGame 성공 응답객체
    const readyGameRes = getReadyRes(socket.id);
    // updateParticipants 성공 응답객체
    const updateGameInfoRes = getUpdateGameInfoRes(socket.id);

    io.of("/game").to(userInfo.gameId).emit("readyGame", readyGameRes);
    io.of("/game").to(userInfo.gameId).emit("updateGameInfo", updateGameInfoRes);
  } catch (err) {
    console.log(err);
    const readyErrRes = getErrorRes(socket.id, err.message);
    socket.emit("readyGame", readyErrRes);
  }
};

exports.startGameHandler = async (io, socket) => {
  try {
    const userInfo = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(userInfo.gameId);

    console.log("start시 게임정보", gameInfo);
    // 참가 가능 방 여부 확인
    if (!gameInfo) throw new Error("존재하지 않는 방입니다.");
    if (!gameInfo.isWaiting) throw new Error("시작된 방입니다.");
    // 내가 참가중인 방인지 확인
    const isEntering = isUserInGame(userInfo.gameId, userInfo.userId);
    if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");
    // 방장 여부 확인
    if (gameInfo.manager !== userInfo.userId)
      throw new Error("방장만 시작할 수 있습니다.");
    // 2인 이상 시작
    if (gameInfo.players.length < 2)
      throw new Error("유저가 2명 이상 있을때만 시작할 수 있습니다.");

    // 전체 유저의 준비상태를 체크
    const isAllReady = checkAllReady(userInfo.gameId);
    if (!isAllReady) {
      throw new Error("전체 유저가 Ready 상태가 아닙니다.");
    }

    // db 정보 변경
    const updateResult = await updateWaitingStatus(userInfo.gameId);
    if (!updateResult[0]) throw new Error("isWaiting 상태를 변경할 수 없습니다.");

    // // 스타트를 누르면 게임을 하기위한 세팅값 설정
    // const newCurrentTurnUserId = gameInfo.players[0].userId;
    const newMaxRound = gameInfo.players.length * gameInfo.maxRound;
    const newCurrentRound = 0;
    const newIsWaiting = false;
    const newIsAnswerFound = true;
    const newKeywords = await getRandomKeywords(newMaxRound);
    // const newCurrentRoundKeyword = newKeywords[newCurrentRound - 1];
    // const newIsNextRoundSettled = true;
    const newIsGameEnd = false;

    setGameFromGamesInfo({
      gameId: userInfo.gameId,
      // newCurrentTurnUserId,
      newMaxRound,
      newCurrentRound,
      newKeywords,
      // newCurrentRoundKeyword,
      newIsWaiting,
      newIsAnswerFound,
      // newIsNextRoundSettled,
      newIsGameEnd,
    });

    console.log("게임시작시 게임정보", socketGamesInfo[userInfo.gameId]);
    // emitRoundStartWithTurn(io, socket.id, "startGame");
    const startGameRes = getStartGameRes(socket.id, "게임 시작");
    io.of("/game").to(userInfo.gameId).emit("startGame", startGameRes);
    const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
    io.of("/game").to(userInfo.gameId).emit("updateGameInfo", updateGameInfoRes);
  } catch (err) {
    console.log(err);
    const startErrRes = getErrorRes(socket.id, err.message);
    socket.emit("startGame", startErrRes);
  }
};

// exports.startGameHandler = async (io, socket) => {
//   try {
//     const userInfo = getPlayerFromUsersInfo(socket.id);
//     const gameInfo = getGameInfoByGameId(userInfo.gameId);

//     console.log("start시 게임정보", gameInfo);
//     // 참가 가능 방 여부 확인
//     if (!gameInfo) throw new Error("존재하지 않는 방입니다.");
//     if (!gameInfo.isWaiting) throw new Error("시작된 방입니다.");
//     // 내가 참가중인 방인지 확인
//     const isEntering = isUserInGame(userInfo.gameId, userInfo.userId);
//     if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");
//     // 방장 여부 확인
//     if (gameInfo.manager !== userInfo.userId)
//       throw new Error("방장만 시작할 수 있습니다.");
//     // 2인 이상 시작
//     if (gameInfo.players.length < 2)
//       throw new Error("유저가 2명 이상 있을때만 시작할 수 있습니다.");

//     // 전체 유저의 준비상태를 체크
//     const isAllReady = checkAllReady(userInfo.gameId);
//     if (!isAllReady) {
//       throw new Error("전체 유저가 Ready 상태가 아닙니다.");
//     }

//     // db 정보 변경
//     const updateResult = await updateWaitingStatus(userInfo.gameId);
//     if (!updateResult[0]) throw new Error("isWaiting 상태를 변경할 수 없습니다.");

//     // 스타트를 누르면 게임을 하기위한 세팅값 설정
//     const newCurrentTurnUserId = gameInfo.players[0].userId;
//     const newMaxRound = gameInfo.players.length * gameInfo.maxRound;
//     const newCurrentRound = 1;
//     const newIsWaiting = false;
//     const newIsAnswerFound = false;
//     const newKeywords = await getRandomKeywords(newMaxRound);
//     const newCurrentRoundKeyword = newKeywords[newCurrentRound - 1];
//     const newIsNextRoundSettled = true;
//     const newIsGameEnd = false;

//     setGameFromGamesInfo({
//       gameId: userInfo.gameId,
//       newCurrentTurnUserId,
//       newMaxRound,
//       newCurrentRound,
//       newKeywords,
//       newCurrentRoundKeyword,
//       newIsWaiting,
//       newIsAnswerFound,
//       newIsNextRoundSettled,
//       newIsGameEnd,
//     });

//     console.log("게임시작시 게임정보", socketGamesInfo[userInfo.gameId]);
//     emitRoundStartWithTurn(io, socket.id, "startGame");

//     const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
//     io.of("/game").to(userInfo.gameId).emit("updateGameInfo", updateGameInfoRes);
//   } catch (err) {
//     console.log(err);
//     const startErrRes = getErrorRes(socket.id, err.message);
//     socket.emit("startGame", startErrRes);
//   }
// };

// 중복으로 클라이언트에게 응답보내는것을 방지
exports.nextTurnHandler = (io, socket) => {
  try {
    console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥nextTurnHandler 실행");
    const userInfo = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(userInfo.gameId);
    console.log("넥스트 함수실행할때 유저정보", userInfo);
    // 라운드 세팅이 완료된 이후 들어오는 요청 무시
    if (gameInfo.isNextRoundSettled) {
      return;
    }
    // socketGamesInfo[userInfo.gameId] = {
    //   ...socketGamesInfo[userInfo.gameId],
    //   isNextRoundSettled: true,
    // };

    // 타이머 설정
    function startTimer(gameRoom) {
      let remainingTime = timerDuration;

      // 타이머 카운트다운
      timerInterval = setInterval(() => {
        remainingTime--;
        io.to(gameRoom).emit("updateTimer", remainingTime); // 모든 클라이언트에 타이머 정보 전송

        if (remainingTime <= 0) {
          clearInterval(timerInterval); // 타이머 종료
          io.to(gameRoom).emit("timerEnd"); // 타이머 종료 이벤트 전송
        }
      }, 1000);
    }
    // startTimer();
    // gameInfo.isNextRoundSettled = true;

    // 참가 가능 방 여부 확인
    if (!gameInfo) throw new Error("존재하지 않는 방입니다.");
    if (gameInfo.isWaiting) throw new Error("대기중인 방입니다.");
    // 내가 참가중인 방인지 확인
    const isEntering = isUserInGame(userInfo.gameId, userInfo.userId);
    if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");
    // 현재 라운드가 종료되었는지 확인
    if (!gameInfo.isAnswerFound) throw new Error("현재 라운드가 종료되지 않았습니다.");
    // nextTurn 요청이 올때 마지막 라운드인지 확인
    if (gameInfo.currentRound >= gameInfo.maxRound) {
      throw new Error("현재 마지막 라운드입니다.");
    }
    console.log("nextTurn 요청시 게임정보", gameInfo);
    // 다음 라운드 게임을 하기위한 세팅값 설정
    const gameId = userInfo.gameId;
    const currentTurnUserIndex = gameInfo.players.findIndex(
      (player) => player.userId === gameInfo.currentTurnUserId,
    );
    const nextCurrentTurnUserIndex = (currentTurnUserIndex + 1) % gameInfo.players.length;
    const nextCurrentTurnUserId = gameInfo.players[nextCurrentTurnUserIndex].userId;
    const nextCurrentRound = gameInfo.currentRound + 1;
    const nextIsAnswerFound = false;
    const nextCurrentRoundKeyword = gameInfo.keywords[nextCurrentRound - 1];
    const nextIsNextRoundSettled = true;
    const nextIsGameEnd = false;
    setGameFromGamesInfo({
      gameId,
      newCurrentTurnUserId: nextCurrentTurnUserId,
      newCurrentRound: nextCurrentRound,
      newCurrentRoundKeyword: nextCurrentRoundKeyword,
      newIsAnswerFound: nextIsAnswerFound,
      newIsNextRoundSettled: nextIsNextRoundSettled,
      newIsGameEnd: nextIsGameEnd,
    });

    const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
    console.log("다음 턴 시작시 게임정보", socketGamesInfo[gameId]);
    emitRoundStartWithTurn(io, socket.id, "nextTurn");
    io.of("/game").to(gameId).emit("updateGameInfo", updateGameInfoRes);
  } catch (err) {
    console.log(err);
    const nextTurnErrRes = getErrorRes(socket.id, err.message);
    socket.emit("nextTurn", nextTurnErrRes);
  }
};

//
exports.endGameHandler = async (io, socket) => {
  const transaction = await db.sequelize.transaction();
  try {
    const userInfo = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(userInfo.gameId);
    // 게임 종료된 이후 들어오는 요청 무시
    if (gameInfo.isGameEnd) {
      return;
    }
    if (gameInfo.isWaiting) throw new Error("대기중인 방입니다.");
    // 내가 참가중인 방인지 확인
    const isEntering = isUserInGame(userInfo.gameId, userInfo.userId);
    if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");
    // 마지막 라운드에 도달했는지 확인
    if (gameInfo.currentRound < gameInfo.maxRound) {
      throw new Error("마지막 라운드아닙니다.");
    }
    // 정답 제출 여부 확인
    if (!gameInfo.isAnswerFound) {
      throw new Error("정답이 제출되지 않았습니다.");
    }

    // db에 유저들 최종 점수 업데이트
    const playersInfo = getParticipants(userInfo.gameId);
    await setPlayersScore(playersInfo, transaction);
    transaction.commit();

    // 게임방 종료처리
    setGameEnd(socket.id);
    console.log("endGame 요청 후 게임정보 ", socketGamesInfo[userInfo.gameId]);
    const endGameRes = getEndGameRes(socket.id);
    console.log("endGame시 응답값", endGameRes);
    const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
    io.of("/game").to(userInfo.gameId).emit("endGame", endGameRes);
    io.of("/game").to(userInfo.gameId).emit("updateGameInfo", updateGameInfoRes);
  } catch (err) {
    transaction.rollback();
    console.log(err);
    const endGameErrRes = getErrorRes(socket.id, err.message);
    socket.emit("endGame", endGameErrRes);
  }
};
