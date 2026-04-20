import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';
import { generalLimiter } from './middleware/rateLimiter';

/**
 * Builds and returns the configured Express application.
 * Does not start listening — the caller is responsible for binding to a port.
 */
const createApp = (): Application => {
  const app = express();

  // Required for express-rate-limit to read the real client IP behind a proxy
  // (Render, Railway, Nginx, etc.) via X-Forwarded-For.
  app.set('trust proxy', 1);

  app.use(helmet());

  const corsOptions = {
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(compression());

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }));
  }

  app.use('/api/', generalLimiter);

  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

  app.use('/api/v1', routes);

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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
