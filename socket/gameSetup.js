const { socketUsersInfo, socketGamesInfo } = require("./gameStore");
const {
  getPlayerFromUsersInfo,
  checkValidRoom,
  toggleReadyGamesInfo,
  getPlayerReadyFromGamesInfo,
  getGamesInfoByGameId,
  formatReadyData,
  getGameRoom,
} = require("./gameUtils");

exports.readyGameHandler = async (io, socket) => {
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  try {
    // 방에 입장하지 않았을떄 준비를 누르는지 체크
    console.log("레디를 눌렀을떄 유저, 게임 아이디", userId, gameId);
    const checkResult = await checkValidRoom(gameId, userId);
    if (!checkResult) throw new Error("참가 중인 방이 아닙니다.");

    // 방장이 아닌 유저만 준비를 누르는지 체크
    const game = await getGameRoom(gameId, false);
    const { game_id, name, manager, is_lock, pw, round, is_finish } = game;
    if (manager === userId) {
      throw new Error("방장은 준비상태를 변경할 수 없습니다.");
    }

    // 레디 상태 토글
    toggleReadyGamesInfo(gameId, userId);

    // 전체 유저의 ready 상태
    const playersInfo = getGamesInfoByGameId(gameId);
    const playersReadyInfo = formatReadyData(playersInfo);

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
  const { userId, nickname, gameId } = getPlayerFromUsersInfo(socket.id);
  getGame;
  try {
    // 내가 참가중인 방인지 확인
    const checkResult = await checkValidRoom(gameId, userId);
    if (!checkResult) throw new Error("참가 중인 방이 아닙니다.");

    // 전체 유저의 준비상태를 체크

    // 방장만 누르는지 체크
    const game = await getGameRoom(gameId, false);
    const { game_id, name, manager, is_lock, pw, round, is_finish } = game;
    if (manager !== userId) {
      throw new Error("방장만 시작할 수 있습니다.");
    }

    // 스타트를 누르면 게임을 하기위한 세팅값 설정
    // 라운드, 최대라운드
    // const game = await ActiveRoom(gameId);
  } catch (err) {
    console.log(err);
    socket.to(gameId).emit("startGame");
  }
};

// {
//   [game_id] : {
//     currentTurn : 0 // 누구차례인지
//     currentRound : 2 // 현재라운드 / 전체라운드중(4턴) - players 한바퀴 순서 다 돌면 currentRound +1
//     limitRound  : 4, // 요청할때 받는 값
//     players : [
//       {
//         userId : 1,
//         nickname : "고기고기"
//         score : 0,
//         ready : false
//       }
//     ]

//   }
// }
