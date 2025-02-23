const {
  getPlayerFromUsersInfo,
  isUserInGame,
  getGameInfoByGameId,
  getDrawRes,
  getErrorRes,
  getClearRes,
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

    // 유저 정보 조회
    const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);

    // 해당 유저가 방에 접속중인 유저인지 확인
    const isEntering = isUserInGame(gameId, userId);
    if (!isEntering) throw new Error("해당 방에 입장한 유저가 아닙니다.");

    // 게임 정보 조회
    const gameInfo = getGameInfoByGameId(gameId);

    // 게임 시작중인지 확인
    if (gameInfo.isWaiting) throw new Error("게임 준비에서는 그림을 그릴 수 없습니다.");
    // 정답이 나와서 라운드 완료상태인지 확인
    if (gameInfo.isAnswerFound)
      throw new Error("해당 라운드가 종료되어서 그림을 그릴 수 없습니다.");
    // 그리는 순서 권한 체크
    if (gameInfo.currentTurnUserId !== userId) throw new Error("그리기 권한이 없습니다.");

    // 해당 유저가 그리기 권한이 있는 경우
    const drawCanvasRes = getDrawRes(socket.id, payload);
    io.of("/game").to(gameId).emit("drawCanvas", drawCanvasRes);
  } catch (err) {
    console.log(err);
    const drawCanvasErrRes = getErrorRes(socket.id, err.message);
    socket.emit("drawCanvas", drawCanvasErrRes);
  }
};

exports.clearCanvasHandler = async (io, socket, cb) => {
  try {
    // 유저 정보 조회
    const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);

    // 해당 유저가 방에 접속중인 유저인지 확인
    const isEntering = isUserInGame(gameId, userId);
    if (!isEntering) throw new Error("해당 방에 입장한 유저가 아닙니다.");

    // 게임 정보 조회
    const gameInfo = getGameInfoByGameId(gameId);

    // 게임 시작중인지 확인
    if (gameInfo.isWaiting) throw new Error("게임 준비에서는 그림을 지울 수 없습니다.");
    // 정답이 나와서 라운드 완료상태인지 확인
    if (gameInfo.isAnswerFound)
      throw new Error("해당 라운드가 종료되어서 그림을 지울 수 없습니다.");
    // 그리는 순서 권한 체크
    if (gameInfo.currentTurnUserId !== userId) throw new Error("지우기 권한이 없습니다.");

    // 해당 유저가 그리기 권한이 있는 경우
    // 클라이언트에서 캔버스 지우기 함수 실행(콜백)
    // cb();
    const clearCanvasRes = getClearRes(socket.id);
    socket.emit("clearCanvas", clearCanvasRes);
  } catch (err) {
    console.log(err);
    const clearCanvasErrRes = getErrorRes(socket.id, err.message);
    socket.emit("clearCanvas", clearCanvasErrRes);
  }
};
