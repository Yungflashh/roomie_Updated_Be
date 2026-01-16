import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';









// Create rate limiters
// 1. General API rate limiter - permissive for regular use
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // 1000 requests per 15 min
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for real-time/high-frequency endpoints
    const skipPaths = [
      '/api/v1/messages',
      '/api/v1/notifications',
      '/api/v1/matches/check',
    ];
    return skipPaths.some(path => req.path.startsWith(path));
  }
});

// 2. Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// 3. Moderate limiter for resource-intensive operations
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 uploads per 15 minutes
  message: 'Too many upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOptions = {
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression middleware
  app.use(compression());

  // Request logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }));
  }

  // Apply general rate limiting to all API routes
  app.use('/api/', generalLimiter);

  // Static files
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  // API routes
  app.use('/api/v1', routes);

  // Root route
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Roomie API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        matches: '/api/v1/matches',
        messages: '/api/v1/messages',
        properties: '/api/v1/properties',
        games: '/api/v1/games',
        challenges: '/api/v1/challenges',
        payments: '/api/v1/payments',
        notifications: '/api/v1/notifications',
        discovery: '/api/v1/discover',
      },
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;