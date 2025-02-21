const db = require("../models");
const { socketGamesInfo, socketUsersInfo } = require("./gameStore");

// 현재 만들어져있는 방 여부 확인 db
exports.getGameRoom = async (gameId, is_waiting, transaction) => {
  console.log("isActive는", is_waiting);
  const game = await db.Game.findOne({
    where: {
      game_id: gameId,
      is_waiting: Number(!is_waiting),
    },
    transaction,
  });
  return game;
};

// 유저가 방에 참가중인지 확인 db
exports.checkValidRoom = async (gameId, userId, transaction) => {
  const checkResult = await db.PlayerGroup.findOne({
    where: {
      game_id: gameId,
      user_id: userId,
    },
  });

  return checkResult;
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

// 남은 참가자 조회 db
exports.getRestParticipants = async (game, transaction) => {
  const currentPlayersResult = await db.PlayerGroup.findAll({
    where: {
      game_id: game.game_id,
    },
    include: [
      {
        model: db.User,
        attributes: ["user_id", "nickname", "character", "region_id", "user_score"],
        include: [{ model: db.Region, attributes: ["region"] }],
      },
    ],
    raw: false,
    transaction,
  });

  return currentPlayersResult;
};

// 모델 인스턴스에서 참가자 정보만 map
exports.formatParticipantData = (playerInstances) => {
  return playerInstances.map((playerInstance) => {
    return {
      participantId: playerInstance.user.user_id,
      participantNick: playerInstance.user.nickname,
      participantProfile: playerInstance.user.character,
      participantRegion: playerInstance.user.region.region,
    };
  });
};

//////////////////////////////////////////////////////

// 유저 정보 조회 (socketUserInfo)
exports.getPlayerFromUsersInfo = (socketId) => {
  const playerInfo = socketUsersInfo[socketId];
  console.log("안에서", socketUsersInfo[socketId]);
  if (!playerInfo) throw new Error("사용자를 찾을 수 없습니다.");
  console.log(playerInfo);
  return {
    userId: playerInfo.userId,
    nickname: playerInfo.nickname,
    gameId: playerInfo.gameId,
  };
};

// 유저 정보 추가 (socketUserInfo)
exports.addPlayerToUsersInfo = (
  { userId, nickname, region, character, gameId: joinGameId },
  socketId,
  gameId,
) => {
  if (!socketUsersInfo[socketId]) {
    socketUsersInfo[socketId] = {};
  }
  if (userId !== undefined) {
    socketUsersInfo[socketId].userId = userId;
  }
  if (nickname !== undefined) {
    socketUsersInfo[socketId].nickname = nickname;
  }
  if (region !== undefined) {
    socketUsersInfo[socketId].region = region;
  }
  if (character !== undefined) {
    socketUsersInfo[socketId].character = character;
  }
  if (joinGameId !== undefined) {
    socketUsersInfo[socketId].gameId = joinGameId;
  }
  if (gameId !== undefined) {
    socketUsersInfo[socketId].gameId = gameId;
  }
  console.log("userInfo 변경 후는 ", socketUsersInfo);
};

// 유저 정보 삭제 (socketUserInfo)
exports.deletePlayerUsersInfo = (socketId) => {
  delete socketUsersInfo[socketId];
};

///////////////////////////////////////////////////////////////

// 게임 정보 조회 (socketGamesInfo)
exports.getGameInfoByGameId = (gameId) => {
  const gameInfo = socketGamesInfo[gameId];
  console.log("gameInfo 조회값은 ", gameInfo);
  return gameInfo;
};

// // 게임 방 추가하기 (socketGamesInfo)
// exports.addGameToGameInfo = async(gameId)=>{
//   const gameInfo = {
//     name: "1번째방",
//     currentTurn: 0,
//     currentRound: 1,
//     maxRound: 4,
//     isLock: true,
//     pw: "1234",
//     manager: 1,
//     isWaiting: true,
//     players: [],
//   };
// }

// 게임 정보에 참가자 넣기 (socketGamesInfo)
exports.addPlayerToGamesInfo = (socketId, gameId) => {
  if (!socketGamesInfo[gameId]) {
    socketGamesInfo[gameId] = {
      gameStatus: {
        currentTurnId: 1,
        currentRound: 1,
        maxRound: null,
        isLock: false,
        keyword: "사과",
        pw: "1234",
        manager: 1,
        isWaiting: true,
      },
      players: [],
    };
  }
  const { userId } = exports.getPlayerFromUsersInfo(socketId);
  const isExist = socketGamesInfo[gameId].players.some(
    (player) => player.userId === userId,
  );
  if (!isExist) {
    const { manager } = socketGamesInfo[gameId];
    const { userId, character, region, nickname } = socketUsersInfo[socketId];
    socketGamesInfo[gameId].players.push({
      userId: userId,
      nickname: nickname,
      score: 0,
      ready: manager === userId ? true : false,
      character: character,
      region: region,
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

// 게임 정보에서 현재 참가자 조회 (socketGamesInfo)
exports.getParticipants = (gameId) => {
  const gameInfo = exports.getGameInfoByGameId(gameId);
  const participants = gameInfo.players.map((player) => player);
  console.log("현재 참가자 조회결과는 ", participants);
  return participants;
};
// 유저 소켓연결후는  {
//   WSakYa4D6vKBREXSAAAB: {
//     userId: 4,
//     nickname: '소고기',
//     region: '강북구',
//     character: '디폴트',
//     gameId: 1
//   },
//   WtP94L5WM2YCm7sHAAAD: { userId: 1, nickname: '닭고기', region: '강동구', character: '디폴트' }
// }

// gameInfo 조회값은  {
//   name: '1번째방',
//   currentTurnUserId: 0,
//   currentRound: 1,
//   isAnswerFound : false,
//   maxRound: 5,
//   isLock: true,
//   pw: '1234',
//   manager: 1,
//   isWaiting: true,
//   keyword : "사과"
//   players: [ { userId: 4, nickname: '소고기', score: 0, ready: false } ]
// }
// 게임 정보에서 유저가 해당방에 참가중인지 확인 (socketGamesInfo)
exports.isUserInGame = (gameId, userId) => {
  console.log("isUserInGame안에서 ", gameId, userId);
  const gameInfo = exports.getGameInfoByGameId(gameId);
  return gameInfo.players.some((player) => player.userId === userId);
};

// 게임 정보에서 전체 유저가 ready인지 확인 (socketGamesInfo)
exports.checkAllReady = (gameId) => {
  const participant = exports.getParticipants(gameId);
  return participant.every((playerInfo) => playerInfo.ready === true);
};

// 게임 정보에서 manager 유저 변경 (socketGamesInfo)
exports.changeManagerInGame = (gameId, managerId) => {
  const gameInfo = exports.getGameInfoByGameId(gameId);
  gameInfo.manager = managerId;
};

// 게임 정보에서 게임방 정보 삭제 (socketGamesInfo)
exports.deleteGameFromGamesInfo = (gameId) => {
  if (socketGamesInfo[gameId]) {
    delete socketGamesInfo[gameId];
  }
};

// 게임 정보에서 특정 참가자 정보 삭제 (socketGamesInfo)
exports.deletePlayerFromGamesInfo = (gameId, userId) => {
  if (socketGamesInfo[gameId]) {
    const changedPlayer = socketGamesInfo[gameId].players.filter(
      (player) => player.userId !== userId,
    );
    socketGamesInfo[gameId] = {
      ...socketGamesInfo[gameId],
      players: changedPlayer,
    };
    //02021 테스트
    // socketGamesInfo[gameId].players = changedPlayer;
  }
};
// socketGamesInfo[gameID]에서 ready 정보만 보이도록 formatting
exports.formatReadyData = (playersInfo) => {
  if (playersInfo) {
    const playersReadyInfo = playersInfo.players.map((player) => {
      return {
        userId: player.userId,
        nickname: player.nickname,
        ready: player.ready,
      };
    });
    return playersReadyInfo;
  }
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
    console.log("ready 바뀐 값", changedPlayerInfo);
    gameInfo.players = [...changedPlayerInfo];
  }
};

// 게임 시작시 게임방 설정값 세팅 변경
// spread 대신 직접 값 변경하기 추후에 변경 ######################################
exports.setGameFromGamesInfo = ({
  gameId,
  newCurrentTurnUserId,
  newMaxRound,
  newCurrentRound,
  newKeywords,
}) => {
  const gameInfo = socketGamesInfo[gameId];
  if (gameInfo) {
    socketGamesInfo[gameId] = {
      ...gameInfo,
      ...(newCurrentRound !== undefined && { currentRound: newCurrentRound }),
      ...(newCurrentTurnUserId !== undefined && {
        currentTurnUserId: newCurrentTurnUserId,
      }),
      ...(newMaxRound !== undefined && { maxRound: newMaxRound }),
      ...(newKeywords !== undefined && { keywords: newKeywords }),
      isWaiting: false,
    };

    return socketGamesInfo[gameId];
  }
};

// 방장 변경
exports.changeManagerOnLeave = async (nextUserId, gameId, transaction) => {
  if (!nextUserId) {
    // 방장 혼자 있을때
    await exports.updateGameRoom(gameId, { is_waiting: 0 }, transaction);

    return { newManager: null, gameIsFinish: true };
  } else {
    // 남은 유저가 있을때
    await exports.updateGameRoom(
      gameId,
      {
        manager: nextUserId,
      },
      transaction,
    );
    return { newManager: nextUserId, gameIsFinish: false };
  }
};

// 처음 소켓 연결시 db에서 유저 정보 메모리에 저장 (socketUserInfo)
exports.syncUserInfoFromDB = async (socket, userId) => {
  // user_id값의 실제 유저 존재 여부 확인(토큰 변조)
  const findResult = await db.User.findOne({
    where: {
      user_id: userId,
    },
    attributes: ["user_id", "nickname", "character", "region_id", "user_score"],
    include: [{ model: db.Region, attributes: ["region"] }],
  });
  if (!findResult) throw new Error("존재하지 않는 유저입니다.");
  const { user_id, nickname, character } = findResult;
  const { region } = findResult.region;
  const userInfo = {
    userId: user_id,
    nickname,
    region,
    character,
    gameId: null,
  };

  exports.addPlayerToUsersInfo(userInfo, socket.id);
  console.log("유저 소켓연결후는 ", socketUsersInfo);
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
      currentTurnUserId: 0,
      currentRound: 1,
      maxRound: round,
      isLock: is_lock,
      pw,
      manager,
      isWaiting: is_waiting,
      keywords: null,
      // 참여했던 유저들 그대로 포함시킬지?
      players: [],
    };
  });

  console.log("찾은 게임방 결과", gameFindResult.length);
  console.log("gameInfo 조회", socketGamesInfo);
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
  return keywordsResult.map((keyword) => {
    return keyword.keyword;
  });
};

// 현재 라운드 종료 처리 (게임x)
exports.finishCurrentRound = (gameId) => {
  const gameInfo = socketGamesInfo[gameId];
  const newGameInfo = { ...gameInfo, isAnswerFound: true };
  socketGamesInfo[gameId] = newGameInfo;
};
