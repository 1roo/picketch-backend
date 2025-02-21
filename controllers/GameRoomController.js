const db = require("../models");
const { success, databaseError, validationError } = require("../utils/common");

// 게임방 리스트 조회
exports.getGameRoom = async (req, res) => {
  try {
    const gameRooms = await db.Game.findAll({
      attributes: [["game_id", "roomId"], ["name", "roomName"], "is_lock", "pw"],
      where: { is_waiting: true },
    });
    success(res, "Success", { gameRooms });
  } catch (err) {
    databaseError(res, err);
  }
};

// 게임방 생성
exports.addGameRoom = async (req, res) => {
  try {
    const user = req.user.user_id;
    // is_waiting 빼기 나중에
    const { roomName, round, isLock, pw, is_waiting } = req.body;
    // 유효성 검사
    if (!roomName || !round || !isLock) return validationError(res, "필수 값 누락");

    const duplicateRoomName = await db.Game.findOne({
      where: { name: roomName },
    });
    if (duplicateRoomName) return validationError(res, "중복된 방이름입니다.");

    await db.Game.create({
      name: roomName,
      manager: user,
      round,
      is_lock: isLock,
      pw: isLock ? pw : null,
      is_waiting: is_waiting ? is_waiting : true,
    });
    success(res);
  } catch (err) {
    databaseError(res, err);
  }
};

// 게임방 삭제
exports.deleteGameRoom = async (req, res) => {
  try {
    const room_id = Number(req.params.room_id);
    const deleteRoom = await db.Game.destroy({
      where: {
        game_id: room_id,
      },
    });
    if (deleteRoom === 0) {
      return databaseError(res, "삭제할 방이 없습니다.");
    }

    success(res);
  } catch (err) {
    databaseError(res, err);
  }
};
