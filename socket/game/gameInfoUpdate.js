const {
  getUpdateGameInfoRes,
  getErrorRes,
  getGameIdFromGameInfo,
  getPlayerFromUsersInfo,
  setGameFromGamesInfo,
  createGameInfoFromDB,
} = require("./gameUtils");

exports.updateGameInfoHandler = (io, socket) => {
  try {
    // createGameInfoFromDB(gameId, game);
    // 스타트를 누르면 게임을 하기위한 세팅값 설정
    const userInfo = getPlayerFromUsersInfo(socket.id);

    const newCurrentRound = 1;
    const newIsWaiting = true;
    const newIsGameEnd = false;
    setGameFromGamesInfo({
      gameId: userInfo.gameId,
      newCurrentRound,
      newIsWaiting,
      newIsGameEnd,
    });
    const updateGameRes = getUpdateGameInfoRes(socket.id);
    console.log("✅✅✅✅✅✅✅✅업데이트 전 응답", userInfo);
    console.log("✅✅✅✅✅✅✅✅업데이트 응답", updateGameRes);
    socket.emit("updateGameInfo", updateGameRes);
  } catch (err) {
    console.log(err);
    const updateGameInfoErrRes = getErrorRes(socket.id, "updateGameInfo 에러");
    socket.emit("updateGameInfo", updateGameInfoErrRes);
  }
};
