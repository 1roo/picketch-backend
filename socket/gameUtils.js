const db = require("../models");
const { socketGamesInfo, socketUsersInfo } = require("./gameStore");

// 현재 만들어져있는 방 여부 확인
exports.getGameRoom = async (gameId, isFinish, transaction) => {
  console.log("isActive는", isFinish);
  const game = await db.Game.findOne({
    where: {
      game_Id: gameId,
      is_finish: Number(isFinish),
    },
    transaction,
  });
  return game;
};

// 유저가 방에 참가중인지 확인
exports.checkValidRoom = async (gameId, userId, transaction) => {
  const checkResult = await db.PlayerGroup.findOne({
    where: {
      game_id: gameId,
      user_id: userId,
    },
  });

  return checkResult;
};

// 방장 변경( 방장이 아닌 유저가 퇴장할 경우)
exports.updateGameRoom = async (gameId, changeValue, transaction) => {
  console.log("changeValue는", changeValue);
  const updateResult = await db.Game.update(changeValue, {
    where: { game_id: gameId, is_finish: 0 },
    transaction,
  });
  return updateResult;
};

// 유저 방에 참가 처리
exports.addUserToGameRoom = async (gameId, userId, transaction) => {
  const addResult = await db.PlayerGroup.create(
    {
      game_id: gameId,
      user_id: userId,
    },
    { transaction: transaction },
  );
  return { addResult };
};

// 유저가 참여중인 방 정보 db에서 삭제
exports.deleteEnterRoomFromDB = async (gameId, userId, transaction) => {
  const destroyResult = await db.PlayerGroup.destroy({
    where: {
      game_id: gameId,
      user_id: userId,
    },
    transaction,
  });
  console.log("삭제결과는", destroyResult);
  return { destroyResult };
};

// 남은 참가자 조회
exports.getRestParticipants = async (game, transaction) => {
  const currentPlayersResult = await db.PlayerGroup.findAll({
    where: {
      game_id: game.game_id,
    },
    include: [{ model: db.User, attribute: ["user_id", "nickname"] }],
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
    };
  });
};

// socketUserInfo 유저 정보 넣기
exports.editPlayerToUsersInfo = (socketId, userId, nickname, gameId) => {
  if (!socketUsersInfo[socketId]) {
    socketUsersInfo[socketId] = {};
  }
  if (userId !== undefined) {
    socketUsersInfo[socketId].userId = userId;
  }
  if (nickname !== undefined) {
    socketUsersInfo[socketId].nickname = nickname;
  }
  if (gameId !== undefined) {
    socketUsersInfo[socketId].gameId = gameId;
  }
};

// socketUserInfo 유저 정보 조회
exports.getPlayerFromUsersInfo = (socketId) => {
  const { userId, nickname, gameId } = socketUsersInfo[socketId];
  return { userId, nickname, gameId };
};

// socketUserInfo[socket.id] 삭제
exports.deletePlayerUsersInfo = (socketId) => {
  delete socketUsersInfo[socketId];
};

// socketGamesInfo 유저 정보 넣기
exports.addPlayerToGamesInfo = (gameId, userId, nickname, manager) => {
  if (!socketGamesInfo[gameId]) {
    socketGamesInfo[gameId] = {
      currentTurn: 0,
      currentRound: 1,
      limitRound: null,
      players: [],
    };
  }
  console.log("gameInfo 변경할때", socketGamesInfo[gameId]);
  if (socketGamesInfo[gameId]) {
    const isExist = socketGamesInfo[gameId].players.some(
      (player) => player.userId === userId,
    );
    if (!isExist) {
      socketGamesInfo[gameId].players.push({
        userId: userId,
        nickname: nickname,
        score: 0,
        ready: manager === userId ? true : false,
      });
    }
  }
};

// socketGamesInfo 게임진행정보에서 사용자의 ready상태 가져오기
exports.getGamesInfoByGameId = (gameId) => {
  const playersInfo = socketGamesInfo[gameId];
  return playersInfo;
};

// socketGamesInfo[gameID]에서 ready 정보만 가져오기
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
  const playersInfo = socketGamesInfo[gameId];
  if (playersInfo) {
    const changedPlayerInfo = playersInfo.players.map((player) => {
      console.log("플레이어정보는", player);
      if (player.userId === userId) {
        console.log("일치하는 플레이어");
        return { ...player, ready: !player.ready };
      }
      return player;
    });
    console.log("ready 바뀐 값", changedPlayerInfo);
    playersInfo.players = [...changedPlayerInfo];
  }
};

exports.setupGameFromGamesInfo = (gameId) => {};

// socketGamesInfo에서 해당 사용자 정보 삭제
exports.deletePlayerFromGamesInfo = (gameId, userId) => {
  if (socketGamesInfo[gameId]) {
    const changedPlayer = socketGamesInfo[gameId].players.filter(
      (player) => player.userId !== userId,
    );
    socketGamesInfo[gameId] = {
      ...socketGamesInfo[gameId],
      players: changedPlayer,
    };
  }
};

// 방장 변경
exports.changeManagerOnLeave = async (nextUserId, gameId, transaction) => {
  if (!nextUserId) {
    // 방장 혼자 있을때
    await exports.updateGameRoom(gameId, { is_finish: 1 }, transaction);
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
