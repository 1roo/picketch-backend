const db = require("../models");
const {
  databaseError,
  validationError,
  success,
  validationErrorWithMessage,
} = require("../utils/common");

// 친구 조회
exports.getFriend = async (req, res) => {
  try {
    const user = req.user.user_id;
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

// 친구 요청
exports.friendRequest = async (req, res) => {
  try {
    const from_user_id = req.user.user_id;
    const user_id = Number(req.params.friend_id);
    const sender = await db.User.findOne({
      where: { user_id: from_user_id },
    });
    // 유효성 검사
    // 1) 이미 친구인 경우
    const is_friend = await db.Friend.findOne({
      where: {
        user_id,
        friend_id: from_user_id,
      },
    });
    if (is_friend) return validationErrorWithMessage(res, "이미 친구");

    // 2) 자기 자신에게 친구 요청할 경우
    if (user_id === from_user_id)
      return validationErrorWithMessage(res, "자기 자신에게 친구 요청 불가");

    // 3) 이미 보낸 요청인 경우
    const existingRequest = await db.Notification.findOne({
      where: {
        from_user_id,
        user_id,
        notification_type: "FRIEND_REQUEST",
        response_status: "PENDING",
      },
    });
    if (existingRequest) {
      return validationErrorWithMessage(res, "이미 보낸 요청");
    }

    // 4) 이미 받은 요청인 경우
    const receiveRequest = await db.Notification.findOne({
      where: {
        user_id: from_user_id,
        from_user_id: user_id,
        notification_type: "FRIEND_REQUEST",
        response_status: "PENDING",
      },
    });
    if (receiveRequest) {
      return validationErrorWithMessage(res, "이미 받은 요청");
    }

    await db.Notification.create({
      user_id,
      from_user_id,
      notification_type: "FRIEND_REQUEST",
      response_status: "PENDING",
      content: `${sender.nickname}님이 친구 요청을 보냈습니다.`,
      requires_response: true,
    });
    success(res, `${sender.nickname}님이 친구 요청을 보냈습니다.`);
  } catch (err) {
    databaseError(res, err);
  }
};

// 친구 요청 수락
exports.acceptFriendRequest = async (req, res) => {
  try {
    const sender_id = Number(req.params.sender_id);
    const user_id = req.user.user_id;

    // 요청 존재 여부 확인
    const request = await db.Notification.findOne({
      where: {
        user_id,
        from_user_id: sender_id,
        notification_type: "FRIEND_REQUEST",
        response_status: "PENDING",
      },
    });
    if (!request) {
      return validationErrorWithMessage(res, "유효하지 않은 친구 요청");
    }

    // 닉네임 가져오기
    const sender = await db.User.findOne({
      attributes: ["nickname"],
      where: { user_id: sender_id },
    });
    const user = await db.User.findOne({
      attributes: ["nickname"],
      where: {
        user_id: user_id,
      },
    });
    if (!user || !sender) {
      return validationErrorWithMessage(res, "유효하지 않은 ID");
    }

    // 친구 추가
    await db.Friend.create({
      user_id,
      friend_id: sender_id,
      friend_nickname: sender.nickname,
    });

    await db.Friend.create({
      user_id: sender_id,
      friend_id: user_id,
      friend_nickname: user.nickname,
    });
    await request.update({ response_status: "ACCEPTED" });
    success(res, `${sender.nickname}님의 친구 요청 ${user.nickname}님이 수락하였습니다.`);
  } catch (err) {
    databaseError(res, err);
  }
};

// 친구 거절
exports.rejectFriendRequest = async (req, res) => {
  try {
    const sender_id = Number(req.params.sender_id);
    const user_id = req.user.user_id;

    // 요청 존재 여부 확인
    const request = await db.Notification.findOne({
      where: {
        user_id,
        from_user_id: sender_id,
        notification_type: "FRIEND_REQUEST",
        response_status: "PENDING",
      },
    });

    if (!request) {
      return validationError(res, "유효하지 않은 친구 요청");
    }
    // 요청 상태 거절로 변경
    await request.update({ response_status: "REJECTED" });

    success(res, `${sender_id}님의 친구 요청 ${user_id}님이 거절하였습니다.`);
  } catch (err) {
    databaseError(res, err);
  }
};

// 친구 삭제
exports.deleteFriend = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const friend_id = Number(req.params.friend_id);
    if (user_id === friend_id) {
      return validationError(res);
    }
    const deleteUserFriend = await db.Friend.destroy({
      where: {
        user_id,
        friend_id,
      },
    });
    const deleteFriendUser = await db.Friend.destroy({
      where: {
        user_id: friend_id,
        friend_id: user_id,
      },
    });
    if (deleteUserFriend === 0 || deleteFriendUser === 0) {
      return databaseError(res);
    }

    success(res, `${user_id}님과 ${friend_id}님이 친구를 끊었습니다.`);
  } catch (err) {
    databaseError(res, err);
  }
};
