const redisConfig = {
  // Redis 연결 설정
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  // 메모리 관리 설정
  memoryManagement: {
    // 캐시 설정
    cache: {
      defaultDuration: 180, // 기본 캐시 시간 (3분)
      notificationList: 180, // 알림 목록 캐시 시간 (3분)
      socketInfo: 7200, // 소켓 정보 캐시 시간 (2시간)
      userStatus: 3600, // 사용자 상태 정보 (1시간)
      sessionTimeout: 1800, // 세션 타임아웃 (30분)
    },

    // 데이터 제한
    limits: {
      maxHistory: 50, // 최대 히스토리 개수
      maxUnread: 30, // 최대 읽지 않은 알림 개수
      maxNotifications: 100, // 사용자당 최대 알림 개수
      memoryThreshold: 1024 * 1024 * 50, // 50MB 메모리 임계값
      cleanupInterval: 15 * 60 * 1000, // 15분마다 정리 작업 수행
    },

    // 압축 설정
    compression: {
      enabled: true,
      threshold: 512, // 512 바이트 이상인 경우 압축
      compressionLevel: 6, // 압축 레벨 (1-9, 9가 가장 높음)
    },
  },

  // 키 프리픽스 설정
  keyPrefix: {
    notification: "n:",
    socket: "s:",
    history: "h:",
    unread: "u:",
    userStatus: "us:",
    friendsList: "f:",
  },
};

module.exports = redisConfig;
