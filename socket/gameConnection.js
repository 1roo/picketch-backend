const db = require("../models");
const { socketGamesInfo, socketUsersInfo } = require("./gameStore");
const {
  addUserToGameRoom,
  deleteEnterRoomFromDB,
  addPlayerToGamesInfo,
  getPlayerFromUsersInfo,
  deletePlayerUsersInfo,
  deletePlayerFromGamesInfo,
  getGameRoom,
  changeManagerOnLeave,
  getGameInfoByGameId,
  getParticipants,
  addPlayerToUsersInfo,
  changeManagerInGame,
} = require("./gameUtils");

// 게임 참가 처리 로직
exports.joinGameRoomHandler = async (io, socket, payload) => {
  const { gameId: joinGameId, inputPw } = payload;
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);

  console.log("소켓아이디", socket.id, typeof socket.id);
  console.log("소켓아이디", typeof socket.id);

  // 게임방 접속 요청
  const transaction = await db.sequelize.transaction();
  try {
    // 요청값 유효성 검증
    if (!joinGameId || typeof joinGameId !== "number")
      throw new Error("유효한 gameId 정보가 없습니다.");
    if (typeof inputPw !== "string") throw new Error("유효한 pw 정보가 없습니다.");

    // 참가 가능 방 여부 확인
    const game = getGameInfoByGameId(joinGameId);
    if (!game) throw new Error("존재하지 않는 방입니다.");
    if (!game.isWaiting) throw new Error("대기중인 방이 아닙니다.");

    const {
      name,
      currentTurnId,
      currentRound,
      maxRound,
      isLock,
      pw,
      manager,
      isWaiting,
      players,
    } = game;

    // 비밀번호 유효성 검증
    if (isLock && inputPw !== pw) {
      throw new Error("비밀번호가 일치하지 않습니다.");
    }

    // 참자가 조회
    const beforeParticipants = getParticipants(joinGameId);
    const userCount = beforeParticipants.length;
    console.log("참가 유저수는 ", userCount);

    // 입장 정원 체크
    if (userCount >= 8) {
      throw new Error("입장 인원 수 초과");
    }

    // 입장 처리 db
    await addUserToGameRoom(joinGameId, userId, transaction);
    // 입장 처리 socketGamesInfo
    addPlayerToGamesInfo(socket.id, joinGameId);
    // 입장 처리 socketUserInfo
    const userInfo = getPlayerFromUsersInfo(socket.id);
    addPlayerToUsersInfo(userInfo, socket.id, joinGameId);
    // 입장 처리 socket room
    socket.join(joinGameId);

    const joinGameRes = {
      type: "SUCCESS",
      message: "입장 처리 되었습니다.",
      data: {
        userId: userId,
        gameId: joinGameId,
        gameName: name,
        isManager: manager === userId ? true : false,
      },
    };

    // 참가자 정보 조회
    const newParticipants = getParticipants(joinGameId);

    const updateParticipantsRes = {
      type: "SUCCESS",
      message: `${nickname}님이 입장했습니다.`,
      data: {
        userId: userId || null,
        gameId: userInfo.gameId,
        gameName: name || null,
        managerId: manager,
        players: newParticipants,
      },
    };

    await transaction.commit();

    console.log("접속시 유저정보", socketUsersInfo[socket.id]);
    // 응답 처리
    socket.emit("joinGame", joinGameRes);
    io.to(joinGameId).emit("updateParticipants", updateParticipantsRes);
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
      type: "ERROR",
      message: message,
      data: {
        userId: userId,
        gameId: gameId,
      },
    };
    socket.emit("joinGame", payload);
  }
};

// 게임 퇴장 처리 로직
exports.leaveGameRoomHandler = async (io, socket, isManualLeave = false) => {
  const transaction = await db.sequelize.transaction();
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  try {
    // 참가중인 방인지 확인
    if (!gameId) throw new Error("참가중인 방이 없습니다.");

    // 퇴장 가능 방 여부 확인
    const game = getGameInfoByGameId(gameId);
    if (!game) throw new Error("존재하지 않는 방입니다.");
    const {
      name,
      currentTurnId,
      currentRound,
      maxRound,
      isLock,
      pw,
      isWaiting,
      players,
    } = game;
    let { manager } = game;

    // 퇴장 처리 db
    const destroyResult = await deleteEnterRoomFromDB(gameId, userId, transaction);
    if (!destroyResult) throw new Error("퇴장 처리 실패");

    // 퇴장 처리 socketGamesInfo
    deletePlayerFromGamesInfo(gameId, userId);

    // 퇴장 처리 socketUserInfo
    addPlayerToUsersInfo(
      { userId: undefined, nickname: undefined, gameId: null },
      socket.id,
    );
    // 퇴장 처리 socket room
    socket.leave(gameId);

    // 방장이 퇴장할때, 다음 유저가 방장이 되도록 처리
    // 한명(방장)이 남았을때 퇴장하면 방 종료처리 (is_waiting => 0)
    const participants = getParticipants(gameId);

    // 퇴장후 남아있는 다음 유저가 방장예정
    const nextUserId = participants[0]?.userId;

    if (manager === userId && isWaiting === true) {
      const { newManager, gameIsFinish } = await changeManagerOnLeave(
        nextUserId,
        gameId,
        transaction,
      );

      // 변경된 매니저 값 가져오기
      const updatedGame = await getGameRoom(gameId, gameIsFinish, transaction);

      // gameInfo의 해당 게임에서 manager 변경
      manager = updatedGame.manager;
      changeManagerInGame(gameId, updatedGame.manager);

      // 다음 방장유저가 없으면 게임정보를 삭제(게임 생성 종료)
      // if (!newManager) deleteGameFromGamesInfo(gameId);
    }

    await transaction.commit();
    console.log("퇴장 후 useInfo는", socketUsersInfo[socket.id]);
    const payload = {
      type: "SUCCESS",
      message: `${nickname}님이 퇴장했습니다.`,
      data: {
        userId: userId || null,
        gameId: gameId,
        gameName: name || null,
        manager: manager,
        players: participants,
      },
    };

    // 직접 퇴장 요청한 경우  퇴장 요청한 유저에게만 알림
    if (isManualLeave) {
      socket.emit("leaveGame", {
        type: "SUCCESS",
        message: "퇴장 처리되었습니다.",
        data: { userId: userId, gameId: gameId, gameName: name },
      });

      socket.leave(gameId);
    } else {
      socket.leave(gameId);
      deletePlayerUsersInfo(socket.id);
    }
    console.log("게임정보는 ", socketGamesInfo[gameId]);
    console.log("유저정보는 ", socketUsersInfo[socket.id]);
    // 퇴장이 발생한방 전체 알림(나 제외)
    socket.to(gameId).emit("updateParticipants", payload);
  } catch (err) {
    console.log(err);
    await transaction.rollback();
    if (isManualLeave) {
      socket.emit("leaveGame", {
        type: "ERROR",
        message: err.message,
        data: {
          userId: userId,
          gameId: gameId,
        },
      });
    }
  }
};
