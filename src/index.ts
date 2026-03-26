// src/index.ts (Backend)
import dotenv from 'dotenv';
dotenv.config();

import http from 'http';  // <-- Make sure this is imported
import createApp from './app';
import connectDB from './config/database';
import { initRedis } from './config/redis';
import { initializeSocket } from './config/socket.config';  // <-- Import socket config
import logger from './utils/logger';
import { MediaHash } from './models';
import redisClient from './config/redis';
import { initClanJobs } from './jobs/clanJobs';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function clearDuplicateData() {
  try {
    await MediaHash.deleteMany({});
    const keys = await redisClient.keys('duplicate:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    console.log('✅ Cleared duplicate detection data');
  } catch (error) {
    console.error('Error clearing duplicate data:', error);
  }
}

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Redis
    await initRedis();

    // Create Express app
    const app = createApp();

    // Create HTTP server (IMPORTANT: wrap express app)
    const httpServer = http.createServer(app);

    // Initialize Socket.IO (IMPORTANT: pass httpServer, not app)
    const io = initializeSocket(httpServer);

    // Make io accessible in routes
    app.set('io', io);

    // Initialize cron jobs
    initClanJobs();

    // Start server - USE httpServer.listen, NOT app.listen
    // Prevent slow requests from piling up and blocking the event loop
    httpServer.timeout = 30000;       // 30s overall request timeout
    httpServer.keepAliveTimeout = 65000; // slightly above typical LB idle timeout
    httpServer.headersTimeout = 66000;

    // Increase backlog for high-concurrency load (default 511 is too low for 1000+ VUs)
    httpServer.listen(PORT, '0.0.0.0', 2048, () => {
      logger.info(`
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
    const gracefulShutdown = (signal: string) => {
      logger.info(`\n${signal} received. Closing server gracefully...`);
      
      io.close(() => {
        logger.info('Socket.IO closed');
      });

      httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced server shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      // Only exit on truly fatal errors, not transient failures under load
      if (error.message?.includes('ENOMEM') || error.message?.includes('out of memory')) {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Log but don't crash — let the server recover
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
clearDuplicateData();