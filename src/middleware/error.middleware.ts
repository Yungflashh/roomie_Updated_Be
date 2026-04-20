import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/** Operational error with an explicit HTTP status code. */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Central error handler. Must be registered last in the middleware chain. */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/** Catches requests that matched no route. Socket.IO paths are forwarded. */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.path.startsWith('/socket.io')) {
    return next();
  }

  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
};
