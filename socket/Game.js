const db = require("../models");

// 현재 진행중인 방 찾기
const getActiveRoom = async (roomName, transaction) => {
  const room = await db.Game.findOne({
    where: {
      name: roomName,
      is_finish: 0,
    },
    transaction,
  });
  console.log("찾은 게임아이디", room.game_id);
  return { room };
};

// 유저 방에 참가 처리
const addUserToGameRoom = async (gameId, userId, transaction) => {
  const addResult = await db.PlayerGroup.create(
    {
      game_id: gameId,
      user_id: userId,
    },
    { transaction: transaction },
  );
  return { addResult };
};

// 유저가 참여중인 방 정보 db에서 삭제
const deleteEnterRoomFromDB = async (gameId, userId, transaction) => {
  const destroyResult = await db.PlayerGroup.destroy({
    where: {
      game_id: gameId,
      user_id: userId,
    },
    transaction,
  });
  console.log("삭제결과는", destroyResult);
  return { destroyResult };
};

// 남은 참가자 조회
const getRestParticipants = async (room, transaction) => {
  const currentPlayersResult = await db.PlayerGroup.findAll({
    where: {
      game_id: room.game_id,
    },
    include: [{ model: db.User, attribute: ["user_id", "nickname"] }],
    raw: false,
    transaction,
  });
  return { currentPlayersResult };
};

// 게임 참가 처리 로직
const joinGameRoom = async (io, socket, userInfo, roomName, inputPw) => {
  // 게임방 접속 요청
  const transaction = await db.sequelize.transaction();
  try {
    //
    const { room } = await getActiveRoom(roomName, transaction);
    if (!room) throw new Error("존재하지 않는 방입니다.");

    const { game_id, name, manager, is_lock, pw, round, is_finish } = room;

    // 비밀번호 유효성 검증
    if (is_lock && inputPw !== pw) {
      throw new Error("비밀번호가 일치하지 않습니다.");
    }

    // 입장한 유저 수 조회
    const { currentPlayersResult } = await getRestParticipants(room, transaction);

    const userCount = currentPlayersResult.length;
    console.log("현재 인원수", userCount);
    const participantNicks = currentPlayersResult.map((player) => {
      return player.user?.nickname || "";
    });

    console.log("남은 참가자 정보", participantNicks);

    // 입장 정원 체크
    if (userCount >= 8) {
      throw new Error("입장 인원 수 초과");
    }

    // 입장 처리
    const { addResult } = await addUserToGameRoom(game_id, 55, transaction);

    const payload = {
      message: "입장 성공.",
      data: {
        userId: "임시",
        roomName: roomName,
        participantNick: participantNicks,
      },
    };

    await transaction.commit();

    // 해당 방에 입장 처리
    socket.join(roomName);
    userInfo[socket.id].roomName = roomName;

    console.log("게임방은 : ", socket.rooms);
    console.log("유저정보는 : ", userInfo);
    socket.emit("receiveJoinGame", payload);
  } catch (err) {
    console.log(err);
    await transaction.rollback();

    // 동일한 방 입장 여부 체크
    let message;
    if (err.message === "Validation error") {
      message = "이미 해당 방에 입장되어 있습니다.";
    } else {
      message = err.message;
    }

    const payload = {
      message: message,
      data: {
        userId: "임시",
        roomName: userInfo[socket.id].roomName,
      },
    };
    socket.emit("receiveJoinGame", payload);
  }
};

// 게임 퇴장 처리 로직
const leaveGameRoom = async (io, socket, userInfo, isManualLeave = false) => {
  const transaction = await db.sequelize.transaction();
  try {
    const roomName = userInfo[socket.id]?.roomName;
    if (!roomName) throw new Error("방 이름정보가 없습니다.");

    // 같은 이름의 방 존재 여부 확인
    const { room } = await getActiveRoom(roomName, transaction);
    if (!room) throw new Error("존재하지 않는 방입니다.");

    const gameId = room.game_id;
    const userId = userInfo[socket.id].userId;

    // 내가 참여중인 방이 있는 경우 삭제
    const { destroyResult } = await deleteEnterRoomFromDB(gameId, userId, transaction);
    if (!destroyResult) throw new Error("참여중인 방이 아닙니다.");

    // 남은 유저 정보 조회
    const { currentPlayersResult } = await getRestParticipants(room, transaction);

    const participantNicks = currentPlayersResult.map((player) => {
      return player.user?.nickname || "";
    });
    console.log("남은 참가자 정보", participantNicks);

    await transaction.commit();

    const payload = {
      message: `${userInfo[socket.id].nickname}님이 퇴장했습니다.`,
      data: {
        userId: userInfo[socket.id].userId,
        roomId: userInfo[socket.id].roomName,
        participantNick: participantNicks,
      },
    };

    // 퇴장이 발생한방 전체 알림(나 제외)
    socket.to(userInfo[socket.id].roomName).emit("updateParticipants", payload);

    // userInfo에서도 삭제
    socket.leave(userInfo[socket.id].roomName);
    delete userInfo[socket.id];

    // 직접 퇴장 요청한 경우  퇴장 요청한 유저에게만 알림
    if (isManualLeave) {
      socket.emit("receiveLeaveGame", {
        message: "퇴장 처리되었습니다.",
        data: { userId, roomId: roomName },
      });
    }
  } catch (err) {
    await transaction.rollback();
    if (isManualLeave) {
      socket.emit("receiveLeaveGame", {
        message: err.message,
        data: {
          userId: userInfo[socket.id]?.userId,
          roomId: userInfo[socket.id]?.roomName,
        },
      });
    }
  }
};

exports.GameHandler = (io, socket, userInfo) => {
  socket.on("sendJoinGame", async (roomName, inputPw) => {
    await joinGameRoom(io, socket, userInfo, roomName, inputPw);
  });
  socket.on("disconnect", async () => {
    await leaveGameRoom(io, socket, userInfo, false);
  });
  socket.on("sendLeaveGame", async () => {
    await leaveGameRoom(io, socket, userInfo, true);
  });
};
