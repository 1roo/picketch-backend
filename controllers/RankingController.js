const db = require("../models");
const { success, databaseError, validationErrorWithMessage } = require("../utils/common");

exports.getRankingUser = async (req, res) => {
  try {
    const userId = 2;
    // const userId=req.user.user_id

    let Ranking = await db.User.findAll({
      attributes: ["user_id", "user_score"],
      order: [["user_score", "DESC"]], // 높은 점수 순으로 정렬
    });
    if (Ranking.length === 0) {
      databaseError(res, "유저 랭킹 조회 실패");
    }
    const totalUsers = Ranking.length;
    const rank = Ranking.findIndex((user) => user.user_id === userId) + 1; // 인덱스는 0부터 시작하므로 1을 더함

    const percentage = ((rank / totalUsers) * 100).toFixed(2);
    console.log(totalUsers, rank, percentage);
    const userRanking = {
      userId,
      percentage,
    };
    success(res, "Success", { userRanking });
  } catch (err) {
    databaseError(res, err);
  }
};

exports.getRankingRegion = async (req, res) => {
  try {
    const userId = 9;
    // const userId=req.user.user_id
    const userInfo = await db.User.findOne({
      attributes: ["user_id", "user_score", "region_id"],
      where: { user_id: userId },
    });
    if (!userInfo) return validationError(res);

    let Ranking = await db.User.findAll({
      attributes: ["user_id", "user_score"],
      where: { region_id: userInfo.region_id },
      order: [["user_score", "DESC"]],
    });
    if (Ranking.length === 0) {
      databaseError(res, "유저 랭킹 조회 실패");
    }
    const totalUsers = Ranking.length;
    const rank = Ranking.findIndex((user) => user.user_id === userId) + 1; // 인덱스는 0부터 시작하므로 1을 더함

    const percentage = ((rank / totalUsers) * 100).toFixed(2);
    console.log(totalUsers, rank, percentage);
    const regionRanking = {
      userId,
      regionId: userInfo.region_id,
      percentage,
    };
    success(res, "Success", { regionRanking });
  } catch (err) {
    databaseError(res, err);
  }
};
