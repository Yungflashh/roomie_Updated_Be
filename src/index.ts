import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import createApp from './app';
import connectDB from './config/database';
import { initRedis } from './config/redis';
import { initializeSocket } from './config/socket.config';
import logger from './utils/logger';
import { MediaHash } from './models';
import redisClient from './config/redis';
import { initClanJobs } from './jobs/clanJobs';

const PORT = parseInt(process.env.PORT || '5000', 10);

/**
 * Clears stale duplicate-detection hashes from MongoDB and Redis.
 * Called once at startup so stale fingerprints from previous runs don't
 * produce false positives.
 */
async function clearDuplicateData(): Promise<void> {
  try {
    await MediaHash.deleteMany({});
    const keys = await redisClient.keys('duplicate:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error('Error clearing duplicate data:', error);
  }
}

/**
 * Connects to MongoDB and Redis, initialises Socket.IO with the Redis adapter,
 * starts background jobs, and begins accepting HTTP connections.
 */
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await initRedis();

    const app = createApp();
    const httpServer = http.createServer(app);

    const io = initializeSocket(httpServer);
    app.set('io', io);

    initClanJobs();

    // 30 s overall request timeout keeps slow requests from blocking the event loop.
    // keepAliveTimeout is set slightly above a typical load-balancer idle timeout
    // so the LB doesn't close connections that Express still considers live.
    httpServer.timeout = 30000;
    httpServer.keepAliveTimeout = 65000;
    httpServer.headersTimeout = 66000;

    // Raise the TCP backlog for high-concurrency deployments (default 511).
    httpServer.listen(PORT, '0.0.0.0', 2048, () => {
      logger.info(`
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

    const gracefulShutdown = (signal: string): void => {
      logger.info(`${signal} received. Closing server gracefully...`);

      io.close(() => {
        logger.info('Socket.IO closed');
      });

      httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced server shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      // Only exit on memory exhaustion; transient errors should not bring down the server.
      if (error.message?.includes('ENOMEM') || error.message?.includes('out of memory')) {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
clearDuplicateData();
