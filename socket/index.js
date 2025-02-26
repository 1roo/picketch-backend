const socketIO = require("socket.io");
const redisManager = require("../utils/redisManager");
const redisConfig = require("../config/redis");
const { NotificationHandler } = require("./notificationHandler");
const { FriendStatusHandler } = require("./friendStatusHandler");
const { validationError } = require("../utils/common");
const { dmChatSocket } = require("./dmChat");
const { gameSocket } = require("./game/gameSocket");
const { syncGameInfoWithPlayersFromDB } = require("./game/gameUtils");
const { authSocketMiddleware } = require("../middleware/socketMiddleware");
const { performRedisCleanup } = require("../utils/redisUtils");

function socketHandler(server, redis) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(authSocketMiddleware);

  const game = io.of("/game");
  const dmChat = io.of("/dmChat");
  const notifications = io.of("/notifications");
  const friendStatus = io.of("/friendStatus");

  syncGameInfoWithPlayersFromDB();
  const namespaces = [notifications, friendStatus, game, dmChat];
  namespaces.forEach(namespace => namespace.use(authSocketMiddleware));

  // Redis 서버 상태 초기화
  initializeRedisServer(redis);

  // ? 외부 소켓 핸들러 사용하기 위한 인스턴스 // 나중에 필요 없으면 삭제하기
  const notificationHandler = new NotificationHandler(notifications, redis);
  const friendStatusHandler = new FriendStatusHandler(friendStatus, redis);

  // game
  game.on("connection", (socket) => gameSocket(io, socket));
  // dmChat
  dmChat.on("connection", (socket) => dmChatSocket(io, socket));

  // 서버 상태 모니터링 시작
  startServerMonitoring(redis);
}

// Redis 서버 초기화 함수
function initializeRedisServer(redis) {
  const pipeline = redis.pipeline();
  pipeline.set("socket_server", "running");
  pipeline.expire("socket_server", 86400); // 1일 후 만료
  pipeline.exec();

  redis.on("connect", () => {
    console.log("Redis socket server connection running..");
  });

  redis.on("error", (err) => {
    console.error("Redis socket server connection error", err);
  });
}

// 서버 상태 모니터링 함수
async function checkServerStatus(redis) {
  try {
    const pipeline = redis.pipeline();
    pipeline.get("socket_server");
    pipeline.info("memory");
    pipeline.keys(`${redisConfig.keyPrefix.socket}*`);

    const results = await pipeline.exec();
    const status = results[0][1];
    const memoryInfo = results[1][1];
    const socketKeys = results[2][1];

    // 메모리 사용량 파싱
    const memoryUsage = parseInt(
      memoryInfo
        .split("\r\n")
        .find((line) => line.startsWith("used_memory:"))
        .split(":")[1],
    );

    const memoryThreshold = redisConfig.memoryManagement.limits.memoryThreshold;

    console.log(`Socket server status: ${status}`);
    console.log(`Connected clients: ${socketKeys.length}`);
    console.log(`Memory usage: ${memoryUsage} bytes`);

    // 메모리 임계값 초과 시 정리 작업 수행
    if (memoryUsage > memoryThreshold) {
      console.warn(`High Redis memory usage detected: ${memoryUsage} bytes`);
      await performRedisCleanup(redis);
    }
  } catch (err) {
    console.error("Server status check error:", err);
  }
}

// 모니터링 시작 함수
function startServerMonitoring(redis) {
  // 초기 상태 체크
  checkServerStatus(redis);

  // 10분마다 상태 체크 실행 (부하 감소)
  const monitoringInterval = setInterval(() => checkServerStatus(redis), 10 * 60 * 1000);

  // 메모리 정리 작업
  const cleanupInterval = setInterval(
    () => performRedisCleanup(redis),
    redisConfig.memoryManagement.limits.cleanupInterval,
  );

  // 서버 종료 시 인터벌 정리
  process.on("SIGTERM", () => {
    clearInterval(monitoringInterval);
    clearInterval(cleanupInterval);
  });
}

module.exports = { socketHandler };
