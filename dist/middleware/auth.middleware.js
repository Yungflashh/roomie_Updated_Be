"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access token is required',
            });
            return;
        }
        const token = authHeader.substring(7);
        try {
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
            };
            next();
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    message: 'Access token expired',
                    code: 'TOKEN_EXPIRED',
                });
                return;
            }
            res.status(401).json({
                success: false,
                message: 'Invalid access token',
            });
            return;
        }
    }
    catch (error) {
        logger_1.default.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed',
        });
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = (0, jwt_1.verifyAccessToken)(token);
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                };
            }
            catch (error) {
                // Ignore errors for optional auth
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
//# sourceMappingURL=auth.middleware.js.map