const { socketUsersInfo } = require("./gameStore");
const {
  getPlayerFromUsersInfo,
  isUserInGame,
  getGameInfoByGameId,
} = require("./gameUtils");

exports.drawCanvasHandler = async (io, socket, payload) => {
  // from 클리이언트 with x,y,brushColor
  const { x, y, brushColor } = payload;
  try {
    // payload 유효성 검사
    if (typeof brushColor !== "string" || !brushColor)
      throw new Error("유효한 brushColor값이 아닙니다.");
    if (typeof x !== "number" || !x || typeof y !== "number" || !y)
      throw new Error("유효한 좌표값이 아닙니다.");

    const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
    // 해당 유저가 방에 접속중인 유저인지 확인
    console.log("isUserInGame 시작전에 useInfo", socketUsersInfo[socket.id]);
    const isEntering = isUserInGame(gameId, userId);
    if (!isEntering) throw new Error("해당 방에 입장한 유저가 아닙니다.");

    // 그리는 순서 권한 체크
    const gameInfo = getGameInfoByGameId(gameId);
    console.log("gameInfo는", gameInfo);
    console.log("gameInfo는", gameInfo.currentTurnUserId);
    if (gameInfo.currentTurnUserId === userId) {
      // 해당 유저가 그리기 권한이 있는 경우
      const drawDataRes = {
        type: "SUCCESS",
        message: "그리기 성공",
        gameId: gameId,
        drawUserId: userId,
        data: {
          position: {
            x,
            y,
          },
          brushColor,
        },
      };
      io.of("/game").to(gameId).emit("drawCanvas", drawDataRes);
    } else {
      // 해당 유저가 그리기 권한이 없는 경우
      const drawDataRes = {
        type: "FAIL",
        message: "그리기 권한이 없습니다.",
        gameId: gameId,
        drawUserId: userId,
        data: {
          position: {
            x,
            y,
          },
          brushColor,
        },
      };
      io.of("/game").to(gameId).emit("drawCanvas", drawDataRes);
    }
  } catch (err) {
    console.log(err);
    const drawDataRes = {
      type: "FAIL",
      message: err.message,
      data: {
        x,
        y,
        brushColor,
      },
    };
    socket.emit("drawCanvas", drawDataRes);
  }
};

exports.clearCanvasHandler = async (io, socket) => {
  try {
    // 해당 유저가 방에 접속중인 유저인지 확인
    const isEntering = isUserInGame(gameId, userId);
    if (isEntering) throw new Error("해당 방에 입장한 유저가 아닙니다.");

    // 그리는 순서 권한 체크
    const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
    const gameInfo = getGameInfoByGameId(gameId);
    if (gameInfo.gameStatus.currentTurnUserId === userId) {
      // 해당 유저가 그리기 권한이 있는 경우
      const clearRes = {
        type: "SUCCESS",
        message: "전체 지우기 성공",
        gameId: gameId,
        drawUserId: userId,
      };
      io.of("/game").to(gameId).emit("clearCanvas", clearRes);
    }
  } catch (err) {
    console.log(err);
    const clearRes = {
      type: "FAIL",
      message: err.message,
    };
    socket.emit("clearCanvas", clearRes);
  }
};
