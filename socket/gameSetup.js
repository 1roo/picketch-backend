const { socketUsersInfo, socketGamesInfo } = require("./gameStore");
const {
  getPlayerFromUserInfo,
  checkValidRoom,
  toggleReadyGameInfo,
  getPlayerReadyFromGameInfo,
} = require("./gameUtils");

exports.readyGameHandler = async (io, socket) => {
  const { userId, nickname, gameId } = getPlayerFromUserInfo(socket.id);
  try {
    // 방에 입장하지 않았을떄 준비를 누르는지 체크

    const checkResult = checkValidRoom(gameId, userId);
    if (!checkResult) throw new Error("참가 중인 방이 아닙니다.");

    // 레디 상태 토글
    toggleReadyGameInfo(gameId, userId);

    // 전체 유저의 ready 상태
    const playersReadyInfo = getPlayerReadyFromGameInfo(gameId);
    const readyStatusRes = {
      type: "SUCCESS",
      message: `${nickname}님의 ready 상태가 변경되었습니다.`,
      data: {
        playersReadyInfo: playersReadyInfo,
      },
    };
    io.to(gameId).emit("readyGame", readyStatusRes);
  } catch (err) {
    console.log(err);
    const readyStatusRes = {
      type: "ERROR",
      message: err.message,
      data: {
        userId: userId,
        gameId: gameId,
      },
    };
    console.log("전체 유저의 레디", readyStatusRes);
    socket.emit("readyGame", readyStatusRes);
  }
};

exports.startGameHandler = async (io, socket) => {
  try {
    // 방에 입장하지 않았을떄 스타트를 누르는지 체크
    const { userId, nickname, gameId } = getPlayerFromUserInfo(socket.id);
    const checkResult = checkValidRoom(gameId, userId);
    if (!checkResult) throw new Error("참가 중인 방이 아닙니다.");

    // 스타트를 누르면 게임을 하기위한 세팅값 설정
    // 라운드, 최대라운드
  } catch (err) {
    console.log(err);
  }
};
