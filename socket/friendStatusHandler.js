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
        // Redis에 유저 상태 정보 저장
        await this.redis.hset(`status:${userId}`, {
          socketId: socket.id,
          status: "ONLINE",
        });

        // DB 상태 업데이트
        await User.update({ status: "ONLINE" }, { where: { user_id: userId } });

        console.log(`유저 ${userId} 상태를 ONLINE으로 업데이트하고 브로드캐스트합니다.`);

        // 이 사용자가 친구로 등록한 다른 사용자의 친구 목록 조회
        const userFriends = await Friend.findAll({
          where: { user_id: userId },
          attributes: ["friend_id"],
          raw: true,
        });

        console.log(`사용자 ${userId}의 친구 목록:`, userFriends);

        // 각 친구의 현재 상태를 조회하여 전송
        for (const friend of userFriends) {
          const friendId = friend.friend_id;
          const friendStatus = await User.findOne({
            where: { user_id: friendId },
            attributes: ["user_id", "status"],
            raw: true,
          });

          if (friendStatus) {
            console.log(`친구 ${friendId}의 현재 상태: ${friendStatus.status}`);

            // 해당 친구의 상태를 클라이언트에 전송
            socket.emit("friend_status", {
              userId: friendId,
              status: friendStatus.status,
              isOnline: friendStatus.status !== "OFFLINE",
            });
          }
        }

        // 이 사용자를 친구로 등록한 사용자 목록 조회
        const friendsList = await Friend.findAll({
          where: { friend_id: userId },
          attributes: ["user_id"],
          raw: true,
        });

        console.log(`사용자 ${userId}를 친구로 등록한 사용자 목록:`, friendsList);

        // 이 사용자의 친구들에게만 상태 브로드캐스트
        for (const friend of friendsList) {
          // 각 친구를 위한 개인 룸으로 메시지 전송
          this.broadcastStatusToFriend(userId, "ONLINE", friend.user_id);
        }

        // 게임 상태 변경 이벤트
        socket.on("GAME_STATUS_CHANGE", async (data) => {
          try {
            console.log(`게임 상태 변경 이벤트 수신: ${JSON.stringify(data)}`);
            const status = data.inGame ? "IN_GAME" : "ONLINE";

            // Redis에 상태 업데이트
            await this.redis.hset(`status:${userId}`, {
              status: status,
              ...(data.inGame && { gameRoomId: data.gameRoomId }),
            });

            // DB에 상태 업데이트
            await User.update({ status: status }, { where: { user_id: userId } });

            console.log(
              `유저 ${userId} 상태를 ${status}로 업데이트하고 브로드캐스트합니다.`,
            );

            // 이 사용자를 친구로 등록한 사용자 목록 조회
            const friendsList = await Friend.findAll({
              where: { friend_id: userId },
              attributes: ["user_id"],
              raw: true,
            });

            // 이 사용자의 친구들에게만 상태 브로드캐스트
            for (const friend of friendsList) {
              this.broadcastStatusToFriend(
                userId,
                status,
                friend.user_id,
                data.inGame ? data.gameRoomId : null,
              );
            }
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
            console.log(`유저 ${userId} 연결 종료, 상태를 OFFLINE으로 업데이트합니다.`);

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

            // 이 사용자를 친구로 등록한 사용자 목록 조회
            const friendsList = await Friend.findAll({
              where: { friend_id: userId },
              attributes: ["user_id"],
              raw: true,
            });

            // 이 사용자의 친구들에게만 상태 브로드캐스트
            for (const friend of friendsList) {
              this.broadcastStatusToFriend(userId, "OFFLINE", friend.user_id);
            }
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

    // 해당 친구의 소켓을 찾아 상태 전송
    this.friendStatus.emit(`friend_status_for_${friendUserId}`, statusData);
  }
}

module.exports = { FriendStatusHandler };
