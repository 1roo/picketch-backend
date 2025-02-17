const db = require("../models");

// 현재 진행중인 방 찾기
exports.getActiveRoom = async (roomName, transaction) => {
  const room = await db.Game.findOne({
    where: {
      name: roomName,
      is_finish: 0,
    },
    transaction,
  });
  console.log("찾은 게임아이디", room.game_id);
  return { room };
};

// 유저가 방에 참가중인지 확인
exports.checkValidRoom = async (gameId, userId, transaction) => {
  const checkResult = await db.PlayerGroup.findOne({
    where: {
      game_id: gameId,
      user_id: userId,
    },
  });

  return { checkResult };
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
exports.getRestParticipants = async (room, transaction) => {
  const currentPlayersResult = await db.PlayerGroup.findAll({
    where: {
      game_id: room.game_id,
    },
    include: [{ model: db.User, attribute: ["user_id", "nickname"] }],
    raw: false,
    transaction,
  });
  return { currentPlayersResult };
};
