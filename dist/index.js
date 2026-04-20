"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const redis_1 = require("./config/redis");
const socket_config_1 = require("./config/socket.config");
const logger_1 = __importDefault(require("./utils/logger"));
const models_1 = require("./models");
const redis_2 = __importDefault(require("./config/redis"));
const clanJobs_1 = require("./jobs/clanJobs");
const PORT = parseInt(process.env.PORT || '5000', 10);
/**
 * Clears stale duplicate-detection hashes from MongoDB and Redis.
 * Called once at startup so stale fingerprints from previous runs don't
 * produce false positives.
 */
async function clearDuplicateData() {
    try {
        await models_1.MediaHash.deleteMany({});
        const keys = await redis_2.default.keys('duplicate:*');
        if (keys.length > 0) {
            await redis_2.default.del(keys);
        }
    }
    catch (error) {
        logger_1.default.error('Error clearing duplicate data:', error);
    }
}
/**
 * Connects to MongoDB and Redis, initialises Socket.IO with the Redis adapter,
 * starts background jobs, and begins accepting HTTP connections.
 */
const startServer = async () => {
    try {
        await (0, database_1.default)();
        await (0, redis_1.initRedis)();
        const app = (0, app_1.default)();
        const httpServer = http_1.default.createServer(app);
        const io = (0, socket_config_1.initializeSocket)(httpServer);
        app.set('io', io);
        (0, clanJobs_1.initClanJobs)();
        // 30 s overall request timeout keeps slow requests from blocking the event loop.
        // keepAliveTimeout is set slightly above a typical load-balancer idle timeout
        // so the LB doesn't close connections that Express still considers live.
        httpServer.timeout = 30000;
        httpServer.keepAliveTimeout = 65000;
        httpServer.headersTimeout = 66000;
        // Raise the TCP backlog for high-concurrency deployments (default 511).
        httpServer.listen(PORT, '0.0.0.0', 2048, () => {
            logger_1.default.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ROOMIE API SERVER RUNNING                           ║
║                                                       ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(37)}║
║   Port:        ${String(PORT).padEnd(37)}║
║   API Version: v1                                     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
        });
        const gracefulShutdown = (signal) => {
            logger_1.default.info(`${signal} received. Closing server gracefully...`);
            io.close(() => {
                logger_1.default.info('Socket.IO closed');
            });
            httpServer.close(() => {
                logger_1.default.info('Server closed');
                process.exit(0);
            });
            setTimeout(() => {
                logger_1.default.error('Forced server shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception:', error);
            // Only exit on memory exhaustion; transient errors should not bring down the server.
            if (error.message?.includes('ENOMEM') || error.message?.includes('out of memory')) {
                process.exit(1);
            }
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
clearDuplicateData();
//# sourceMappingURL=index.js.map