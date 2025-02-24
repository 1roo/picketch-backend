const db = require("../../models");
const { socketGamesInfo, socketUsersInfo } = require("./gameStore");
const {
  addUserToGameRoom,
  deleteEnterRoomFromDB,
  addPlayerToGamesInfo,
  getPlayerFromUsersInfo,
  deletePlayerUsersInfo,
  deletePlayerFromGamesInfo,
  changeManagerOnLeave,
  getGameInfoByGameId,
  getParticipants,
  changeManagerInGame,
  getJoinRes,
  getErrorRes,
  getLeaveRes,
  getRestParticipants,
  joinGameToUsersInfo,
  leaveGameFromUsersInfo,
  getUpdateGameInfoRes,
} = require("./gameUtils");

// 게임 참가 처리 로직
exports.joinGameRoomHandler = async (io, socket, payload) => {
  const { gameId, inputPw } = payload;

  // 게임방 접속 요청
  const transaction = await db.sequelize.transaction();
  try {
    // const userInfo = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(gameId);
    // gameId 유효성 검증
    if (!gameId || typeof gameId !== "number")
      throw new Error("유효한 gameId 정보가 없습니다.");

    // 참가 가능 방 여부 확인
    if (!gameInfo.isWaiting) throw new Error("대기중인 방이 아닙니다.");

    // 비밀번호 유효성 검증
    if (gameInfo.isLock && typeof inputPw !== "number")
      throw new Error("유효한 pw 정보가 없습니다.");
    if (gameInfo.isLock && inputPw !== gameInfo.pw) {
      throw new Error("비밀번호가 일치하지 않습니다.");
    }

    // 참자가 조회
    const beforeParticipants = getParticipants(gameId);
    const userCount = beforeParticipants.length;

    // 입장 정원 체크
    if (userCount >= 8) {
      throw new Error("입장 인원 수 초과");
    }

    // 입장 처리 db
    const userInfo = getPlayerFromUsersInfo(socket.id);
    await addUserToGameRoom(gameId, userInfo.userId, transaction);
    await transaction.commit();
    // 입장 처리 socketGamesInfo
    addPlayerToGamesInfo(socket.id, gameId);
    // 입장 처리 socketUserInfo
    joinGameToUsersInfo(socket.id, gameId);
    // 입장 처리 socket room
    socket.join(gameId);

    // joinGame 성공 응답객체
    const joinGameRes = getJoinRes(socket.id, "게임방 입장");
    // updateParticipants 성공 응답객체
    const updateGameInfoRes = getUpdateGameInfoRes(socket.id);

    // 응답 처리
    socket.emit("joinGame", joinGameRes);
    io.of("/game").to(gameId).emit("updateGameInfo", updateGameInfoRes);
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

    const joinGameErrRes = getErrorRes(socket.id, message);
    socket.emit("joinGame", joinGameErrRes);
  }
};

// 게임 퇴장 처리 로직
exports.leaveGameRoomHandler = async (io, socket, isManualLeave = false) => {
  const transaction = await db.sequelize.transaction();
  try {
    const userInfo = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(userInfo.gameId);
    // 참가중인 방인지 확인
    if (!userInfo.gameId) throw new Error("참가중인 방이 없습니다.");
    // 퇴장 가능 방 여부 확인
    if (!gameInfo) throw new Error("존재하지 않는 방입니다.");

    // 퇴장 처리 db
    const destroyResult = await deleteEnterRoomFromDB(
      userInfo.gameId,
      userInfo.userId,
      transaction,
    );
    if (!destroyResult) throw new Error("퇴장 처리 실패");

    // 대기방에서 퇴장하는 유저가 방장인 경우
    const restParticipants = getRestParticipants(socket.id);
    console.log("퇴장시 본인제외 나머지 참가자", restParticipants);
    const nextUserId = restParticipants[0]?.userId;
    if (gameInfo.manager === userInfo.userId && gameInfo.isWaiting === true) {
      // 방장이 퇴장할때, 다음 유저가 방장이 되도록 처리
      // 한명(방장)이 남았을때 퇴장하면 방 종료처리 (is_waiting => 0)

      const { newManagerId } = await changeManagerOnLeave(
        nextUserId,
        userInfo.gameId,
        transaction,
      );

      // 남은 유저가 있는 경우 방장 변경 socketGamesInfo
      if (nextUserId) {
        changeManagerInGame(userInfo.gameId, newManagerId);
      }
    }
    await transaction.commit();

    // joinGame 성공 응답객체
    const leaveGameRes = getLeaveRes(socket.id, "게임방 퇴장");
    // 퇴장 처리 socketGamesInfo
    deletePlayerFromGamesInfo(socket.id);
    // updateParticipants 성공 응답객체
    const updateGameInfoRes = getUpdateGameInfoRes(socket.id);

    // 퇴장 처리 socketUserInfo
    leaveGameFromUsersInfo(socket.id);
    // 퇴장 처리 socket room
    socket.leave(userInfo.gameId);

    // 소켓 연결 종료시 유저 정보 삭제 (socketUserInfo)
    if (!isManualLeave) {
      deletePlayerUsersInfo(socket.id);
    }
    const userInfo1 = socketUsersInfo;
    const gameInfo1 = socketGamesInfo;
    console.log("퇴장후 유저", userInfo1);
    console.log("퇴장후 게임", gameInfo1);
    socket.emit("leaveGame", leaveGameRes);
    io.of("/game").to(userInfo.gameId).emit("updateParticipants", updateGameInfoRes);
  } catch (err) {
    console.log(err);
    await transaction.rollback();

    if (isManualLeave) {
      const leaveGameErrRes = getErrorRes(socket.id, err.message);
      socket.emit("leaveGame", leaveGameErrRes);
    }
  }
};
