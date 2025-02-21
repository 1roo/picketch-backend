const { where, Op } = require("sequelize");
const db = require("../models");
const { validationErrorWithMessage } = require("../utils/common");

let chatUserInfo = {};
const chatUserInfos = [chatUserInfo];
exports.dmChatSocket = (socket) => {
  const userId = Number(socket.handshake.query.userId);
  if (!userId) {
    console.log("userId 유효하지 않음");
    return;
  }
  console.log(`${socket.id}인 ${userId} dmChat socket 접속`);
  // 채팅방 접속
  let dmRoomId;
  socket.on("joinDm", async (id) => {
    const friendId = Number(id);
    const userInfo = await db.User.findOne({
      where: { user_id: userId },
      attributes: ["user_id", "nickname"],
    });
    if (!userInfo) {
      socket.emit("error", "user정보 없음");
      console.log("userInfo 없음");
      return;
    }
    chatUserInfo[socket.id] = { userId, nickname: userInfo.nickname };
    if (userId === friendId) {
      socket.emit("error", "자기 자신에게 메세지 불가");
      console.log("자기 자신에게 메세지 불가");
      return;
    }

    let dmChatRoom = await db.Dm.findOne({
      where: {
        [Op.or]: [
          { user_id: userId, friend_id: friendId },
          { user_id: friendId, friend_id: userId },
        ],
      },
      default: { user_id: userId, friend_id: friendId },
    });
    if (!dmChatRoom) {
      dmChatRoom = await db.Dm.create({
        user_id: userId,
        friend_id: friendId,
      });
    }
    dmRoomId = Number(dmChatRoom.dm_id);
    console.log(`${dmRoomId}방입니다.`);
    const dmData = {
      dmRoomId,
      chatUserInfos,
    };
    console.log(dmData);
    socket.emit("updateDmRoomInfo", dmData);
  });

  // "chatUserInfos": [
  //           {
  //                "R2kOT9_hS3csFhG3AAAB": {
  //                     "userId": 1,
  //                     "nickname": "훈이"
  //                },
  //                "yteC2wDcmV2iRjUUAAAD": {
  //                     "userId": 2,
  //                     "nickname": "짱구"
  //                }
  //           }
  //      ]

  // 채팅 전달
  socket.on("sendDm", (data) => {
    // socket.join(data.dmRoomID)
    console.log(data);
    const msgData = {
      from: data.senderId,
      message: data.message,
    };
    //왜 안떠
    console.log(msgData);
    socket.emit("receiveDm", msgData);
  });
  //   socket.emit("receiveDm");
  //   socket.emit("exitDm");

  socket.on("disconnect", () => {
    console.log(`${socket.id}인 ${userId}님 dmChat socket 퇴장`);
    delete chatUserInfos;
  });
};
