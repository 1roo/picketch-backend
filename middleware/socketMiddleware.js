const db = require("../models");
const {
  getGameInfoByGameId,
  getGameIdFromGameInfo,
} = require("../socket/game/gameUtils");

exports.authSocketMiddleware = async (socket, next) => {
  try {
    const query = socket.handshake.query;
    const userId = Number(query.userId);
    console.log("소켓연결전 쿼리에 담긴 유저 아이디는 ", userId);

    if (isNaN(userId)) throw new Error("유효하지 않은 userId입니다");

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
    const gameId = getGameIdFromGameInfo(user_id);
    console.log("찾은 gameId는", gameId);
    socket.userInfo = {
      userId: user_id,
      nickname,
      region,
      character,
      gameId: gameId,
    };
    return next();
  } catch (err) {
    // 에러발생시 클라이언트에서 connect_error 이벤트로 소켓 연결 실패 수신
    console.log(err);
    return next(new Error(err.message));
  }
};
