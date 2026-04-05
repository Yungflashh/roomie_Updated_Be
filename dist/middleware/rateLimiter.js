"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.uploadLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_1 = require("../config/redis");
const createRedisStore = (prefix) => new rate_limit_redis_1.RedisStore({
    sendCommand: (...args) => redis_1.redisClient.call(...args),
    prefix: `rl:${prefix}:`,
});
exports.generalLimiter = (0, express_rate_limit_1.default)({
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
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many upload requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('upload'),
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore('auth'),
    skipSuccessfulRequests: true,
});
//# sourceMappingURL=rateLimiter.js.map