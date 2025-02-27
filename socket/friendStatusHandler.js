// 모델 import 추가
const { User } = require("../models");
const { Friend } = require("../models");

class FriendStatusHandler {
  constructor(namespace, redis) {
    this.friendStatus = namespace;
    this.redis = redis;
    console.log("FriendStatusHandler 초기화됨");
    this.setupSocketHandlers();
  }

  // 소켓 이벤트 핸들러 설정
  async setupSocketHandlers() {
    this.friendStatus.on("connection", async (socket) => {
      const userId = socket.userInfo.userId;
      console.log("친구 상태 네임스페이스 소켓 연결된 유저정보: ", socket.userInfo);

      try {
        await this.updateUserStatus(userId, "ONLINE");
        await this.sendFriendsStatus(userId, socket);
        await this.broadcastStatusToAllFriends(userId, "ONLINE");

        // 게임 상태 변경 이벤트
        socket.on("GAME_STATUS_CHANGE", async (data) => {
          try {
            console.log(`게임 상태 변경 이벤트 수신: ${JSON.stringify(data)}`);
            const status = data.inGame ? "IN_GAME" : "ONLINE";

            await this.updateUserStatus(
              userId,
              status,
              data.inGame ? data.gameRoomId : null,
            );

            await this.broadcastStatusToAllFriends(
              userId,
              status,
              data.inGame ? data.gameRoomId : null,
            );
          } catch (error) {
            this.handleError(socket, error, "게임 상태 변경 중 에러:");
          }
        });

        socket.on("disconnect", async () => {
          try {
            console.log(`유저 ${userId} 연결 종료, 상태를 OFFLINE으로 업데이트합니다.`);

            await this.updateUserStatus(userId, "OFFLINE", null, true);
            await this.broadcastStatusToAllFriends(userId, "OFFLINE");
          } catch (error) {
            console.error("연결 종료 처리 중 에러:", error);
          }
        });
      } catch (error) {
        this.handleError(socket, error, "소켓 연결 초기화 중 에러:");
      }
    });
  }

  // 사용자 상태 업데이트 메서드
  async updateUserStatus(userId, status, gameRoomId = null, isDisconnect = false) {
    // Redis에 유저 상태 정보 저장
    const redisData = {
      status: status,
      ...(gameRoomId && { gameRoomId }),
      ...(isDisconnect && { lastSeen: new Date().toISOString() }),
    };

    await this.redis.hset(`status:${userId}`, redisData);

    // DB 상태 업데이트
    const dbData = {
      status: status,
      ...(isDisconnect && { last_seen: new Date() }),
    };

    await User.update(dbData, { where: { user_id: userId } });

    console.log(`유저 ${userId} 상태를 ${status}으로 업데이트했습니다.`);
  }

  // 자신의 친구 목록 상태 정보를 클라이언트에 전송
  async sendFriendsStatus(userId, socket) {
    const userFriends = await Friend.findAll({
      where: { user_id: userId },
      attributes: ["friend_id"],
      raw: true,
    });

    console.log(`사용자 ${userId}의 친구 목록:`, userFriends);

    for (const friend of userFriends) {
      const friendId = friend.friend_id;
      const friendStatus = await User.findOne({
        where: { user_id: friendId },
        attributes: ["user_id", "status"],
        raw: true,
      });

      if (friendStatus) {
        console.log(`친구 ${friendId}의 현재 상태: ${friendStatus.status}`);

        socket.emit("friend_status", {
          userId: friendId,
          status: friendStatus.status,
          isOnline: friendStatus.status !== "OFFLINE",
        });
      }
    }
  }

  // 모든 친구에게 상태 브로드캐스트 메서드
  async broadcastStatusToAllFriends(userId, status, gameRoomId = null) {
    const friendsList = await Friend.findAll({
      where: { friend_id: userId },
      attributes: ["user_id"],
      raw: true,
    });

    console.log(`사용자 ${userId}를 친구로 등록한 사용자 목록:`, friendsList);

    // 이 사용자의 친구들에게만 상태 브로드캐스트
    for (const friend of friendsList) {
      this.broadcastStatusToFriend(userId, status, friend.user_id, gameRoomId);
    }
  }

  // 특정 친구에게 상태 브로드캐스트 메서드
  broadcastStatusToFriend(userId, status, friendUserId, gameRoomId = null) {
    const statusData = {
      userId: parseInt(userId),
      status: status,
      isOnline: status !== "OFFLINE",
      ...(status === "OFFLINE" && { lastSeen: new Date().toISOString() }),
      ...(status === "IN_GAME" && { gameRoomId }),
    };

    console.log(
      `사용자 ${friendUserId}에게 ${userId}의 상태 데이터 전송: ${JSON.stringify(statusData)}`,
    );

    this.friendStatus.emit(`friend_status_for_${friendUserId}`, statusData);
  }

  handleError(socket, error, message = "오류 발생:") {
    console.error(message, error);
    socket.emit("ERROR", {
      type: "ERROR",
      error: {
        code: "SERVER_ERROR",
        message: "서버 오류가 발생했습니다",
      },
    });
  }
}

module.exports = { FriendStatusHandler };
