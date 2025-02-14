const db = require("../models");

const sendResponse = (res, status, message, data = null) => {
  const resBody = {
    code: status === 200 ? "SU" : false,
    message: message,
  };

  if (status === 200 && data !== null) {
    resBody.data = data;
  }

  res.status(status).json(resBody);
};

exports.randomKeywords = {};

// 키워드 랜덤으로 추출하기
// 같은 방id 기준 동일한 랜덤 키워드 응답
exports.getRandomKeyword = async (req, res) => {
  const count = Number(req.query.count);
  const roomId = req.query.roomId;
  const randomKeywords = exports.randomKeywords;

  try {
    if (!roomId) {
      const message = "roomId가 필요합니다.";
      return sendResponse(res, 400, message);
    }

    if (isNaN(count) || count < 1) {
      const message = "유효하지 않은 숫자입니다.";
      return sendResponse(res, 400, message);
    }

    if (randomKeywords[roomId]) {
      console.log("실행");
      const message = `키워드 ${randomKeywords[roomId].length}개 조회 성공`;
      return sendResponse(res, 200, message, randomKeywords[roomId]);
    }

    const result = await db.Keyword.findAll({
      order: db.sequelize.random(),
      limit: count,
    });

    const keywords = result.map((element) => element.dataValues);
    const message = `키워드 ${keywords.length}개 조회 성공`;
    randomKeywords[roomId] = keywords;

    sendResponse(res, 200, message, keywords);
  } catch (err) {
    sendResponse(res, 500, "서버 에러");
  }
};

// 최종 점수 db 저장
exports.setFinalScore = async (req, res) => {
  const { roomId, playerNick, score } = req.body;

  const transaction = await db.sequelize.transaction();
  try {
    // 유저 조회 with 지역
    const userWithRegion = await db.User.findOne({
      where: {
        nickname: playerNick,
      },
      include: {
        model: db.Region,
        required: true,
        attributes: ["region_id", "score"],
      },
      transaction: transaction,
    });

    if (!userWithRegion) {
      throw new Error("해당 유저 조회 불가.");
    }

    const regionId = userWithRegion.Region.region_id;

    // 유저 해당 지역별 score 점수 합산 update
    const userScoreUpdate = await db.User.update(
      {
        score: db.Sequelize.literal(`score + ${score}`),
      },
      { where: { nickname: playerNick }, transaction: transaction },
    );

    // 유저 해당 지역별 score 점수 합산 update
    const regionScoreUpdate = await db.Region.update(
      {
        score: db.Sequelize.literal(`score + ${score}`),
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
    sendResponse(res, 200, message);
  } catch (err) {
    await transaction.rollback();
    console.log(err.message);
    sendResponse(res, 500, err.message);
  }
};
