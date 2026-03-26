"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts (Backend)
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http")); // <-- Make sure this is imported
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const redis_1 = require("./config/redis");
const socket_config_1 = require("./config/socket.config"); // <-- Import socket config
const logger_1 = __importDefault(require("./utils/logger"));
const models_1 = require("./models");
const redis_2 = __importDefault(require("./config/redis"));
const clanJobs_1 = require("./jobs/clanJobs");
const PORT = parseInt(process.env.PORT || '5000', 10);
async function clearDuplicateData() {
    try {
        await models_1.MediaHash.deleteMany({});
        const keys = await redis_2.default.keys('duplicate:*');
        if (keys.length > 0) {
            await redis_2.default.del(keys);
        }
        console.log('✅ Cleared duplicate detection data');
    }
    catch (error) {
        console.error('Error clearing duplicate data:', error);
    }
}
const startServer = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.default)();
        // Initialize Redis
        await (0, redis_1.initRedis)();
        // Create Express app
        const app = (0, app_1.default)();
        // Create HTTP server (IMPORTANT: wrap express app)
        const httpServer = http_1.default.createServer(app);
        // Initialize Socket.IO (IMPORTANT: pass httpServer, not app)
        const io = (0, socket_config_1.initializeSocket)(httpServer);
        // Make io accessible in routes
        app.set('io', io);
        // Initialize cron jobs
        (0, clanJobs_1.initClanJobs)();
        // Start server - USE httpServer.listen, NOT app.listen
        // Prevent slow requests from piling up and blocking the event loop
        httpServer.timeout = 30000; // 30s overall request timeout
        httpServer.keepAliveTimeout = 65000; // slightly above typical LB idle timeout
        httpServer.headersTimeout = 66000;
        // Increase backlog for high-concurrency load (default 511 is too low for 1000+ VUs)
        httpServer.listen(PORT, '0.0.0.0', 2048, () => {
            logger_1.default.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏠 ROOMIE API SERVER RUNNING                       ║
║                                                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   Port: ${PORT}                                       ║
║   API Version: v1                                     ║
║                                                       ║
║   🌐 Local:   http://localhost:${PORT}               ║
║   📱 Network: http://192.168.191.66:${PORT}          ║
║                                                       ║
║   🔌 WebSocket: ENABLED                              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
        });
        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            logger_1.default.info(`\n${signal} received. Closing server gracefully...`);
            io.close(() => {
                logger_1.default.info('Socket.IO closed');
            });
            httpServer.close(() => {
                logger_1.default.info('Server closed');
                process.exit(0);
            });
            setTimeout(() => {
                logger_1.default.error('Forced server shutdown');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception:', error);
            // Only exit on truly fatal errors, not transient failures under load
            if (error.message?.includes('ENOMEM') || error.message?.includes('out of memory')) {
                process.exit(1);
            }
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
            // Log but don't crash — let the server recover
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