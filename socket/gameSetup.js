const { socketUsersInfo, socketGamesInfo } = require("./gameStore");
const {
  getPlayerFromUsersInfo,
  checkValidRoom,
  toggleReadyGamesInfo,
  getGamesInfoByGameId,
  formatReadyData,
  getGameRoom,
  checkAllReady,
  setGameFromGamesInfo,
  getGameInfoByGameId,
  getParticipants,
  isUserInGame,
  updateWaitingStatus,
} = require("./gameUtils");

exports.readyGameHandler = async (io, socket) => {
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  const gameInfo = getGameInfoByGameId(gameId);
  const {
    currentTurnId,
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
    if (manager === userId) throw new Error("방장은 준비상태를 변경할 수 없습니다.");

    // 레디 상태 토글
    toggleReadyGamesInfo(gameId, userId);

    const participants = getParticipants(gameId);
    const readyStatusRes = {
      type: "SUCCESS",
      message: `${nickname}님의 ready 상태가 변경되었습니다.`,
      data: {
        players: participants,
      },
    };

    io.to(gameId).emit("readyGame", readyStatusRes);
  } catch (err) {
    console.log(err);
    const readyStatusRes = {
      type: "ERROR",
      message: err.message,
      data: {
        userId: userId,
        gameId: gameId,
      },
    };
    socket.emit("readyGame", readyStatusRes);
  }
};

exports.startGameHandler = async (io, socket) => {
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  const gameInfo = getGameInfoByGameId(gameId);
  const {
    name,
    currentTurnId,
    currentRound,
    maxRound: round,
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
    const currentTurnUserId = players[0].userId;
    const maxRound = players.length * round;
    const currentRound = 1;

    console.log("게임 시작 세팅값변경전", gameInfo);
    const changedSettingGameInfo = setGameFromGamesInfo({
      gameId,
      currentTurnUserId,
      maxRound,
      currentRound,
    });
    const startStatusRes = {
      type: "SUCCESS",
      message: `게임 시작 성공`,
      data: {
        gameId: gameId,
        ...changedSettingGameInfo,
      },
    };
    console.log("게임 시작 세팅값변경후", startStatusRes);
    io.to(gameId).emit("startGame", startStatusRes);
  } catch (err) {
    console.log(err);
    const startStatusRes = {
      type: "ERROR",
      message: err.message,
      data: {
        userId: userId,
        gameId: gameId,
      },
    };
    socket.emit("startGame", startStatusRes);
  }
};
