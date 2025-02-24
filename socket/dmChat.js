const { where, Op } = require("sequelize");
const db = require("../models");
const { validationErrorWithMessage, databaseError } = require("../utils/common");
const { response } = require("express");

let chatUserInfo = {};
exports.dmChatSocket = (io, socket) => {
  const userId = Number(socket.handshake.query.userId);
  if (!userId) {
    console.log("userId 유효하지 않음");
    return;
  }
  console.log(`${socket.id}인 ${userId} dmChat socket 접속`);
  // 채팅방 접속
  let dmRoomId;
  socket.on("joinDm", async (data) => {
    const friendInfo = await db.User.findOne({
      where: { nickname: data.friendNick },
      attributes: ["user_id", "nickname"],
    });
    const friendId = friendInfo.user_id;
    if (userId === friendId) {
      socket.emit("error", "자기 자신에게 메세지 불가");
      console.log("자기 자신에게 메세지 불가");
      return;
    }

    // user 정보 조회
    const userInfo = await db.User.findOne({
      where: { user_id: userId },
      attributes: ["user_id", "nickname"],
    });
    if (!userInfo) {
      socket.emit("error", "user정보 없음");
      console.log("userInfo 없음");
      return;
    }
    chatUserInfo[userId] = { socketId: socket.id, nickname: userInfo.nickname };

    // 기존 채팅방 DB 확인
    let dmChatRoom = await db.Dm.findOne({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId },
        ],
      },
      default: { user_id: userId, friend_id: friendId },
    });
    // 없는 경우 채팅방 DB 생성
    if (!dmChatRoom) {
      dmChatRoom = await db.Dm.create({
        user_id: userId,
        friend_id: friendId,
      });
      prevChat = null;
    }
    dmRoomId = Number(dmChatRoom.dm_id);
    // 기존 채팅방 대화 내용 불러오기
    const prevChat = await db.DmChat.findAll({
      where: { dm_id: dmRoomId },
      attributes: ["message", "sender_id"],
    });

    // DM 방 입장
    socket.join(dmRoomId);
    console.log(`${chatUserInfo[userId].nickname}님이 ${dmRoomId}번 방에 join했습니다`);
    // 방 정보 업데이트
    const dmData = {
      dmRoomId,
      chatUserInfo,
      prevChat,
    };
    console.log(dmData);
    io.of("/dmChat").to(dmRoomId).emit("updateDmRoomInfo", dmData);
  });

  // 채팅 받기
  socket.on("sendDm", async (data) => {
    const senderInfo = await db.User.findOne({
      where: { nickname: data.senderNick },
      attributes: ["user_id", "nickname"],
    });
    if (!senderInfo) return validationErrorWithMessage(res, "sender 정보 없음");
    const senderId = senderInfo.user_id;
    // receiverId 찾기
    const dmRoomUsers = await db.Dm.findOne({ where: dmRoomId });
    const receiverId =
      dmRoomUsers.user_id === senderId ? dmRoomUsers.friend_id : dmRoomUsers.user_id;

    console.log("senderId : ", senderId, "receiverId : ", receiverId);

    const msgData = {
      dmRoomId,
      from: data.senderNick,
      message: data.message,
    };
    console.log(msgData);
    // 메세지 db 저장
    const saveMsg = await db.DmChat.create({
      dm_id: dmRoomId,
      message: data.message,
      sender_id: senderId,
    });
    if (!saveMsg) return databaseError(res);
    console.log(chatUserInfo);
    // 수신자 채팅방 미접속
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
    }
    // dmRoomId 내 유저에게 채팅 전달
    io.of("/dmChat").to(dmRoomId).emit("receiveDm", msgData);
  });
  //   socket.emit("exitDm");

  socket.on("disconnect", () => {
    console.log(`${socket.id}인 ${userId}님 dmChat socket 퇴장`);
    delete chatUserInfo[userId];
    // io.of("/dmChat").to(dmRoomId).emit("updateDmRoomInfo", dmData);
  });
};
