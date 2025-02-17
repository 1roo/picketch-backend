const db = require("../models");
const {
  getActiveRoom,
  getRestParticipants,
  addUserToGameRoom,
  deleteEnterRoomFromDB,
} = require("./gameUtils");

// 게임 참가 처리 로직
exports.joinGameRoomHandler = async (io, socket, userInfo, roomName, inputPw) => {
  console.log("userInfo는", userInfo);
  console.log("roomName는", roomName);
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
      type: "SUCCESS",
      message: "입장 성공.",
      data: {
        userId: "임시",
        roomName: roomName,
        participantNick: participantNicks,
      },
    };

    await transaction.commit();

    // 해당 방에 입장 처리
    console.log("룸이름은", roomName);
    socket.join(roomName);
    userInfo[socket.id].roomName = roomName;
    console.log("입장처리후 userInfo는", userInfo);
    console.log("게임방은 : ", socket.rooms);
    console.log("유저정보는 : ", userInfo);
    socket.emit("joinGame", payload);
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
      type: "FAIL",
      message: message,
      data: {
        userId: "임시",
        roomName: userInfo[socket.id].roomName,
      },
    };
    socket.emit("joinGame", payload);
  }
};

// 게임 퇴장 처리 로직
exports.leaveGameRoomHandler = async (io, socket, userInfo, isManualLeave = false) => {
  console.log("퇴장 요청이 들어올때 userInfo", userInfo);
  const transaction = await db.sequelize.transaction();
  try {
    const roomName = userInfo[socket.id]?.roomName;
    if (!roomName) throw new Error("방 정보가 없습니다.");

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
        userId: userInfo[socket.id].userId || null,
        roomId: userInfo[socket.id].roomName || null,
        participantNick: participantNicks,
      },
    };

    // 퇴장이 발생한방 전체 알림(나 제외)
    socket.to(userInfo[socket.id].roomName).emit("updateParticipants", payload);

    // 직접 퇴장 요청한 경우  퇴장 요청한 유저에게만 알림
    if (isManualLeave) {
      socket.emit("leaveGame", {
        type: "SUCCESS",
        message: "퇴장 처리되었습니다.",
        data: { userId, roomId: roomName },
      });
      socket.leave(userInfo[socket.id].roomName);
      userInfo[socket.id].roomName = null;
    } else {
      socket.leave(userInfo[socket.id].roomName);
      delete userInfo[socket.id];
      console.log("연결종료될때 userInfo", userInfo);
    }
  } catch (err) {
    console.log(err);
    await transaction.rollback();
    if (isManualLeave) {
      socket.emit("leaveGame", {
        type: "FAIL",
        message: err.message,
        data: {
          userId: userInfo[socket.id]?.userId,
          roomId: userInfo[socket.id]?.roomName,
        },
      });
    }
  }
};
