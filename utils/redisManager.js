const Redis = require("ioredis");
const redisConfig = require("../config/redis");
const { performRedisCleanup } = require("./redisUtils");

class RedisManager {
  constructor() {
    this.client = null;
    this.config = redisConfig;
    this.monitoringInterval = null;
    this.cleanupScheduled = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
  }

  connect() {
    if (this.client) {
      return this.client;
    }

    try {
      const options = {
        host: this.config.connection.host,
        port: this.config.connection.port,
        password: this.config.connection.password,
        retryStrategy: (times) => {
          // 재연결 대기 시간을 지수적으로 증가시킴 (최대 30초)
          const delay = Math.min(times * 1000, 30000);
          console.log(`Redis 연결 재시도 (${times}번째): ${delay}ms 후 시도`);

          this.connectionAttempts++;
          if (this.connectionAttempts > this.maxConnectionAttempts) {
            console.error(
              `Redis 연결 실패: 최대 시도 횟수(${this.maxConnectionAttempts}) 초과`,
            );
            return null; // 더 이상 재연결하지 않음
          }

          return delay;
        },
        // 연결 타임아웃 설정 (10초)
        connectTimeout: 10000,
        // 명령 실행 타임아웃 설정 (5초)
        commandTimeout: 5000,
        // 연결 유지를 위한 keepAlive 설정
        keepAlive: 10000,
        // 예외 처리를 위한 설정
        enableOfflineQueue: true,
        maxRetriesPerRequest: 3,
      };

      this.client = new Redis(options);

      this.client.on("connect", () => {
        console.log("Redis 연결 성공");
        this.connectionAttempts = 0;
        this.startMonitoring();
      });

      this.client.on("error", (err) => {
        console.error("Redis 연결 오류:", err);
      });

      this.client.on("reconnecting", () => {
        console.log("Redis 재연결 중...");
      });

      this.client.on("end", () => {
        console.log("Redis 연결 종료");
        this.stopMonitoring();
      });

      return this.client;
    } catch (error) {
      console.error("Redis 연결 초기화 오류:", error);
      throw error;
    }
  }

  close() {
    if (this.client) {
      this.stopMonitoring();
      this.client
        .quit()
        .then(() => {
          console.log("Redis 연결이 안전하게 종료되었습니다.");
          this.client = null;
        })
        .catch((err) => {
          console.error("Redis 연결 종료 중 오류 발생:", err);
        });
    }
  }

  startMonitoring() {
    if (this.monitoringInterval) {
      return;
    }

    // 메모리 사용량 체크 및 정리 작업 스케줄링
    this.monitoringInterval = setInterval(async () => {
      try {
        const memoryUsage = await this.checkMemoryUsage();
        console.log(`Redis 메모리 사용량: ${memoryUsage} 바이트`);

        // 메모리 임계값 초과 시 정리 작업 실행
        if (memoryUsage > this.config.memoryManagement.limits.memoryThreshold) {
          if (!this.cleanupScheduled) {
            this.cleanupScheduled = true;
            console.warn(
              `Redis 메모리 사용량이 임계값을 초과했습니다: ${memoryUsage} 바이트`,
            );

            try {
              await performRedisCleanup(this.client);
            } finally {
              this.cleanupScheduled = false;
            }
          }
        }
      } catch (error) {
        console.error("Redis 모니터링 중 오류 발생:", error);
      }
    }, this.config.memoryManagement.limits.cleanupInterval);

    console.log(
      `Redis 모니터링 시작 (간격: ${this.config.memoryManagement.limits.cleanupInterval / 1000}초)`,
    );
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("Redis 모니터링 중지");
    }
  }

  async checkMemoryUsage() {
    if (!this.client) {
      throw new Error("Redis 클라이언트가 연결되지 않았습니다.");
    }

    try {
      const info = await this.client.info("memory");
      const usedMemoryMatch = info.match(/used_memory:(\d+)/);

      if (usedMemoryMatch && usedMemoryMatch[1]) {
        return parseInt(usedMemoryMatch[1]);
      }

      throw new Error("Redis 메모리 정보를 파싱할 수 없습니다.");
    } catch (error) {
      console.error("Redis 메모리 사용량 체크 중 오류:", error);
      throw error;
    }
  }

  async deleteKeys(pattern) {
    if (!this.client) {
      throw new Error("Redis 클라이언트가 연결되지 않았습니다.");
    }

    try {
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        const deleted = await this.client.del(...keys);
        console.log(`${pattern} 패턴의 키 ${deleted}개 삭제됨`);
        return deleted;
      }

      return 0;
    } catch (error) {
      console.error(`키 패턴 ${pattern} 삭제 중 오류:`, error);
      throw error;
    }
  }

  async getKeyCount() {
    if (!this.client) {
      throw new Error("Redis 클라이언트가 연결되지 않았습니다.");
    }

    try {
      const info = await this.client.info("keyspace");
      const keyspaceMatch = info.match(/keys=(\d+)/);

      if (keyspaceMatch && keyspaceMatch[1]) {
        return parseInt(keyspaceMatch[1]);
      }

      return 0;
    } catch (error) {
      console.error("Redis 키 개수 조회 중 오류:", error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const redisManager = new RedisManager();

module.exports = redisManager;
