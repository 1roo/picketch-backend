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

// 키워드 랜덤으로 추출하기
exports.getRandomKeyword = async (req, res) => {
  const { gameId } = req.query;

  try {
    // 유효성 검사
    if (typeof gameId !== "number") {
      throwError("VF", 400, "유효하지 않은 숫자입니다.");
    }

    // 해당방에 유저가 존재하는지 여부 확인

    if (!roomName || !room) {
      throwError("VF", 400, "방이 유효하지 않습니다.");
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
  const { gameId, userId } = req.body;
  const score = Number(req.body.score);

  const transaction = await db.sequelize.transaction();
  try {
    if (isNaN(score)) {
      throwError("VF", 400, "유효한 점수값이 아닙니다.");
    }
    // 유저 조회 with 지역
    const userWithRegion = await db.User.findOne({
      where: {
        user_id: userId,
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

    // 유저 별 score 점수 합산 update
    const userScoreUpdate = await db.User.update(
      {
        user_score: db.Sequelize.literal(`user_score + ${score}`),
      },
      { where: { user_id: userId }, transaction: transaction },
    );

    // 유저 지역별 score 점수 합산 update
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
