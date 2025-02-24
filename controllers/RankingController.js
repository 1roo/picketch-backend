const db = require("../models");
const { success, databaseError } = require("../utils/common");

exports.getRankingUser = async (req, res) => {
  try {
    const userRanking = await db.User.findAll({
      attributes: [["user_id", "userId"], "nickname", ["user_score", "score"]],
      order: [["score", "DESC"]], // 높은 점수 순으로 정렬
    });
    if (!userRanking) {
      databaseError(res, "유저 랭킹 조회 실패");
    }
    // userRanking = [
    //   {
    //   "user_id": 1,
    //   "nickname": "짱구",
    //   "score": 2930
    //   },
    //   {
    //   "user_id": 3,
    //   "nickname": "훈이",
    //   "score": 2905
    //   },
    //   ]

    success(res, "Success", { userRanking });
  } catch (err) {
    databaseError(res, err);
  }
};

exports.getRankingRegion = async (req, res) => {
  try {
    const regionRanking = await db.Region.findAll({
      attributes: ["region", ["region_score", "score"]],
      order: [["region_score", "DESC"]], // 높은 점수 순으로 정렬
    });
    if (!regionRanking) {
      databaseError(res, "지역 랭킹 조회 실패");
    }
    success(res, "Success", { regionRanking });
  } catch (err) {
    databaseError(res, err);
  }
};
