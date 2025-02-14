const db = require('../models');

const sendResponse = (res, status, message, data = null) => {
  const resBody = {
    isSuccess: status === 200 ? true : false,
    message: message,
  };

  if (status === 200 && data !== null) {
    resBody.data = data;
  }

  res.status(status).json(resBody);
};

//키워드 랜덤으로 추출하기
exports.getRandomKeyword = async (req, res) => {
  const count = Number(req.params.count);

  if (count < 1) {
    const message = '요청 키워드 수는 1개 이상이어야 합니다.';
    return sendResponse(res, 400, message);
  }

  try {
    // throw new Error('서버에러');
    const result = await db.Keyword.findAll({
      order: db.sequelize.random(),
      limit: count,
    });

    const keywords = result.map((element) => element.dataValues);
    const message = `키워드 ${keywords.length}개 조회 성공`;

    sendResponse(res, 200, message, keywords);
  } catch (err) {
    sendResponse(res, 500, '서버 에러');
  }
};

// 최종 점수 db 저장
exports.setFinalScore = async (res, req) => {
  const { scoreResult } = res.body;
  try {
    // 한번의 db 수정으로 처리
    // User 테이블의 각 유저 score 점수 합산 update
    // 각 유저의 해당 지역별 score 점수 합산 update
    // 응답
    const userScoreUpdate = await db.User.update(
      {
        // 기존 점수에서 합산
        score: db.Sequelize.literal(`score + ${scoreResult.score}`),
      },
      { where: { nickname: scoreResult.playerNick } }
    );
    const regionScoreUpdate = await db.User.update();
  } catch (err) {}
  res.json();
};

// {scoreResult : [
//   {
//     playerNick : string,
//     score : number
//   },
// ]}
