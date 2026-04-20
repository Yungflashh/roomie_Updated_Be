"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRedis = exports.redisSubClient = exports.redisPubClient = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../utils/logger"));
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
};
exports.redisClient = new ioredis_1.default(redisConfig);
exports.redisPubClient = new ioredis_1.default(redisConfig);
exports.redisSubClient = new ioredis_1.default(redisConfig);
exports.redisClient.on('connect', () => {
    logger_1.default.info('Redis connected');
});
exports.redisClient.on('error', (err) => {
    logger_1.default.error('Redis connection error:', err);
});
exports.redisClient.on('reconnecting', () => {
    logger_1.default.warn('Redis reconnecting...');
});
/**
 * Verify the Redis connection by issuing a PING.
 * Throws if Redis is unreachable.
 */
const initRedis = async () => {
    try {
        await exports.redisClient.ping();
        logger_1.default.info('Redis PING successful');
    }
    catch (error) {
        logger_1.default.error('Redis initialization failed:', error);
        throw error;
    }
};
exports.initRedis = initRedis;
exports.default = exports.redisClient;
//# sourceMappingURL=redis.js.map