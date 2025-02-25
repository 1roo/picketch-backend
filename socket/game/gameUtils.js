const db = require("../../models");
const { socketGamesInfo, socketUsersInfo } = require("./gameStore");

// 현재 만들어져있는 방 여부 확인 db
exports.getGameRoom = async (gameId, is_waiting, transaction) => {
  console.log("isActive는", is_waiting);
  const game = await db.Game.findOne({
    where: {
      game_id: gameId,
      is_waiting: Number(is_waiting),
    },
    transaction,
  });
  return game;
};

// 방장 변경( 방장이 아닌 유저가 퇴장할 경우) db
exports.updateGameRoom = async (gameId, changeValue, transaction) => {
  console.log("changeValue는", changeValue);
  const updateResult = await db.Game.update(changeValue, {
    where: { game_id: gameId, is_waiting: 1 },
    transaction,
  });
  return updateResult;
};

// 유저 방에 참가 처리 db
exports.addUserToGameRoom = async (gameId, userId, transaction) => {
  const game = await db.Game.findOne({
    where: {
      game_id: gameId,
      is_waiting: true,
    },
    transaction,
  });
  console.log("참가하기위해 찾은 game은", game);
  if (!game) {
    throw new Error("시작한 게임이거나 존재하는 방이 아닙니다.");
  }

  const addResult = await db.PlayerGroup.create(
    {
      game_id: gameId,
      user_id: userId,
    },
    { transaction: transaction },
  );
  return addResult;
};

// 유저가 참여중인 방 정보 삭제 db
exports.deleteEnterRoomFromDB = async (gameId, userId, transaction) => {
  const destroyResult = await db.PlayerGroup.destroy({
    where: {
      game_id: gameId,
      user_id: userId,
    },
    transaction,
  });
  console.log("삭제결과는", destroyResult);
  return destroyResult;
};

// 방 대기 상태(is_waiting) 변경 db
exports.updateWaitingStatus = async (gameId) => {
  const updateResult = await db.Game.update(
    { is_waiting: 0 },
    {
      where: {
        game_id: gameId,
        is_waiting: 1,
      },
    },
  );
  console.log("업데이트결과는", updateResult);
  return updateResult;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 유저 정보 조회 (socketUserInfo)
exports.getPlayerFromUsersInfo = (socketId) => {
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  const userInfo = socketUsersInfo[socketId];
  if (!userInfo) throw new Error("userInfo에서 해당 유저를 찾을 수 없습니다.");
  return {
    userId: userInfo.userId,
    nickname: userInfo.nickname,
    gameId: userInfo.gameId,
    character: userInfo.character,
    region: userInfo.region,
  };
};

// 유저 정보 게임장 입장 (socketUserInfo)
exports.joinGameToUsersInfo = (socketId, gameId) => {
  socketUsersInfo[socketId] = {
    ...socketUsersInfo[socketId],
    gameId: gameId,
  };
  console.log("userInfo 변경 후는 ", socketUsersInfo);
};

// 유저 정보 게임방 퇴장 (socketUserInfo)
exports.leaveGameFromUsersInfo = (socketId) => {
  socketUsersInfo[socketId] = {
    ...socketUsersInfo[socketId],
    gameId: null,
  };
};

// 유저 정보에 소켓 연결유저 메모리에 저장 (socketUserInfo)
exports.setPlayerToUsersInfo = (socketId, userInfo) => {
  if (!socketId) throw new Error("연결된 소켓 id 값이 없습니다.");
  if (!socketUsersInfo[socketId]) {
    socketUsersInfo[socketId] = {};
  }
  if (userInfo.userId !== undefined) {
    socketUsersInfo[socketId].userId = userInfo.userId;
  }
  if (userInfo.nickname !== undefined) {
    socketUsersInfo[socketId].nickname = userInfo.nickname;
  }
  if (userInfo.region !== undefined) {
    socketUsersInfo[socketId].region = userInfo.region;
  }
  if (userInfo.character !== undefined) {
    socketUsersInfo[socketId].character = userInfo.character;
  }
  if (userInfo.gameId !== undefined) {
    socketUsersInfo[socketId].gameId = userInfo.gameId;
  }
  console.log("연결 소켓유저 userInfo에 저장후 ", socketUsersInfo);
};

// 유저 정보 삭제 (socketUserInfo)
exports.deletePlayerUsersInfo = (socketId) => {
  delete socketUsersInfo[socketId];
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 게임 정보 조회 (socketGamesInfo)
exports.getGameInfoByGameId = (gameId) => {
  if (!gameId) throw new Error("조회하려는 gameId 값이 없습니다.");
  const gameInfo = socketGamesInfo[gameId];
  if (!gameInfo) throw new Error("존재하지 않는 방입니다.");
  console.log("gameInfo 조회값은 ", gameInfo);
  return gameInfo;
};

// 게임 정보 생성 (socketGamesInfo)
exports.createGameInfoFromDB = (gameId, game) => {
  socketGamesInfo[gameId] = {
    name: game.name,
    currentTurnUserId: null,
    currentRound: null,
    maxRound: game.round,
    isLock: game.is_lock,
    pw: game.pw,
    manager: game.manager,
    isWaiting: game.is_waiting,
    keywords: null,
    currentRoundKeyword: null,
    isAnswerFound: null,
    isNextRoundSettled: null,
    isGameEnd: null,
    players: [],
  };
  if (!socketGamesInfo[gameId]) throw new Error("gameInfo가 생성되지 않았습니다.");
};
// 게임 정보에 참가자 넣기 (socketGamesInfo)
exports.addPlayerToGamesInfo = (socketId, gameId) => {
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  const gameInfo = exports.getGameInfoByGameId(gameId);
  const isExist = gameInfo.players.some((player) => player.userId === userInfo.userId);
  if (!isExist) {
    socketGamesInfo[gameId].players.push({
      userId: userInfo.userId,
      nickname: userInfo.nickname,
      score: 0,
      ready: gameInfo.manager === userInfo.userId ? true : false,
      character: userInfo.character,
      region: userInfo.region,
    });
  } else {
    throw new Error("이미 해당 방에 입장되어 있습니다.");
  }
  console.log("게임방 참가후(메모리) 게임정보는 ", socketGamesInfo[gameId]);
};

// 게임 정보의 해당 유저의 점수 업데이트 (socketGamesInfo)
exports.updateScoreToGameInfo = ({ userId, gameId, score }) => {
  const gameInfo = socketGamesInfo[gameId];
  console.log("점수업데이트하기 직전 게임정보");
  if (!gameInfo || !gameInfo.players) {
    console.log("게임 정보가 없거나, 유저들 정보가 없습니다.");
    return;
  }
  const isPlayerExist = gameInfo.players.some((player) => player.userId === userId);
  if (!isPlayerExist) {
    console.log("점수를 추가하려고 하는 유저가 게임에 존재하지 않습니다.");
    return;
  }
  const newPlayers = gameInfo.players.map((player) => {
    if (player.userId === userId) {
      return { ...player, score: (player.score += score) };
    }
    return player;
  });
  socketGamesInfo[gameId] = {
    ...socketGamesInfo[gameId],
    players: newPlayers,
  };
  console.log("점수 업데이트 후 게임 정보 ", gameInfo);
};

// 참가중인 게임 정보에서 현재 참가자 조회 (socketGamesInfo)
exports.getParticipants = (gameId) => {
  const gameInfo = exports.getGameInfoByGameId(gameId);
  const participants = gameInfo.players.map((player) => player);
  console.log("현재 참가자 조회결과는 ", participants);
  return participants;
};

// 참가중인 게임 정보에서 본인 제외 나머지 참가자 조회 (socketGamesInfo)
exports.getRestParticipants = (socketId) => {
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  const gameInfo = exports.getGameInfoByGameId(userInfo.gameId);
  return gameInfo.players.filter((player) => player.userId !== userInfo.userId);
};

// 참가중인 게임 정보에서 유저가 해당방에 참가중인지 확인 (socketGamesInfo)
exports.isUserInGame = (gameId, userId) => {
  const gameInfo = exports.getGameInfoByGameId(gameId);
  return gameInfo.players.some((player) => player.userId === userId);
};

// 유저 참가중인 게임방의 gameId 조회
exports.getGameIdFromGameInfo = (userId) => {
  for (let gameId in socketGamesInfo) {
    const game = socketGamesInfo[gameId];

    const isUserExist = game.players.some((player) => {
      return player.userId === userId;
    });
    console.log("유저가 있나요?", isUserExist);
    if (isUserExist) {
      return Number(gameId);
    } else {
      return null;
    }
  }
};

// 게임 정보에서 전체 유저가 ready인지 확인 (socketGamesInfo)
exports.checkAllReady = (gameId) => {
  const participant = exports.getParticipants(gameId);
  return participant.every((playerInfo) => playerInfo.ready === true);
};

// 게임 정보에서 manager 유저 변경 (socketGamesInfo)
exports.changeManagerInGame = (gameId, newManagerId) => {
  // 방장으로 바뀐 유저는 ready 값을 true로 변경
  const changedPlayer = socketGamesInfo[gameId].players.map((player) => {
    if (player.userId === newManagerId) {
      return {
        ...player,
        ready: true,
      };
    }
    return player;
  });
  console.log("방장 변경후 ready 상태 변경한 플레이어들", changedPlayer);
  socketGamesInfo[gameId] = {
    ...socketGamesInfo[gameId],
    manager: newManagerId,
    players: changedPlayer,
  };
};

// 게임 정보에서 게임방 정보 삭제 (socketGamesInfo)
exports.deleteGameFromGamesInfo = (gameId) => {
  if (socketGamesInfo[gameId]) {
    delete socketGamesInfo[gameId];
  }
};

exports.deletePlayerFromGamesInfo = (socketId) => {
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  if (socketGamesInfo[userInfo.gameId]) {
    const changedPlayer = socketGamesInfo[userInfo.gameId].players.filter(
      (player) => player.userId !== userInfo.userId,
    );
    socketGamesInfo[userInfo.gameId] = {
      ...socketGamesInfo[userInfo.gameId],
      players: changedPlayer,
    };
  }
};

// socketGamesInfo 게임진행정보에서 isGameEnd를 true로 종료처리
exports.setGameEnd = (socketId) => {
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  const gameInfo = exports.getGameInfoByGameId(userInfo.gameId);
  socketGamesInfo[userInfo.gameId] = {
    ...socketGamesInfo[userInfo.gameId],
    isGameEnd: true,
  };
};

// socketGamesInfo 게임진행정보에서 사용자의 ready상태 토글
exports.toggleReadyGamesInfo = (gameId, userId) => {
  const gameInfo = socketGamesInfo[gameId];
  if (gameInfo) {
    const changedPlayerInfo = gameInfo.players.map((player) => {
      if (player.userId === userId) {
        return { ...player, ready: !player.ready };
      }
      return player;
    });
    gameInfo.players = [...changedPlayerInfo];
  }
};

// 게임 시작시 게임방 설정값 세팅 변경
exports.setGameFromGamesInfo = ({
  gameId,
  newCurrentTurnUserId,
  newMaxRound,
  newCurrentRound,
  newKeywords,
  newCurrentRoundKeyword,
  newIsWaiting,
  newIsAnswerFound,
  newIsNextRoundSettled,
  newIsGameEnd,
}) => {
  const gameInfo = socketGamesInfo[gameId];
  if (gameInfo) {
    socketGamesInfo[gameId] = {
      ...socketGamesInfo[gameId],
      ...(newCurrentRound !== undefined && { currentRound: newCurrentRound }),
      ...(newCurrentTurnUserId !== undefined && {
        currentTurnUserId: newCurrentTurnUserId,
      }),
      ...(newMaxRound !== undefined && { maxRound: newMaxRound }),
      ...(newKeywords !== undefined && { keywords: newKeywords }),
      ...(newCurrentRoundKeyword !== undefined && {
        currentRoundKeyword: newCurrentRoundKeyword,
      }),
      ...(newIsWaiting !== undefined && { isWaiting: newIsWaiting }),
      ...(newIsAnswerFound !== undefined && { isAnswerFound: newIsAnswerFound }),
      ...(newIsNextRoundSettled !== undefined && {
        isNextRoundSettled: newIsNextRoundSettled,
      }),
      ...(newIsGameEnd !== undefined && {
        isGameEnd: newIsGameEnd,
      }),
    };
    console.log("게임 정보 세팅후 ", socketGamesInfo[gameId]);
  }
};

// 방장 변경
exports.changeManagerOnLeave = async (nextUserId, gameId, transaction) => {
  if (!nextUserId) {
    // 방장 혼자 있을때
    await exports.updateGameRoom(gameId, { is_waiting: 0 }, transaction);

    return { newManagerId: null };
  } else {
    // 남은 유저가 있을때
    await exports.updateGameRoom(
      gameId,
      {
        manager: nextUserId,
      },
      transaction,
    );
    return { newManagerId: nextUserId };
  }
};

// 유저 별 score 점수 합산 update
exports.setPlayersScore = async (playersInfo, transaction) => {
  const updatePromises = playersInfo.map((player) => {
    return db.User.update(
      {
        user_score: db.Sequelize.literal(`user_score + ${player.score}`),
      },
      { where: { user_id: player.userId }, transaction: transaction },
    );
  });
  // 전체 쿼리 동시에 실행
  await Promise.all(updatePromises);
};

// 처음 소켓 연결시 db의 방 정보(is_waiting === true) 메모리에 저장 (socketGameInfo)
exports.syncGameInfoFromDB = async () => {
  const gameFindResult = await db.Game.findAll({
    where: {
      is_waiting: 1,
    },
  });
  console.log("찾은 게임방 결과", gameFindResult);

  // 게임 방 추가하기 (socketGamesInfo)
  gameFindResult.forEach((game) => {
    const { game_id, name, manager, is_lock, pw, round, is_waiting } = game;

    socketGamesInfo[game_id] = {
      name,
      currentTurnUserId: null,
      currentRound: null,
      maxRound: round,
      isLock: is_lock,
      pw,
      manager,
      isWaiting: is_waiting,
      keywords: null,
      currentRoundKeyword: null,
      isAnswerFound: null,
      isNextRoundSettled: null,
      isGameEnd: null,
      // 참여했던 유저들 그대로 포함시킬지?
      players: [],
    };
  });

  console.log("찾은 게임방 결과", gameFindResult.length);
  console.log("gameInfo 조회", socketGamesInfo);
};

// db에 game, player_group 테이블 정보 gameInfo로 복구
exports.syncGameInfoWithPlayersFromDB = async () => {
  const gameFindResult = await db.Game.findAll({
    where: {
      is_waiting: 1,
    },
    include: [
      {
        model: db.PlayerGroup,
        include: [{ model: db.User, include: [{ model: db.Region }] }],
      },
    ],
  });
  const gameInfo = gameFindResult.map((gameResult) => {
    return gameResult.get({ plain: true });
  });
  console.log("한번에 가져오기", gameInfo[0].playerGroups[0]);

  // 게임 방 추가하기 (socketGamesInfo)
  gameInfo.forEach((game) => {
    const { game_id, name, manager, is_lock, pw, round, is_waiting } = game;
    const players = game.playerGroups.map((player) => {
      return {
        userId: player.user.user_id,
        nickname: player.user.nickname,
        score: 0,
        ready: manager === player.user.userId ? true : false,
        character: player.user.character,
        region: player.user.region.region,
      };
    });
    // 게임방에 참여 유저 추가하기 (socketGameInfo)
    socketGamesInfo[game_id] = {
      name,
      currentTurnUserId: null,
      currentRound: null,
      maxRound: round,
      isLock: is_lock,
      pw,
      manager,
      isWaiting: is_waiting,
      keywords: null,
      currentRoundKeyword: null,
      isAnswerFound: null,
      isNextRoundSettled: null,
      isGameEnd: null,
      players: [...players],
    };
  });
  console.log("찾은 게임방 결과", gameFindResult.length);
  console.log("gameInfo 조회", socketGamesInfo);
  console.log("gameInfo 조회", socketGamesInfo[1].players);
};

// 서버 재실행되는 경우 is_waiting===true 대기중인 방을 완료처리
exports.expireGameFromDB = async () => {
  const gameFindResult = await db.Game.update(
    {
      is_waiting: 0,
    },
    {
      where: { is_waiting: 1 },
    },
  );
  socketGamesInfo;
  console.log("방 만료처리 결과는 ", gameFindResult);
};

// 랜덤 키워드 가져오기
exports.getRandomKeywords = async (count) => {
  const keywordsResult = await db.Keyword.findAll({
    order: db.sequelize.random(),
    limit: count,
  });
  if (keywordsResult.length < count)
    throw new Error(
      `keyword 요청 갯수 : ${count}개, 조회 갯수 : ${keywordsResult.length}`,
    );
  return keywordsResult.map((keyword) => {
    return keyword.keyword;
  });
};

// 현재 라운드 종료 처리 (게임x)
exports.finishCurrentRound = (gameId) => {
  const gameInfo = socketGamesInfo[gameId];
  const newGameInfo = { ...gameInfo, isAnswerFound: true, isNextRoundSettled: false };
  socketGamesInfo[gameId] = newGameInfo;
};

// 턴 순서인 유저에게만 키워드 포함시켜서 응답처리
exports.emitRoundStartWithTurn = (io, socketId, eventName) => {
  if (!io) {
    console.error("io 객체가 없습니다.");
    return;
  }
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  if (!userInfo) {
    console.error("조회하려는 userInfo가 없습니다.");
    throw new Error("조회하려는 userInfo가 없습니다.");
  }
  const gameInfo = exports.getGameInfoByGameId(userInfo.gameId);
  if (!gameInfo) {
    console.error("조회하려는 gameInfo가 없습니다.");
    throw new Error("조회하려는 gameInfo가 없습니다.");
  }

  const clients = io.of("/game").adapter.rooms.get(userInfo.gameId);
  console.log("현재 게임정보는 ", gameInfo);
  if (clients) {
    clients.forEach((socketId) => {
      const playerSocket = io.of("/game").sockets.get(socketId);
      if (!playerSocket) {
        console.log("playerSocket이 없습니다.");
        return;
      }
      const isTurn =
        exports.getPlayerFromUsersInfo(playerSocket.id).userId ===
        gameInfo.currentTurnUserId;
      console.log("isTurn순서는", isTurn);
      console.log(
        "참여자 유저아이디는",
        exports.getPlayerFromUsersInfo(playerSocket.id).userId,
      );
      console.log("게임정보의 현재턴유저아이디는", gameInfo.currentTurnUserId);
      const roundStartRes = exports.getRoundStartRes(socketId, isTurn);
      // playerSocket.emit("startGame", roundStartRes);
      playerSocket.emit(eventName, roundStartRes);
    });
  }
};

// ############################################################################################################
// error 응답
exports.getErrorRes = (socketId, message) => {
  if (!socketId) {
    console.error("보내려는 socketId가 없습니다.");
    throw new Error("보내려는 socketId가 없습니다.");
  }
  if (!message) {
    console.error("보내려는 error message가 없습니다.");
    throw new Error("보내려는 error message가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  return {
    type: "ERROR",
    message: message,
    data: {
      userId: userInfo.userId || null,
      gameId: userInfo.gameId || null,
    },
  };
};

// 성공 응답
exports.successRes = (socketId, message) => {
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  const gameInfo = exports.getGameInfoByGameId(userInfo.gameId);
  return {
    type: "SUCCESS",
    message: message,
    data: {
      userId: userInfo.userId || null,
      gameId: userInfo.gameId || null,
    },
  };
};

// joinGame 성공 응답
exports.getJoinRes = (socketId, message) => {
  return exports.successRes(socketId, message);
};

// leaveGame 성공 응답
exports.getLeaveRes = (socketId, message) => {
  return exports.successRes(socketId, message);
};

// endGame 성공 응답
exports.getEndGameRes = (socketId) => {
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  const gameInfo = exports.getGameInfoByGameId(userInfo.gameId);
  return {
    type: "SUCCESS",
    message: "게임 종료",
    gameId: userInfo.gameId,
  };
};

// gameMessage 성공 응답
exports.getGameMessageRes = (socketId, gameMessage) => {
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  if (!gameMessage) {
    console.error("응답하려는 gameMessage가 없습니다.");
    throw new Error("응답하려는 gameMessage가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  return {
    type: "SUCCESS",
    message: "메세지 전송",
    senderId: userInfo.userId,
    senderNick: userInfo.nickname,
    gameMessage: gameMessage,
  };
};

// endRound 성공 응답
exports.getEndRoundRes = (socketId) => {
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  const gameInfo = exports.getGameInfoByGameId(userInfo.gameId);
  return {
    type: "SUCCESS",
    message: "라운드 종료",
    gameId: gameInfo.gameId,
    data: {
      correctUserId: userInfo.userId,
      answerKeyword: gameInfo.currentRoundKeyword,
    },
  };
};

// updatePlayers 성공 응답
exports.getUpdateGameInfoRes = (socketId) => {
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  const gameInfo = exports.getGameInfoByGameId(userInfo.gameId);
  return {
    type: "SUCCESS",
    message: `게임 정보`,
    data: {
      gameId: userInfo.gameId || null,
      gameName: gameInfo.name || null,
      managerId: gameInfo.manager || null,
      currentTurnUserId: gameInfo.currentTurnUserId || null,
      maxRound: gameInfo.maxRound || null,
      currentRound: gameInfo.currentRound || null,
      isAnswerFound: gameInfo.isAnswerFound === undefined ? null : gameInfo.isAnswerFound,
      players: gameInfo.players || null,
    },
  };
};

// readyGame 성공 응답
exports.getReadyRes = (socketId) => {
  const userInfo = socketUsersInfo[socketId];
  const isAllReady = exports.checkAllReady(userInfo.gameId);
  return {
    type: "SUCCESS",
    message: "게임 준비",
    gameId: userInfo.gameId || null,
    userId: userInfo.userId || null,
    data: { isAllReady: isAllReady },
  };
};

// startGame 성공 응답
exports.getRoundStartRes = (socketId, isTurn) => {
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);
  const gameInfo = exports.getGameInfoByGameId(userInfo.gameId);
  if (isTurn === undefined || isTurn === null) {
    console.error("isTurn 순서가 없습니다.");
    throw new Error("isTurn 순서가 없습니다.");
  }

  return {
    type: "SUCCESS",
    message: "라운드 정보",
    data: {
      currentTurnUserId: gameInfo.currentTurnUserId,
      maxRound: gameInfo.maxRound,
      currentRound: gameInfo.currentRound,
      isGameEnd: gameInfo.isGameEnd,
      ...(isTurn && { keyword: gameInfo.keywords[gameInfo.currentRound - 1] }), // 현재 턴 유저에게만 키워드 포함
    },
  };
};

// drawCanvas 성공 응답
exports.getDrawRes = (socketId, drawData) => {
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);

  return {
    type: "SUCCESS",
    message: "그림 그리기",
    gameId: userInfo.gameId || null,
    drawUserId: userInfo.userId || null,
    data: drawData,
  };
};

// clearCanvas 성공 응답
exports.getClearRes = (socketId) => {
  if (!socketId) {
    console.error("조회하려는 socketId가 없습니다.");
    throw new Error("조회하려는 socketId가 없습니다.");
  }
  const userInfo = exports.getPlayerFromUsersInfo(socketId);

  return {
    type: "SUCCESS",
    message: "그림 지우기",
    gameId: userInfo.gameId || null,
    drawUserId: userInfo.userId || null,
  };
};
