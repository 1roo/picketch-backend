const db = require("../models");
const {
  databaseError,
  validationError,
  success,
  invalidRefreshToken,
} = require("../utils/common");
const user = 1;

// 친구 조회
exports.getFriend = async (req, res) => {
  try {
    if (!user) {
      // return throwError("VF", 400, "유효하지 않은 유저 정보입니다.");
      return invalidRefreshToken(res);
    }
    const getFriends = await db.Friend.findAll({
      where: { user_id: user },
      attributes: [
        ["friend_id", "friendId"],
        ["friend_nickname", "friendNickname"],
      ],
    });
    console.log(getFriends);
    success(res, "Success", { friends: getFriends }, 200);
  } catch (err) {
    databaseError(res, err);
  }
};

// 친구 추가
exports.addFriend = async (req, res) => {
  try {
    const { friend_id } = req.params;
    if (!user) {
      // throwError("VF", 400, "유효하지 않은 유저 ID입니다.");
      return invalidRefreshToken(res);
    }

    const friend = await db.User.findOne({
      attributes: ["nickname"],
      where: {
        user_id: friend_id,
      },
    });
    if (!friend) {
      // throwError("VF", 400, "유효하지 않은 친구 ID입니다.");
      return validationError(res);
    }
    await db.Friend.create({
      user_id: user,
      friend_id: friend_id,
      friend_nickname: friend.nickname,
    });
    success(res);
  } catch (err) {
    databaseError(res, err);
  }
};

// 친구 삭제
exports.deleteFriend = async (req, res) => {
  try {
    const { friend_id } = req.params;
    if (!user) {
      // throwError("VF", 400, "유효하지 않은 유저 ID입니다.");
      return invalidRefreshToken(res);
    }
    const deleteFriend = await db.Friend.destroy({
      where: {
        user_id: user,
        friend_id: friend_id,
      },
    });
    if (deleteFriend === 0) {
      // throwError("DBE", 500, "삭제할 친구가 없습니다.");
      return databaseError(res);
    }

    // sendResponse(res, "SU", 200, "친구 삭제 성공");
    success(res);
  } catch (err) {
    databaseError(res, err);
  }
};
