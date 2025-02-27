const { drawCanvasHandler, clearCanvasHandler } = require("./gameCanvas");
const { gameChatHandler } = require("./gameChat");
const {
  joinGameRoomHandler,
  leaveGameRoomHandler,
  socketDisconnect,
  managerJoinHandler,
} = require("./gameConnection");
const {
  readyGameHandler,
  startGameHandler,
  nextTurnHandler,
  endGameHandler,
} = require("./gameSetup");
const { setPlayerToUsersInfo, getUpdateGameInfoRes } = require("./gameUtils");

exports.gameSocket = async (io, socket) => {
  // 소켓 연결 시 유저 정보를 저장
  setPlayerToUsersInfo(socket);
  console.log("✅ 새 소켓 연결, 소켓 ID:", socket.id);

  // 방장 참가 이벤트 처리
socket.on("managerJoinGame", async (payload) => {
  console.log(`📡 [Socket] managerJoinGame 요청 - gameId: ${payload.gameId}, userId: ${payload.userId}`);
  try {
    await managerJoinHandler(io, socket, payload);
    console.log(`✅ 방장(${payload.userId})이 게임방 ${payload.gameId}에 입장 완료`);
    // 딜레이 후 updateGameInfo 이벤트 전송
    setTimeout(() => {
      const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
      io.of("/game").to(payload.gameId).emit("updateGameInfo", updateGameInfoRes);
      console.log(`📢 updateGameInfo 전송 완료: ${JSON.stringify(updateGameInfoRes)}`);
    }, 500);
  } catch (error) {
    console.error("❌ managerJoinGame 처리 오류:", error);
  }
});


  // 게임방 입장 이벤트 (모든 참가자 처리)
  socket.on("joinGame", async (payload) => {
    console.log(`📡 [Socket] joinGame 요청 - gameId: ${payload.gameId}, userId: ${payload.userId}`);
    try {
      await joinGameRoomHandler(io, socket, payload);
      console.log(`✅ 사용자 ${payload.userId}가 게임방 ${payload.gameId}에 입장 완료`);
      setTimeout(() => {
        const updateGameInfoRes = getUpdateGameInfoRes(socket.id);
        io.of("/game").to(payload.gameId).emit("updateGameInfo", updateGameInfoRes);
        console.log(`📢 updateGameInfo 전송 완료: ${JSON.stringify(updateGameInfoRes)}`);
      }, 500);
    } catch (error) {
      console.error("❌ joinGame 처리 오류:", error);
    }
  });
  
  

  // 게임 준비 이벤트
  socket.on("readyGame", async () => {
    try {
      await readyGameHandler(io, socket);
    } catch (error) {
      console.error("❌ readyGame 오류:", error);
    }
  });

  // 게임 시작 이벤트
  socket.on("startGame", async () => {
    try {
      await startGameHandler(io, socket);
    } catch (error) {
      console.error("❌ startGame 오류:", error);
    }
  });

  // 다음 라운드 이벤트
  socket.on("nextTurn", () => {
    try {
      nextTurnHandler(io, socket);
    } catch (error) {
      console.error("❌ nextTurn 오류:", error);
    }
  });

  // 게임 종료 이벤트
  socket.on("endGame", async () => {
    try {
      await endGameHandler(io, socket);
    } catch (error) {
      console.error("❌ endGame 오류:", error);
    }
  });

  // 게임방 퇴장 이벤트
  socket.on("leaveGame", async () => {
    try {
      await leaveGameRoomHandler(io, socket);
    } catch (error) {
      console.error("❌ leaveGame 오류:", error);
    }
  });

  // 게임방 채팅 이벤트
  socket.on("gameMessage", async (payload) => {
    try {
      await gameChatHandler(io, socket, payload);
    } catch (error) {
      console.error("❌ gameMessage 오류:", error);
    }
  });

  // 게임방 그림 그리기 이벤트
  socket.on("drawCanvas", async (payload) => {
    try {
      await drawCanvasHandler(io, socket, payload);
    } catch (error) {
      console.error("❌ drawCanvas 오류:", error);
    }
  });

  // 게임방 그림 초기화 이벤트
  socket.on("clearCanvas", async (cb) => {
    try {
      await clearCanvasHandler(io, socket, cb);
    } catch (error) {
      console.error("❌ clearCanvas 오류:", error);
    }
  });

  // 소켓 연결 종료 이벤트
  socket.on("disconnect", async () => {
    console.log(`🚪 소켓 연결 해제, 소켓 ID: ${socket.id}`);
    try {
      await socketDisconnect(io, socket);
    } catch (error) {
      console.error("❌ disconnect 처리 오류:", error);
    }
  });

  // 연결 에러 디버깅
  socket.on("connect_error", (err) => {
    console.error("❌ 소켓 연결 실패:", err);
  });
};
