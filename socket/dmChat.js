const { Op } = require("sequelize");
const db = require("../models");
const { validationErrorWithMessage, databaseError } = require("../utils/common");

let chatUserInfo = {};
let dmData = {};
exports.dmChatSocket = (io, socket) => {
  const userId = Number(socket.handshake.query.userId);
  if (!userId) {
    socket.emit("error", { errMsg: "userId 유효하지 않음" });
    console.log("userId 유효하지 않음");
    return;
  }
  console.log(`${socket.id}인 ${userId} dmChat socket 접속`);
  // 채팅방 접속
  let dmRoomId;
  socket.on("joinDm", async (friendNick) => {
    // friendId 조회
    const friendInfo = await db.User.findOne({
      where: { nickname: friendNick },
      attributes: ["user_id", "nickname"],
    });
    const friendId = friendInfo.user_id;
    if (userId === friendId) {
      socket.emit("error", { errMsg: "자기 자신에게 메세지 불가" });
      console.log("자기 자신에게 메세지 불가");
      return;
    }

    // user 정보 조회
    const userInfo = await db.User.findOne({
      where: { user_id: userId },
      attributes: ["user_id", "nickname"],
    });
    if (!userInfo) {
      socket.emit("error", { errMsg: "user정보 없음" });
      console.log("userInfo 없음");
      return;
    }

    // 채팅방 내역 DB 조회
    let dmChatRoom = await db.Dm.findOne({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId },
        ],
      },
      default: { user_id: userId, friend_id: friendId },
    });
    // 없는 경우 채팅방 생성
    if (!dmChatRoom) {
      dmChatRoom = await db.Dm.create({
        user_id: userId,
        friend_id: friendId,
      });
    }
    dmRoomId = Number(dmChatRoom.dm_id);
    const prevChat = await db.DmChat.findAll({
      where: { dm_id: dmRoomId },
      attributes: ["message", "sender_id"],
    });
    // DM 방 입장
    socket.join(dmRoomId);
    chatUserInfo[userId] = { socketId: socket.id, nickname: userInfo.nickname };
    console.log(`${chatUserInfo[userId].nickname}님이 ${dmRoomId}번 방에 join했습니다`);
    // 이전 대화 내역 있을 경우, 읽음 처리
    if (prevChat) {
      await db.DmChat.update(
        {
          is_read: true,
        },
        {
          where: { dm_id: dmRoomId, sender_id: friendId },
        },
      );
    }
    // 방 정보 전달
    dmData = {
      dmRoomId,
      chatUserInfo,
      prevChat: prevChat ? prevChat : null,
    };
    console.log(dmData);
    io.of("/dmChat").to(dmRoomId).emit("updateDmRoomInfo", dmData);
  });

  // 채팅 받기
  socket.on("sendDm", async (data) => {
    // sender 정보 조회
    console.log(data);
    const senderInfo = await db.User.findOne({
      where: { nickname: data.senderNick },
      attributes: ["user_id", "nickname"],
    });
    if (!senderInfo) return socket.emit("error", { errMsg: "sender 정보 없음" });
    const senderId = senderInfo.user_id;
    // receiverId 찾기
    const dmUsers = await db.Dm.findOne({ where: dmRoomId });
    const receiverId = dmUsers.user_id === senderId ? dmUsers.friend_id : dmUsers.user_id;

    console.log("senderId : ", senderId, "receiverId : ", receiverId);
    // 메세지 DB 저장
    const saveMsg = await db.DmChat.create({
      dm_id: dmRoomId,
      message: data.message,
      sender_id: senderId,
      is_read: chatUserInfo[receiverId] ? true : false,
    });
    if (!saveMsg) return socket.emit("error", { errMsg: "Database Error" });
    console.log(chatUserInfo);
    // 수신자 채팅방 미접속 상태
    if (!chatUserInfo[receiverId]) {
      // Notification DB 저장
      const notification = await db.Notification.create({
        user_id: receiverId,
        from_user_id: senderId,
        notification_type: "DM_RECEIVED",
        response_status: "PENDING",
        content: `${chatUserInfo[senderId].nickname}님이 메세지를 보냈습니다.`,
      });
      console.log(notification);
      if (!notification) return socket.emit("error", { errMsg: "Database Error" });
    }
    // dmRoomId 내 유저에게 채팅 전달
    const msgData = {
      dmRoomId,
      from: data.senderNick,
      message: data.message,
    };
    console.log(msgData);
    io.of("/dmChat").to(dmRoomId).emit("receiveDm", msgData);
  });
  socket.on("exitDm", (freindNick) =>
    socket.on("disconnect", () => {
      console.log(`${socket.id}인 ${userId}님 dmChat socket 퇴장`);
      delete chatUserInfo[userId];
      io.of("/dmChat").to(dmRoomId).emit("updateDmRoomInfo", dmData);
    }),
  );
};
