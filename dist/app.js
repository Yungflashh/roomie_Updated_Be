"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const logger_1 = __importDefault(require("./utils/logger"));
const rateLimiter_1 = require("./middleware/rateLimiter");
/**
 * Builds and returns the configured Express application.
 * Does not start listening — the caller is responsible for binding to a port.
 */
const createApp = () => {
    const app = (0, express_1.default)();
    // Required for express-rate-limit to read the real client IP behind a proxy
    // (Render, Railway, Nginx, etc.) via X-Forwarded-For.
    app.set('trust proxy', 1);
    app.use((0, helmet_1.default)());
    const corsOptions = {
        origin: process.env.CLIENT_URL || '*',
        credentials: true,
        optionsSuccessStatus: 200,
    };
    app.use((0, cors_1.default)(corsOptions));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use((0, compression_1.default)());
    if (process.env.NODE_ENV === 'development') {
        app.use((0, morgan_1.default)('dev'));
    }
    else {
        app.use((0, morgan_1.default)('combined', {
            stream: {
                write: (message) => logger_1.default.info(message.trim()),
            },
        }));
    }
    app.use('/api/', rateLimiter_1.generalLimiter);
    app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'public/uploads')));
    app.use('/api/v1', routes_1.default);
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
    app.use(error_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
};
exports.default = createApp;
//# sourceMappingURL=app.js.map