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
    const user = req.user.user_id;
    // const user = 1;
    const { roomName, round, isLock, pw } = req.body;
    console.log(roomName, round, isLock, pw);
    // 유효성 검사
    if (!roomName || !round || isLock === null)
      return validationErrorWithMessage(res, "필수 값 누락");
    if (isLock === true && pw === "")
      return validationErrorWithMessage(res, "잠금 설정 시 비밀번호 필수");

    const duplicateRoomName = await db.Game.findOne({
      where: { name: roomName },
    });
    if (duplicateRoomName) return validationErrorWithMessage(res, "방이름 중복");

    const createGame = await db.Game.create({
      name: roomName,
      manager: user,
      round,
      is_lock: Boolean(isLock),
      pw: isLock ? pw : null,
    });
    // await db.PlayerGroup.create({
    //   game_id: createGame.game_id,
    //   user_id: user,
    // });
    success(res, "Success", { gameId: createGame.game_id });
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

// 게임방 입장 API
exports.joinGameRoom = async (req, res) => {
  try {
    // req.user가 없으면 req.body.userId를 fallback으로 사용
    const userId = req.user?.user_id || req.body.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ code: "ERR_BAD_REQUEST", message: "유효하지 않은 userId입니다" });
    }
    const { gameId, inputPw } = req.body;

    // 게임방 존재 여부 확인
    const game = await db.Game.findOne({ where: { game_id: gameId } });
    if (!game) {
      return validationErrorWithMessage(res, "게임방이 존재하지 않습니다.");
    }

    // 비밀번호 확인 (잠금 방인 경우)
    if (game.is_lock && game.pw !== inputPw) {
      return validationErrorWithMessage(res, "비밀번호가 일치하지 않습니다.");
    }

    // 이미 참가한 경우 확인
    const existingPlayer = await db.PlayerGroup.findOne({
      where: { game_id: gameId, user_id: userId },
    });

    // 수정 : 이미 입장한 경우 성공 응답 반환
    if (existingPlayer) {
      return success(res, "이미 게임방에 입장했습니다.", { gameId });
    }

    // 플레이어 추가
    await db.PlayerGroup.create({ game_id: gameId, user_id: userId });

    return success(res, "게임방 입장 성공", { gameId });
  } catch (err) {
    console.error(err);
    return databaseError(res, err);
  }
};
