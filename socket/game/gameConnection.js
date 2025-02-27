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

  createGameInfoFromDB,
  getGameRoom,
} = require("./gameUtils");

// 방장 참가 처리 로직
exports.managerJoinHandler = async (io, socket, payload) => {
  console.log("managerJoinHandler실행");
  const gameId = Number(payload.gameId);
  const inputPw = Number(payload.inputPw);
  console.log("페이로드", gameId, inputPw);
  const userInfo = getPlayerFromUsersInfo(socket.id);
  console.log("참가전에 게임정보", socketGamesInfo[gameId]);
  console.log("참가전에 유저정보", socketUsersInfo[socket.id]);
  const transaction = await db.sequelize.transaction();
  try {
    if (!gameId || typeof gameId !== "number")
      throw new Error("유효한 gameId 정보가 없습니다.");
    // 방장인 경우 db게임정보의 매니저아이디와 유저 아이디가 일치하는지 여부 확인
    const game = await getGameRoom(gameId, true, transaction);
    console.log("방장입장시 db 게임", game);
    if (!game) {
      throw new Error("db에 존재하는 게임방이 없습니다.");
    }
    if (game && userInfo.userId === game.manager) {
      // db에 존재하지만 gameInfo 메모리내에 없는 경우 추가
      // 입장 처리 db
      console.log("🛠 addUserToGameRoom 실행됨", gameId, userInfo.userId);
      await addUserToGameRoom(gameId, userInfo.userId, transaction);
      transaction.commit();
      createGameInfoFromDB(gameId, game);
      addPlayerToGamesInfo(socket.id, gameId);
      joinGameToUsersInfo(socket.id, gameId);
      socket.join(gameId);
      console.log("참가후 게임정보", socketGamesInfo);
      console.log("참가후 유저정보", socketUsersInfo[socket.id]);
      // joinGame 성공 응답객체
      const joinGameRes = getJoinRes(socket.id, "게임방 입장");
      // updateParticipants 성공 응답객체
      const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
      console.log("게임입장처리후에 전체 게임정보", socketGamesInfo);
      // 응답 처리
      socket.emit("managerJoinGame", joinGameRes);
      io.of("/game").to(gameId).emit("updateGameInfo", updateGameInfoRes);
    }
  } catch (err) {
    transaction.rollback();
    console.log(err);
  }
};

// 게임 참가 처리 로직
exports.joinGameRoomHandler = async (io, socket, payload) => {
  console.log("📢 [joinGameRoomHandler] 실행됨");
  const gameId = Number(payload.gameId);
  const userId = Number(payload.userId);

  if (!gameId) throw new Error("유효한 gameId 정보가 없습니다.");

  // 게임방 존재 여부 확인 (대기 상태인 방만 조회)
  const game = await getGameRoom(gameId, true);
  if (!game) throw new Error("존재하지 않는 게임방입니다.");

  // 만약 입장하려는 사용자가 방장(manager)이라면,
  // joinGame 로직 대신 managerJoinHandler를 호출합니다.
  if (userId === game.manager) {
    console.log("관리자가 입장 요청하여 managerJoinHandler를 호출합니다.");
    await managerJoinHandler(io, socket, payload);
    return;
  }

  // 일반 참가자 로직
  socket.join(gameId);
  console.log(`✅ [소켓] 사용자 ${userId}가 게임방 ${gameId}에 입장`);
  const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
  io.of("/game").to(gameId).emit("updateGameInfo", updateGameInfoRes);
};



// 게임 퇴장 처리 로직
exports.leaveGameRoomHandler = async (io, socket) => {
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
    // 퇴장 처리 socket room
    console.log("updateGameInfoRes는", updateGameInfoRes);
    socket.leave(userInfo.gameId);

    const userInfo1 = socketUsersInfo;
    const gameInfo1 = socketGamesInfo;
    socket.emit("leaveGame", leaveGameRes);
    console.log("퇴장시 보낼 방은", userInfo.gameId);
    io.of("/game").to(userInfo.gameId).emit("updateGameInfo", updateGameInfoRes);
    // 퇴장 처리 socketUserInfo
    leaveGameFromUsersInfo(socket.id);
    console.log("퇴장후 유저", userInfo1);
    console.log("퇴장후 게임", gameInfo1);
  } catch (err) {
    console.log(err);
    await transaction.rollback();
  }
};

exports.socketDisconnect = async (io, socket) => {
  // 소켓 연결이 강제로 끊어질때
  const transaction = await db.sequelize.transaction();

  try {
    const userInfo = getPlayerFromUsersInfo(socket.id);
    if (userInfo.gameId) {
      const gameInfo = getGameInfoByGameId(userInfo.gameId);
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

      const leaveGameRes = getLeaveRes(socket.id, "게임방 퇴장");
      // 퇴장 처리 socketGamesInfo
      deletePlayerFromGamesInfo(socket.id);
      const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
      socket.emit("leaveGame", leaveGameRes);
      io.of("/game").to(userInfo.gameId).emit("updateGameInfo", updateGameInfoRes);
    }

    deletePlayerUsersInfo(socket.id);
  } catch (err) {
    console.log(err);
    await transaction.rollback();
    const leaveGameErrRes = getErrorRes(socket.id, err.message);
    socket.emit("leaveGame", leaveGameErrRes);
  }
};
