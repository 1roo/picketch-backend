const db = require("../models");

const sendResponse = (res, code, status, message, data = null) => {
  const resBody = {
    code: code || "UN",
    message: message,
  };

  if (status === 200 && data !== null) {
    resBody.data = data;
  }

  res.status(status).json(resBody);
};

const throwError = (code, status, message) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  throw error;
};

// {roomName : [keyword,...]}
exports.randomKeywords = {};

// 키워드 랜덤으로 추출하기

// 같은 방id 기준 동일한 랜덤 키워드 응답
exports.getRandomKeyword = async (req, res) => {
  const count = Number(req.query.count);
  const { roomName } = req.query;
  const randomKeywords = exports.randomKeywords;

  try {
    // 유효성 검사
    if (isNaN(count) || count < 1) {
      throwError("VF", 400, "유효하지 않은 숫자입니다.");
    }

    // 방 존재 여부 확인
    const room = await db.Game.findOne({
      where: {
        name: roomName,
        is_finish: false,
      },
    });

    if (!roomName || !room) {
      throwError("VF", 400, "방이 유효하지 않습니다.");
    }

    // 같은방에 생성된 랜덤 키워드가 있는 경우
    if (randomKeywords[roomName]) {
      const message = `키워드 ${randomKeywords[roomName].length}개 조회 성공`;
      return sendResponse(res, "SU", 200, message, randomKeywords[roomName]);
    }

    // 같은방에 생성된 랜덤 키워드가 없는 경우
    const result = await db.Keyword.findAll({
      order: db.sequelize.random(),
      limit: count,
    });

    const keywords = result.map((element) => element.dataValues);
    const message = `키워드 ${keywords.length}개 조회 성공`;
    randomKeywords[roomName] = keywords;
    sendResponse(res, "SU", 200, message, keywords);
  } catch (err) {
    console.log(err);
    sendResponse(res, err.code, err.status, err.message);
  }
};

// 최종 점수 db 저장
exports.setFinalScore = async (req, res) => {
  const { roomName, playerNick } = req.body;
  const score = Number(req.body.score);

  const transaction = await db.sequelize.transaction();
  try {
    if (isNaN(score)) {
      throwError("VF", 400, "유효한 점수값이 아닙니다.");
    }
    // 유저 조회 with 지역
    const userWithRegion = await db.User.findOne({
      where: {
        nickname: playerNick,
      },
      include: {
        model: db.Region,
        required: true,
        attributes: ["region_id", "region_score"],
      },
      transaction: transaction,
    });

    if (!userWithRegion) {
      throwError("VF", 400, "해당 유저 조회 불가.");
    }

    const regionId = userWithRegion.region.get("region_id");

    // 유저 해당 지역별 score 점수 합산 update
    const userScoreUpdate = await db.User.update(
      {
        user_score: db.Sequelize.literal(`user_score + ${score}`),
      },
      { where: { nickname: playerNick }, transaction: transaction },
    );

    // 유저 해당 지역별 score 점수 합산 update
    const regionScoreUpdate = await db.Region.update(
      {
        region_score: db.Sequelize.literal(`region_score + ${score}`),
      },
      {
        where: {
          region_id: regionId,
        },
        transaction: transaction,
      },
    );

    await transaction.commit();
    const message = "점수 업데이트 성공";
    sendResponse(res, "SU", 200, message);
  } catch (err) {
    console.log(err);
    await transaction.rollback();
    sendResponse(res, err.code, err.status, err.message);
  }
};

exports.enterRoom = async (req, res) => {
  const { roomId, inputPw } = req.params;
  console.log("실행", roomId, inputPw);

  const transaction = await db.sequelize.transaction();

  try {
    const RoomResult = await db.Game.findOne({
      where: {
        name: roomId,
      },
      transaction: transaction,
    });

    // 존재하지 않는 방일때
    if (!RoomResult) {
      await transaction.commit();
      return res.status(400).json("존재하지 않는 방id입니다.");
    }

    // 게임방 정원확인
    const { game_id, name, manager, is_lock, pw, round } = RoomResult;
    console.log("findRoomResult", game_id, name, manager, is_lock, pw, round);
    const currentPlayersResult = await db.PlayerGroup.findAll({
      where: {
        game_id: game_id,
      },
      raw: true,
      transaction: transaction,
    });
    const userCount = currentPlayersResult.length;
    console.log("유저카운트는", userCount);

    if (userCount >= 8) {
      await transaction.commit();
      return res.json("입장 인원 수 초과");
    }

    if (is_lock && inputPw !== pw) {
      await transaction.commit();
      return res.json("비밀번호가 일치하지 않습니다.");
    }

    // 입장된 유저 컬럼 생성
    await db.PlayerGroup.create(
      {
        game_id: game_id,
        user_id: 55,
      },
      { transaction: transaction },
    );

    await transaction.commit();
    res.json("입장 성공");
  } catch (err) {
    await transaction.rollback();
    console.log(err.message);
    sendResponse(res, 500, err.message);
  }
};
