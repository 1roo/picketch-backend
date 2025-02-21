const db = require("../../models");
const { validationErrorWithMessage } = require("../../utils/common");

let chatUserInfo = {};
exports.dmChatSocket = (socket) => {
  console.log(socket.id);
  const { userId } = socket.handshake.query;
  if (!userId) {
    validationError(res, "유효하지 않은 ID");
    return;
  }
  console.log(`${socket.id}인 ${userId} dmChat socket 접속`);

  // 채팅방 접속
  socket.on("joinDm", async (friendId) => {
    const userInfo = db.User.findOne({
      where: { user_id: userId },
    });
    if (!userInfo) return validationError(res);

    // 유효성 검사 후 채팅자 정보 저장
    chatUserInfo[socket.id] = { userId, userNickname: userInfo.nickname };
  });

  socket.on("sendDm");
  socket.emit("receiveDm");
  socket.emit("exitDm");

  dmChat.on("disconnect", () => {
    console.log(`${socket.id}인 ${userId}님 dmChat socket 퇴장`);
    delete chatUserInfo[socket.io];
  });
};
