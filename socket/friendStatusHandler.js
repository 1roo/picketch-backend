const { User } = require("../models");

class FriendStatusHandler {
  constructor(namespace, redis) {
    this.friendStatus = namespace;
    this.redis = redis;
    this.setupSocketHandlers();
  }

  // 소켓 이벤트 핸들러 설정
  setupSocketHandlers() {
    this.friendStatus.on("connection", async (socket) => {
      const userId = socket.userInfo.user_id;
      console.log("소켓 연결된 유저정보: ", socket.userInfo);

      try {
        // Redis에 유저 상태 정보 저장
        await this.redis.hset(`status:${userId}`, {
          socketId: socket.id,
          status: "ONLINE",
        });

        // DB 상태 업데이트 및 브로드캐스트
        await User.update({ status: "ONLINE" }, { where: { user_id: userId } });

        // 상태 브로드캐스트
        this.broadcastStatus(userId, "ONLINE");

        // 게임 상태 변경 이벤트
        socket.on("GAME_STATUS_CHANGE", async (data) => {
          try {
            const status = data.inGame ? "IN_GAME" : "ONLINE";

            await this.redis.hset(`status:${userId}`, {
              status: status,
              ...(data.inGame && { gameRoomId: data.gameRoomId }),
            });

            await User.update({ status: status }, { where: { user_id: userId } });

            this.broadcastStatus(userId, status, data.inGame ? data.gameRoomId : null);
          } catch (error) {
            console.error("게임 상태 변경 중 에러:", error);
            socket.emit("ERROR", {
              type: "ERROR",
              error: {
                code: "SERVER_ERROR",
                message: "서버 오류가 발생했습니다",
              },
            });
          }
        });

        // 연결 종료 처리
        socket.on("disconnect", async () => {
          try {
            await this.redis.hset(`status:${userId}`, {
              status: "OFFLINE",
              lastSeen: new Date().toISOString(),
            });

            await User.update(
              {
                status: "OFFLINE",
                last_seen: new Date(),
              },
              { where: { user_id: userId } },
            );

            this.broadcastStatus(userId, "OFFLINE");
          } catch (error) {
            console.error("연결 종료 처리 중 에러:", error);
          }
        });
      } catch (error) {
        console.error("소켓 연결 초기화 중 에러:", error);
        socket.emit("ERROR", {
          type: "ERROR",
          error: {
            code: "CONNECTION_ERROR",
            message: "연결 중 오류가 발생했습니다",
          },
        });
      }
    });
  }

  // 상태 브로드캐스트 메서드
  broadcastStatus(userId, status, gameRoomId = null) {
    const statusData = {
      type: "FRIEND_STATUS",
      data: {
        userId: parseInt(userId),
        status: status,
        isOnline: status !== "OFFLINE",
        ...(status === "OFFLINE" && { lastSeen: new Date().toISOString() }),
        ...(status === "IN_GAME" && { gameRoomId }),
      },
    };

    // 모든 연결된 클라이언트에게 브로드캐스트
    this.friendStatus.emit("FRIEND_STATUS", statusData);
  }
}

module.exports = { FriendStatusHandler };
