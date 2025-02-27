const db = require("../models");
const {
  success,
  databaseError,
  validationError,
  validationErrorWithMessage,
} = require("../utils/common");

// 게임방 입장 API
exports.joinGameRoom = async (req, res) => {
  console.log("🔄 🔄 🔄 🔄 🔄 🔄 🔄 🔄 🔄 🔄");
  try {
    const { gameId, inputPw, userId } = req.body;
    console.log("입장 api요청시 ", gameId, inputPw, userId);
    if (!userId) {
      return res
        .status(400)
        .json({ code: "ERR_BAD_REQUEST", message: "유효하지 않은 userId입니다" });
    }

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
