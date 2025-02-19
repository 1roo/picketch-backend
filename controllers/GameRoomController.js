const db = require("../models");
const { success, databaseError, validationError } = require("../utils/common");

// 임시 user
const user = 1;

// 게임방 리스트 조회
exports.getGameRoom = async (req, res) => {
  try {
    const gameRooms = await db.Game.findAll({
      attributes: [["game_id", "roomId"], ["name", "roomName"], "is_lock"],
    });
    success(res, "Success", { gameRooms });
  } catch (err) {
    databaseError(res, err);
  }
};

// 게임방 생성
exports.addGameRoom = async (req, res) => {
  try {
    const { roomName, round, isLock, pw } = req.body;
    // 유효성 검사
    if (!roomName || !round) return validationError(res, "필수 값 누락");
    const duplicateRoomName = await db.Game.findOne({
      where: { name: roomName },
    });
    if (duplicateRoomName) return validationError(res, "중복된 방이름입니다.");

    await db.Game.create({
      name: roomName,
      // manager:토큰 헤더
      manager: 3,
      round,
      is_lock: true,
      pw: isLock ? pw : null,
    });
    success(res);
  } catch (err) {
    databaseError(res, err);
  }
};

// 게임방 삭제
exports.deleteGameRoom = async (req, res) => {
  try {
    const { room_id } = req.params;
    if (!user) {
      // throwError("VF", 400, "유효하지 않은 유저 ID입니다.");
      return invalidRefreshToken(res, "유효하지 않은 유저 ID입니다.");
    }
    const deleteRoom = await db.Game.destroy({
      where: {
        game_id: room_id,
      },
    });
    if (deleteRoom === 0) {
      // throwError("DBE", 500, "삭제할 방이 없습니다.");
      return databaseError(res, "삭제할 방이 없습니다.");
    }

    // sendResponse(res, "SU", 200, "친구 삭제 성공");
    success(res);
  } catch (err) {
    databaseError(res, err);
  }
};
