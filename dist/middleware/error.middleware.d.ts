import { Request, Response, NextFunction } from 'express';
/** Operational error with an explicit HTTP status code. */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number);
}
/** Central error handler. Must be registered last in the middleware chain. */
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, next: NextFunction) => void;
/** Catches requests that matched no route. Socket.IO paths are forwarded. */
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map