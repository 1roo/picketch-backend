const { gzip, gunzip } = require("zlib");
const { promisify } = require("util");
const redisConfig = require("../config/redis");

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * 데이터 압축 유틸리티
 * @param {Object|String} data - 압축할 데이터
 * @param {Number} threshold - 압축 임계값 (바이트)
 * @returns {Object} 압축된 데이터와 압축 여부
 */
async function compressData(
  data,
  threshold = redisConfig.memoryManagement.compression.threshold,
) {
  const stringData = typeof data === "string" ? data : JSON.stringify(data);

  // 임계값보다 작으면 압축하지 않음
  if (
    stringData.length < threshold ||
    !redisConfig.memoryManagement.compression.enabled
  ) {
    return {
      data: stringData,
      compressed: false,
    };
  }

  try {
    const options = { level: redisConfig.memoryManagement.compression.compressionLevel };
    const compressed = await gzipAsync(Buffer.from(stringData), options);
    return {
      data: compressed.toString("base64"),
      compressed: true,
    };
  } catch (error) {
    console.error("압축 중 오류 발생:", error);
    // 압축 실패 시 원본 반환
    return {
      data: stringData,
      compressed: false,
    };
  }
}

/**
 * 압축된 데이터 해제 유틸리티
 * @param {String} data - 압축된 데이터
 * @param {Boolean} isCompressed - 압축 여부
 * @returns {Object|String} 압축 해제된 데이터
 */
async function decompressData(data, isCompressed) {
  if (!isCompressed) {
    try {
      return typeof data === "string" && data.startsWith("{") ? JSON.parse(data) : data;
    } catch (e) {
      return data; // JSON이 아닌 경우 그대로 반환
    }
  }

  try {
    const decompressed = await gunzipAsync(Buffer.from(data, "base64"));
    return JSON.parse(decompressed.toString());
  } catch (error) {
    console.error("압축 해제 중 오류 발생:", error);
    return data; // 해제 실패 시 원본 반환
  }
}

/**
 * Redis 저장 유틸리티 (압축 처리 포함)
 * @param {Object} redis - Redis 클라이언트
 * @param {String} key - 저장할 키
 * @param {Object|String} data - 저장할 데이터
 * @param {Number} expireTime - 만료 시간 (초)
 */
async function saveToRedis(
  redis,
  key,
  data,
  expireTime = redisConfig.memoryManagement.cache.defaultDuration,
) {
  try {
    const { data: compressedData, compressed } = await compressData(data);

    const pipeline = redis.pipeline();
    pipeline.set(key, compressedData);

    // 데이터가 압축되었는지 표시하는 메타데이터 저장
    if (compressed) {
      pipeline.set(`${key}:meta`, "compressed");
      pipeline.expire(`${key}:meta`, expireTime);
    }

    // 만료 시간 설정
    if (expireTime > 0) {
      pipeline.expire(key, expireTime);
    }

    await pipeline.exec();
    return true;
  } catch (error) {
    console.error(`Redis 저장 오류 (${key}):`, error);
    return false;
  }
}

async function getFromRedis(redis, key) {
  try {
    const pipeline = redis.pipeline();
    pipeline.get(key);
    pipeline.get(`${key}:meta`);

    const results = await pipeline.exec();
    const data = results[0][1];
    const meta = results[1][1];

    if (!data) return null;

    const isCompressed = meta === "compressed";
    return await decompressData(data, isCompressed);
  } catch (error) {
    console.error(`Redis 조회 오류 (${key}):`, error);
    return null;
  }
}

async function performRedisCleanup(redis) {
  console.log("Redis 정리 작업 시작...");
  const startTime = Date.now();
  let cleanedKeys = 0;
  const config = redisConfig;

  try {
    // 메모리 사용량 체크
    const memoryUsage = await redis.info("memory");
    const usedMemory = parseInt(
      memoryUsage
        .split("\r\n")
        .find((line) => line.startsWith("used_memory:"))
        .split(":")[1],
    );

    if (usedMemory < config.memoryManagement.limits.memoryThreshold) {
      console.log(`메모리 사용량이 임계값 이하입니다: ${usedMemory} 바이트`);
      return;
    }

    // 1. 모든 키 프리픽스에 대한 정리
    for (const prefix of Object.values(config.keyPrefix)) {
      const keys = await redis.keys(`${prefix}*`);
      console.log(`'${prefix}' 프리픽스로 ${keys.length}개 키 발견`);

      for (const key of keys) {
        // 메타데이터 키 제외
        if (key.endsWith(":meta")) continue;

        try {
          // TTL 체크 (만료 시간이 설정되어 있지 않은 키 제거)
          const ttl = await redis.ttl(key);
          if (ttl === -1) {
            // 만료 시간 없음
            await redis.del(key);
            await redis.del(`${key}:meta`);
            cleanedKeys++;
            continue;
          }

          // 오래된 데이터 정리
          if (
            key.startsWith(config.keyPrefix.history) ||
            key.startsWith(config.keyPrefix.notification)
          ) {
            const data = await getFromRedis(redis, key);
            if (data && data.timestamp) {
              const age = Date.now() - new Date(data.timestamp).getTime();
              if (age > config.memoryManagement.cache.defaultDuration * 1000 * 2) {
                await redis.del(key);
                await redis.del(`${key}:meta`);
                cleanedKeys++;
              }
            }
          }
        } catch (err) {
          console.error(`키 ${key} 처리 중 오류:`, err);
        }
      }
    }

    // 2. 리스트 크기 제한 적용
    const historyKeys = await redis.keys(`${config.keyPrefix.history}*`);
    for (const key of historyKeys) {
      const listLength = await redis.llen(key);
      if (listLength > config.memoryManagement.limits.maxHistory) {
        await redis.ltrim(key, 0, config.memoryManagement.limits.maxHistory - 1);
      }
    }

    // 3. 사용자 상태 정보에 만료 시간 설정
    const userStatusKeys = await redis.keys(`${config.keyPrefix.userStatus}*`);
    for (const key of userStatusKeys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) {
        await redis.expire(key, config.memoryManagement.cache.userStatus);
      }
    }

    const elapsedTime = Date.now() - startTime;
    console.log(
      `Redis 정리 작업 완료: ${cleanedKeys}개 키 정리됨, 소요 시간: ${elapsedTime}ms`,
    );
  } catch (error) {
    console.error("Redis 정리 작업 중 오류 발생:", error);
  }
}

module.exports = {
  compressData,
  decompressData,
  saveToRedis,
  getFromRedis,
  performRedisCleanup,
};
