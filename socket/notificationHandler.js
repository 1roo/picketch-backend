const { Notification, User } = require("../models");
const { Op } = require("sequelize");
const redisConfig = require("../config/redis");
const { saveToRedis, getFromRedis } = require("../utils/redisUtils");
const axios = require("axios");

class NotificationHandler {
  constructor(namespace, redis) {
    this.notifications = namespace;
    this.redis = redis;
    this.config = redisConfig.memoryManagement;
    this.keyPrefix = redisConfig.keyPrefix;
    // - url 수정 - //
    this.apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3001/api"; // 테스트 페이지 변경해야함
    this.setupSocketHandlers();
  }

  getKey(type, userId) {
    return `${this.keyPrefix[type]}${userId}`;
  }

  // client -> server 소켓 이벤트 메서드
  setupSocketHandlers() {
    this.notifications.on("connection", async (socket) => {
      const userId = socket.userInfo.user_id;
      console.log("소켓 연결된 유저정보: ", socket.userInfo);

      // 파이프라인 연결
      const socketKey = this.getKey("socket", userId);
      const pipeline = this.redis.pipeline();

      pipeline.hset(socketKey, {
        socketId: socket.id,
        connected: "true",
        lastConnected: new Date().toISOString(),
      });

      pipeline.expire(socketKey, this.config.cache.socketInfo);
      await pipeline.exec();

      // - 프론트 연결부분 확인 - //
      // 알림 목록 조회 요청 이벤트
      socket.on("GET_NOTIFICATIONS", async (data) => {
        console.log("GET_NOTIFICATIONS 이벤트: ", data);

        try {
          if (parseInt(data.userId) !== socket.userInfo.user_id) {
            return this.emitError(
              socket,
              "UNAUTHORIZED",
              "알림을 볼 수 있는 권한이 없습니다",
            );
          }

          // 캐시 데이터 조회
          const cacheKey = this.getKey("notification", userId);
          const cachedData = await getFromRedis(this.redis, cacheKey);

          if (cachedData && cachedData.timestamp) {
            const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime();
            if (cacheAge < this.config.cache.notificationList * 1000) {
              return socket.emit("NOTIFICATIONS_LIST", {
                type: "NOTIFICATIONS_LIST",
                data: {
                  notifications: cachedData.notifications,
                  unreadCount: cachedData.unreadCount,
                },
              });
            }
          }

          const limit = 20;

          // DB에서 알림 조회
          const [notifications, unreadCount] = await Promise.all([
            Notification.findAll({
              where: { user_id: userId },
              include: [
                {
                  model: User,
                  as: "FromUser",
                  attributes: ["user_id", "nickname"],
                },
              ],
              order: [["create_date", "DESC"]],
              limit,
            }),

            Notification.count({
              where: {
                user_id: userId,
                is_read: false,
              },
            }),
          ]);

          const formattedNotifications = notifications.map((notification) =>
            this.formatNotification(notification),
          );

          // 캐싱
          const notificationData = {
            notifications: formattedNotifications,
            unreadCount,
            timestamp: new Date().toISOString(),
          };

          await saveToRedis(this.redis, cacheKey, notificationData, 60);

          socket.emit("NOTIFICATIONS_LIST", {
            type: "NOTIFICATIONS_LIST",
            data: {
              notifications: formattedNotifications,
              unreadCount,
            },
          });
        } catch (err) {
          console.error("알림 조회 중 에러: ", err);
          this.emitError(socket, "SERVER_ERROR", "서버 내부 오류가 발생했습니다");
        }
      });

      // 알림 응답 처리 이벤트
      socket.on("NOTIFICATION_RES", async (data) => {
        try {
          const notification = await Notification.findOne({
            where: {
              notification_id: data.notificationId,
              user_id: userId,
            },
          });

          console.log("알림 응답 처리:", {
            알림ID: data.notificationId,
            알림타입: notification?.notification_type || "알림 없음",
            응답: data.response,
          });

          if (!notification) {
            return this.emitError(
              socket,
              "NOTIFICATION_NOT_FOUND",
              "알림을 찾을 수 없습니다",
              { notificationId: data.notificationId },
            );
          }

          if (
            notification.response_status &&
            notification.response_status !== "PENDING"
          ) {
            return this.emitError(socket, "ALREADY_RESPONDED", "이미 응답한 알림입니다", {
              notificationId: data.notificationId,
            });
          }

          if (notification.expires_at && new Date() > notification.expires_at) {
            return this.emitError(socket, "EXPIRED_NOTIFICATION", "만료된 알림입니다", {
              notificationId: data.notificationId,
            });
          }

          // 알림 상태 업데이트
          await notification.update({
            response_status: data.response,
            is_read: true,
            read_at: new Date(),
          });

          // Redis 작업 일괄 처리 (파이프라인)
          const pipeline = this.redis.pipeline();
          pipeline.srem(this.getKey("unread", userId), data.notificationId);
          pipeline.del(this.getKey("notification", userId));

          if (
            notification.notification_type === "FRIEND_REQUEST" &&
            (data.response === "ACCEPTED" || data.response === "REJECTED")
          ) {
            pipeline.del(this.getKey("notification", notification.from_user_id));
          }

          // 친구 요청 알림
          if (
            notification.notification_type === "FRIEND_REQUEST" &&
            data.response === "ACCEPTED"
          ) {
            try {
              // - url 변경해야함 - //
              const apiUrl = `${this.apiBaseUrl}/friend/accept/${notification.from_user_id}?accepter_id=${userId}`;
              console.log(`API 호출: ${apiUrl}`);

              const response = await axios.get(apiUrl, {
                headers: {
                  Authorization: socket.handshake.headers.authorization || "",
                },
                timeout: 5000,
              });

              console.log(
                `친구 요청 수락 API 호출 완료: ${userId} -> ${notification.from_user_id}`,
                response.status,
              );

              const currentUser = await User.findByPk(userId);

              if (currentUser) {
                // 원래 요청자에게 친구 수락 알림 전송
                await this.sendNotification(notification.from_user_id, {
                  from: {
                    userId: userId,
                    nickname: currentUser.nickname,
                  },
                  notificationType: "FRIEND_ACCEPT",
                  content: `${currentUser.nickname}님이 친구 요청을 수락했습니다.`,
                  requiresResponse: false,
                  linkUrl: null,
                  roomId: null,
                  expiresAt: null,
                });

                console.log(
                  `친구 수락 알림 전송 완료: ${userId} -> ${notification.from_user_id}`,
                );
              }
            } catch (err) {
              console.error(
                "친구 요청 수락 API 호출 중 오류:",
                err.response?.data || err.message,
                err.stack,
              );
              await pipeline.exec(); // 파이프라인 실행 후 에러 응답
              return this.emitError(
                socket,
                "FRIEND_API_ERROR",
                "친구 요청 처리 중 오류가 발생했습니다",
              );
            }
          } else if (
            notification.notification_type === "FRIEND_REQUEST" &&
            data.response === "REJECTED"
          ) {
            try {
              const apiUrl = `${this.apiBaseUrl}/friend/reject/${notification.from_user_id}`;
              console.log(`API 호출: ${apiUrl}`);

              const response = await axios.get(apiUrl, {
                headers: {
                  Authorization: socket.handshake.headers.authorization || "",
                },
                timeout: 5000,
              });

              console.log(
                `친구 요청 거절 API 호출 완료: ${userId} -> ${notification.from_user_id}`,
                response.status,
              );
            } catch (err) {
              console.error(
                "친구 요청 거절 API 호출 중 오류:",
                err.response?.data || err.message,
                err.stack,
              );
              await pipeline.exec(); // 파이프라인 실행 후 에러 응답
              return this.emitError(
                socket,
                "FRIEND_API_ERROR",
                "친구 요청 처리 중 오류가 발생했습니다",
              );
            }
          }

          // 게임 초대 알림
          if (
            notification.notification_type === "GAME_INVITE" &&
            data.response === "ACCEPTED"
          ) {
            console.log("게임 초대 수락:", notification.room_id);

            // 클라이언트에게 게임 방으로 이동하라는 이벤트 전송
            socket.emit("GAME_INVITE_ACCEPTED", {
              type: "GAME_INVITE_ACCEPTED",
              data: {
                roomId: notification.room_id,
                linkUrl: notification.link_url,
              },
            });
          }

          // 파이프라인 실행
          await pipeline.exec();

          socket.emit("NOTIFICATION_RES_SUCCESS", {
            type: "NOTIFICATION_RES_SUCCESS",
            data: {
              notificationId: data.notificationId,
              status: data.response,
            },
          });
        } catch (err) {
          console.error("알림 응답 처리 중 에러:", err);
          this.emitError(socket, "SERVER_ERROR", "서버 내부 오류가 발생했습니다");
        }
      });

      // 연결 종료 처리
      socket.on("disconnect", async () => {
        await this.redis.hset(socketKey, "connected", "false");
        await this.redis.expire(
          this.getKey("socket", userId),
          this.config.cache.socketInfo,
        );
      });
    });
  }

  // 새 알림 전송 메서드
  async sendNotification(userId, notification) {
    try {
      console.log("🎈----------- 알림 전송 시작 -----------🎈");
      console.log("수신자 ID: ", userId);

      // DB 알림 저장
      const newNotification = await Notification.create({
        user_id: userId,
        from_user_id: notification.from.userId,
        notification_type: notification.notificationType,
        content: notification.content,
        room_id: notification.roomId,
        link_url: notification.linkUrl,
        requires_response: notification.requiresResponse,
        response_status: notification.requiresResponse ? "PENDING" : null,
        expires_at: notification.expiresAt,
      });

      console.log("알림 DB 저장 완료:", newNotification.notification_id);

      // Redis 작업 일괄 처리 (파이프라인)
      const pipeline = this.redis.pipeline();

      const formattedNotification = await this.formatNotification(newNotification);

      // 읽지 않은 알림 관리
      const unreadKey = this.getKey("unread", userId);
      pipeline.sadd(unreadKey, newNotification.notification_id);
      pipeline.expire(unreadKey, this.config.cache.defaultDuration * 3);
      pipeline.del(this.getKey("notification", userId));

      await pipeline.exec();

      // 읽지 않은 알림 개수 제한 처리
      const unreadCount = await this.redis.scard(unreadKey);
      if (unreadCount > this.config.limits.maxUnread) {
        try {
          const excessCount = unreadCount - this.config.limits.maxUnread;

          // 파이프라인으로 일괄 처리
          const bulkUpdatePipeline = this.redis.pipeline();

          const oldestNotifications = await Notification.findAll({
            where: {
              user_id: userId,
              is_read: false,
            },
            order: [["create_date", "ASC"]],
            limit: excessCount,
            attributes: ["notification_id"],
          });

          const oldestIds = oldestNotifications.map((n) => n.notification_id);

          if (oldestIds.length > 0) {
            await Notification.update(
              { is_read: true, read_at: new Date() },
              {
                where: {
                  notification_id: {
                    [Op.in]: oldestIds,
                  },
                },
              },
            );

            // Redis에서 제거
            bulkUpdatePipeline.srem(unreadKey, ...oldestIds);
            await bulkUpdatePipeline.exec();

            console.log(
              `${oldestIds.length}개의 오래된 알림을 자동으로 읽음 처리했습니다.`,
            );
          }
        } catch (err) {
          console.error("읽지 않은 알림 개수 제한 처리 중 오류:", err);
        }
      }

      // 소켓으로 알림 전송
      const socketKey = this.getKey("socket", userId);
      const socketInfo = await this.redis.hgetall(socketKey);

      if (socketInfo && socketInfo.connected === "true") {
        this.notifications.to(socketInfo.socketId).emit("NOTIFICATION", {
          type: "NOTIFICATION",
          data: formattedNotification,
        });
        console.log(`실시간 알림 전송 완료: ${socketInfo.socketId}`);
      } else {
        console.log(
          `사용자(${userId})가 연결되어 있지 않습니다. 다음 연결 시 알림을 확인할 수 있습니다.`,
        );
      }

      return newNotification;
    } catch (err) {
      console.error("알림 전송 중 에러:", err);
      throw err;
    }
  }

  // 알림 응답 형식 변환 메서드
  formatNotification(notification) {
    const fromUser = notification.FromUser || notification.fromUser;
    const fromUserId = fromUser ? fromUser.user_id : notification.from_user_id;
    const nickname = fromUser ? fromUser.nickname : "알 수 없음";

    return {
      notificationId: notification.notification_id.toString(),
      notificationType: notification.notification_type,
      responseStatus: notification.response_status,
      from: {
        userId: fromUserId || notification.from_user_id,
        nickname: nickname,
      },
      content: notification.content,
      roomId: notification.room_id,
      linkUrl: notification.link_url,
      requiresResponse: notification.requires_response,
      isRead: notification.is_read,
      createdAt: notification.create_date,
      expiresAt: notification.expires_at,
    };
  }

  // 에러 메시지 메서드
  emitError(socket, code, message, additionalData = {}) {
    console.error(`소켓 에러 발생 [${code}]: ${message}`, additionalData);
    socket.emit("ERROR", {
      type: "ERROR",
      error: {
        code,
        message,
        ...additionalData,
      },
    });
  }
}

module.exports = { NotificationHandler };
