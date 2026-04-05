import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis';

const createRedisStore = (prefix: string) => new RedisStore({
  sendCommand: (...args: string[]) => (redisClient as any).call(...args),
  prefix: `rl:${prefix}:`,
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('general'),
  skip: (req) => {
    const skipPaths = ['/api/v1/messages', '/api/v1/notifications', '/api/v1/matches/check', '/api/v1/activity'];
    return skipPaths.some(path => req.path.startsWith(path));
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('upload'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('auth'),
  skipSuccessfulRequests: true,
});
