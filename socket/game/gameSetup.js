const { socketGamesInfo } = require("./gameStore");
const {
  getPlayerFromUsersInfo,
  toggleReadyGamesInfo,
  checkAllReady,
  setGameFromGamesInfo,
  getGameInfoByGameId,
  getParticipants,
  isUserInGame,
  updateWaitingStatus,
  getRandomKeywords,
  getErrorRes,
  getUpdatePlayersRes,
  getReadyRes,
  getStartRes,
  emitStartGameWithTurn,
  getUpdateGameInfoRes,
  emitRoundStartWithTurn,
} = require("./gameUtils");

exports.readyGameHandler = async (io, socket) => {
  try {
    const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(gameId);
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
    } = gameInfo;
    // 참가 가능 방 여부 확인
    if (!gameInfo) throw new Error("존재하지 않는 방입니다.");
    if (!isWaiting) throw new Error("시작된 방입니다.");
    // 내가 참가중인 방인지 확인
    const isEntering = isUserInGame(gameId, userId);
    if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");
    // 방장 여부 확인
    if (manager === userId) throw new Error("방장은 준비상태를 변경할 수 없습니다.");

    // 레디 상태 토글
    toggleReadyGamesInfo(gameId, userId);

    // readyGame 성공 응답객체
    const readyGameRes = getReadyRes(socket.id, "준비 성공");
    // updateParticipants 성공 응답객체
    const updateGameInfoRes = getUpdateGameInfoRes(socket.id);

    io.of("/game").to(gameId).emit("readyGame", readyGameRes);
    io.of("/game").to(gameId).emit("updateGameInfo", updateGameInfoRes);
  } catch (err) {
    console.log(err);
    const readyErrRes = getErrorRes(socket.id, err.message);
    socket.emit("readyGame", readyErrRes);
  }
};

exports.startGameHandler = async (io, socket) => {
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  const gameInfo = getGameInfoByGameId(gameId);
  console.log("start시 게임정보", gameInfo);
  const {
    name,
    currentTurnUserId,
    currentRound,
    maxRound,
    isLock,
    pw,
    manager,
    isWaiting,
    players,
  } = gameInfo;

  try {
    // 참가 가능 방 여부 확인
    if (!gameInfo) throw new Error("존재하지 않는 방입니다.");
    if (!gameInfo.isWaiting) throw new Error("시작된 방입니다.");
    // 내가 참가중인 방인지 확인
    const isEntering = isUserInGame(gameId, userId);
    if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");
    // 방장 여부 확인
    if (manager !== userId) throw new Error("방장만 시작할 수 있습니다.");
    // 2인 이상 시작
    if (players.length < 2)
      throw new Error("유저가 2명 이상 있을때만 시작할 수 있습니다.");

    // 전체 유저의 준비상태를 체크
    const isAllReady = checkAllReady(gameId);
    if (!isAllReady) {
      throw new Error("전체 유저가 Ready 상태가 아닙니다.");
    }

    // db 정보 변경
    const updateResult = await updateWaitingStatus(gameId);
    if (!updateResult[0]) throw new Error("isWaiting 상태를 변경할 수 없습니다.");

    // 스타트를 누르면 게임을 하기위한 세팅값 설정
    const newCurrentTurnUserId = players[0].userId;
    const newMaxRound = players.length * maxRound;
    const newCurrentRound = 1;
    const newIsWaiting = false;
    const newIsAnswerFound = false;
    const newKeywords = await getRandomKeywords(maxRound);
    const newCurrentRoundKeyword = newKeywords[newCurrentRound - 1];

    setGameFromGamesInfo({
      gameId,
      newCurrentTurnUserId,
      newMaxRound,
      newCurrentRound,
      newKeywords,
      newCurrentRoundKeyword,
      newIsWaiting,
      newIsAnswerFound,
    });

    console.log("게임시작시 게임정보", socketGamesInfo[gameId]);
    // io.of("/game").to(gameId).emit("startGame", startGameRes);
    emitRoundStartWithTurn(io, socket.id, "startGame");
  } catch (err) {
    console.log(err);
    const startErrRes = getErrorRes(socket.id, err.message);
    socket.emit("startGame", startErrRes);
  }
};

// 중복으로 클라이언트에게 응답보내는것을 방지
let isNextTurnProgressing = false;
exports.nextTurnHandler = (io, socket) => {
  try {
    if (isNextTurnProgressing) {
      throw new Error("다른 클라이언트의 요청을 처리중입니다.");
    }

    isNextTurnProgressing = true;

    const userInfo = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(userInfo.gameId);

    // 참가 가능 방 여부 확인
    if (!gameInfo) throw new Error("존재하지 않는 방입니다.");
    if (gameInfo.isWaiting) throw new Error("대기중인 방입니다.");
    // 내가 참가중인 방인지 확인
    const isEntering = isUserInGame(userInfo.gameId, userInfo.userId);
    if (!isEntering) throw new Error("참가 중인 방이 아닙니다.");
    // 현재 라운드가 종료되었는지 확인
    if (!gameInfo.isAnswerFound) throw new Error("현재 라운드가 종료되지 않았습니다.");
    // 마지막 라운드를 넘었는지 확인
    if (gameInfo.currentRound >= gameInfo.maxRound)
      throw new Error("현재 마지막 라운드입니다.");

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

    setGameFromGamesInfo({
      gameId,
      newCurrentTurnUserId: nextCurrentTurnUserId,
      newCurrentRound: nextCurrentRound,
      newCurrentRoundKeyword: nextCurrentRoundKeyword,
      newIsAnswerFound: nextIsAnswerFound,
    });

    console.log("다음 턴 시작시 게임정보", socketGamesInfo[gameId]);
    emitRoundStartWithTurn(io, socket.id, "nextTurn");
  } catch (err) {
    console.log(err);
    const nextTurnErrRes = getErrorRes(socket.id, err.message);
    socket.emit("nextTurn", nextTurnErrRes);
  } finally {
    isNextTurnProgressing = false;
  }
};
