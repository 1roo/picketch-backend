const db = require("../models");
const { socketGamesInfo, socketUsersInfo } = require("./gameStore");
const {
  getRestParticipants,
  addUserToGameRoom,
  deleteEnterRoomFromDB,
  formatParticipantData,
  addPlayerToGamesInfo,
  editPlayerToUsersInfo,
  getPlayerFromUsersInfo,
  deletePlayerUsersInfo,
  deletePlayerFromGamesInfo,
  getGameRoom,
  changeManagerOnLeave,
} = require("./gameUtils");

// 게임 참가 처리 로직
exports.joinGameRoomHandler = async (io, socket, payload) => {
  const { gameId: joinGameId, gameName, inputPw } = payload;
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  // 게임방 접속 요청
  const transaction = await db.sequelize.transaction();
  try {
    // 요청값 유효성 검증
    if (!joinGameId || typeof joinGameId !== "number")
      throw new Error("유효한 gameId 정보가 없습니다.");
    if (!gameName || typeof gameName !== "string" || gameName.trim() === "")
      throw new Error("유효한 gameName 정보가 없습니다.");
    if (typeof inputPw !== "string") throw new Error("유효한 pw 정보가 없습니다.");

    // 종료되지 않은 게임이 존재하는지 확인
    const game = await getGameRoom(joinGameId, false, transaction);
    if (!game) throw new Error("존재하지 않는 방입니다.");

    const { game_id, name, manager, is_lock, pw, round, is_finish } = game;

    // 비밀번호 유효성 검증
    if (is_lock && inputPw !== pw) {
      throw new Error("비밀번호가 일치하지 않습니다.");
    }

    const currentPlayersResult = await getRestParticipants(game, transaction);

    // 입장한 유저 수 조회
    const userCount = currentPlayersResult.length;
    console.log("현재 인원수", userCount);

    // 입장 정원 체크
    if (userCount >= 8) {
      throw new Error("입장 인원 수 초과");
    }

    // 입장 처리(테이블 row 생성)
    await addUserToGameRoom(game_id, userId, transaction);

    // 참가자 정보 조회
    const updatedPlayersResult = await getRestParticipants(game, transaction);
    const participantNicks = formatParticipantData(updatedPlayersResult);
    console.log("남은 참가자 정보", participantNicks);

    const joinGameRes = {
      type: "SUCCESS",
      message: "입장 처리 되었습니다.",
      data: {
        userId: userId,
        gameId: game_id,
        gameName: name,
        isManager: manager === userId ? true : false,
      },
    };

    const updateParticipantsRes = {
      type: "SUCCESS",
      message: `${nickname}님이 입장했습니다.`,
      data: {
        userId: userId || null,
        gameId: game_id,
        gameName: name || null,
        manager: manager,
        participantInfos: participantNicks,
      },
    };

    await transaction.commit();

    // 해당 방에 입장 처리
    socket.join(game_id);
    socket.emit("joinGame", joinGameRes);
    io.to(game_id).emit("updateParticipants", updateParticipantsRes);

    editPlayerToUsersInfo(socket.id, userId, nickname, joinGameId);
    addPlayerToGamesInfo(game_id, userId, nickname, manager);
    console.log("입장처리후 usersInfo는", socketUsersInfo);
    console.log("입장처리후 gamesInfo는", socketGamesInfo);
    console.log("입장처리후 gamesInfo는", socketGamesInfo[game_id]);
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
  console.log("퇴장 요청이 들어올때 userInfo", socketUsersInfo);

  const transaction = await db.sequelize.transaction();
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  try {
    if (!gameId) throw new Error("참가중인 방이 없습니다.");

    // 같은 이름의 방 존재 여부 확인
    const game = await getGameRoom(gameId, false, transaction);
    if (!game) throw new Error("존재하지 않는 방입니다.");

    // db에 있는 방 정보
    const { game_id, name, is_lock, pw, round, is_finish } = game;
    let { manager } = game;

    // 내가 참여중인 방이 있는 경우 삭제
    const { destroyResult } = await deleteEnterRoomFromDB(game_id, userId, transaction);
    if (!destroyResult) throw new Error("참여중인 방이 아닙니다.");

    // 남은 유저 정보 조회
    const currentPlayersResult = await getRestParticipants(game, transaction);
    const participantNicks = formatParticipantData(currentPlayersResult);

    console.log("남은 참가자 정보", participantNicks);

    // 방장이 퇴장할때, 다음 유저가 방장이 되도록 처리
    // 한명(방장)이 남았을때 퇴장하면 방 종료처리 (is_finish => 1)
    console.log("현재 매니저는 ", manager);
    if (manager === userId) {
      const nextUserId = currentPlayersResult[0]?.user_id;
      console.log("다음 예정 매니저는 ", nextUserId);
      const { newManager, gameIsFinish } = await changeManagerOnLeave(
        nextUserId,
        gameId,
        transaction,
      );

      // 변경된 매니저 값 가져오기
      const updatedGame = await getGameRoom(gameId, gameIsFinish, transaction);
      console.log("변경된 매니저1", updatedGame);
      console.log("변경된 매니저2", updatedGame.manager);
      manager = updatedGame.manager; // updatedGame에서 최신 매니저 정보 가져오기
    }

    await transaction.commit();

    const payload = {
      type: "SUCCESS",
      message: `${nickname}님이 퇴장했습니다.`,
      data: {
        userId: userId || null,
        gameId: game_id,
        gameName: name || null,
        manager: manager,
        participantInfos: participantNicks,
      },
    };

    // 직접 퇴장 요청한 경우  퇴장 요청한 유저에게만 알림
    if (isManualLeave) {
      socket.emit("leaveGame", {
        type: "SUCCESS",
        message: "퇴장 처리되었습니다.",
        data: { userId: userId, gameId: game_id, gameName: name },
      });

      socket.leave(gameId);
      editPlayerToUsersInfo(socket.id, undefined, undefined, null);
    } else {
      socket.leave(gameId);
      deletePlayerUsersInfo(socket.id);
    }

    deletePlayerFromGamesInfo(gameId, userId);

    // 퇴장이 발생한방 전체 알림(나 제외)
    socket.to(gameId).emit("updateParticipants", payload);

    console.log("연결종료 후 userInfo", socketUsersInfo);
    console.log("연결종료 후 gamesInfo는", socketGamesInfo);
    console.log("연결종료 후 gamesInfo는", socketGamesInfo[game_id]);
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
