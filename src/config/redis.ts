import Redis from 'ioredis';
import logger from '../utils/logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

export const redisClient = new Redis(redisConfig);
export const redisPubClient = new Redis(redisConfig);
export const redisSubClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

/**
 * Verify the Redis connection by issuing a PING.
 * Throws if Redis is unreachable.
 */
export const initRedis = async (): Promise<void> => {
  try {
    await redisClient.ping();
    logger.info('Redis PING successful');
  } catch (error) {
    logger.error('Redis initialization failed:', error);
    throw error;
  }
};

export default redisClient;
