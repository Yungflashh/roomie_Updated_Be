"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const redis_1 = require("./config/redis");
const logger_1 = __importDefault(require("./utils/logger"));
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        // Connect to MongoDB
        await (0, database_1.default)();
        // Initialize Redis
        await (0, redis_1.initRedis)();
        // Create Express app
        const app = (0, app_1.default)();
        // Start server
        const server = app.listen(PORT, () => {
            logger_1.default.info(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏠 ROOMIE API SERVER RUNNING                       ║
║                                                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                            ║
║   Port: ${PORT}                                       ║
║   API Version: v1                                     ║
║                                                       ║
║   📱 Mobile-Ready | 🔥 Real-time Chat                ║
║   🎮 Gamification | 💳 Payments                      ║
║   🤖 AI Matching | 📍 Location-Based                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
        });
        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            logger_1.default.info(`\n${signal} received. Closing server gracefully...`);
            server.close(() => {
                logger_1.default.info('Server closed');
                process.exit(0);
            });
            // Force close after 10 seconds
            setTimeout(() => {
                logger_1.default.error('Forced server shutdown');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map