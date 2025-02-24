const db = require("../models");
const {
  success,
  databaseError,
  validationError,
  validationErrorWithMessage,
} = require("../utils/common");

// 게임방 리스트 조회
exports.getGameRoom = async (req, res) => {
  try {
    const waitingRooms = await db.Game.findAll({
      attributes: [
        ["game_id", "roomId"],
        ["name", "roomName"],
        "is_lock",
        "pw",
        [
          db.sequelize.literal(`(
            SELECT COUNT(*)
            FROM player_group
            WHERE player_group.game_id = Game.game_id
          )`),
          "playerCount",
        ],
      ],
      where: { is_waiting: true },
    });
    success(res, "Success", { waitingRooms });
  } catch (err) {
    databaseError(res, err);
  }
};

// 게임방 생성
exports.addGameRoom = async (req, res) => {
  try {
    // const user = req.user.user_id;
    const user = 1;

    // is_waiting 빼기 나중에
    const { roomName, round, isLock, pw, is_waiting } = req.body;
    // 유효성 검사
    if (!roomName || !round || !isLock)
      return validationErrorWithMessage(res, "필수 값 누락");
    if (isLock && !pw)
      return validationErrorWithMessage(res, "잠금 설정 시 비밀번호 필수");

    const duplicateRoomName = await db.Game.findOne({
      where: { name: roomName },
    });
    if (duplicateRoomName) return validationErrorWithMessage(res, "방이름 중복");

    const createGame = await db.Game.create({
      name: roomName,
      manager: user,
      round,
      is_lock: isLock,
      pw: isLock ? pw : null,
      is_waiting: is_waiting ? is_waiting : true,
    });
    await db.PlayerGroup.create({
      game_id: createGame.game_id,
      user_id: user,
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
