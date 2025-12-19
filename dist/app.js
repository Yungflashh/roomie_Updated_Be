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
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const logger_1 = __importDefault(require("./utils/logger"));
const createApp = () => {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    // CORS configuration
    const corsOptions = {
        origin: process.env.CLIENT_URL || '*',
        credentials: true,
        optionsSuccessStatus: 200,
    };
    app.use((0, cors_1.default)(corsOptions));
    // Body parsing middleware
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Compression middleware
    app.use((0, compression_1.default)());
    // Request logging
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
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api/', limiter);
    // Static files
    app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'public/uploads')));
    // API routes
    app.use('/api/v1', routes_1.default);
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
    app.use(error_middleware_1.notFoundHandler);
    // Error handler (must be last)
    app.use(error_middleware_1.errorHandler);
    return app;
};
exports.default = createApp;
//# sourceMappingURL=app.js.map