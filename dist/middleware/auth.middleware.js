"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Verifies the Bearer access token on every protected route.
 * Also checks the user's moderation status and auto-lifts expired suspensions/bans.
 */
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
            if (!decoded.isAdmin) {
                const { User } = await Promise.resolve().then(() => __importStar(require('../models')));
                const user = await User.findById(decoded.userId).select('moderation isActive').lean();
                if (user) {
                    const mod = user.moderation;
                    if (mod?.status === 'restricted') {
                        res.status(403).json({
                            success: false,
                            code: 'ACCOUNT_RESTRICTED',
                            message: `Your account has been permanently restricted. Reason: ${mod.reason || 'Violation of community guidelines'}. Contact support@roomieng.com for appeals.`,
                        });
                        return;
                    }
                    if (mod?.status === 'suspended' && mod.suspendedUntil && new Date(mod.suspendedUntil) > new Date()) {
                        const until = new Date(mod.suspendedUntil).toLocaleDateString('en-NG', { dateStyle: 'medium' });
                        res.status(403).json({
                            success: false,
                            code: 'ACCOUNT_SUSPENDED',
                            message: `Your account is suspended until ${until}. Reason: ${mod.reason || 'Violation of community guidelines'}.`,
                        });
                        return;
                    }
                    if (mod?.status === 'banned' && mod.suspendedUntil && new Date(mod.suspendedUntil) > new Date()) {
                        const mins = Math.ceil((new Date(mod.suspendedUntil).getTime() - Date.now()) / 60000);
                        res.status(403).json({
                            success: false,
                            code: 'ACCOUNT_BANNED',
                            message: `Your account is temporarily banned for ${mins} more minute(s). Reason: ${mod.reason || 'Violation of community guidelines'}.`,
                        });
                        return;
                    }
                    if (mod?.status !== 'active' && mod?.status !== 'restricted') {
                        if (!mod?.suspendedUntil || new Date(mod.suspendedUntil) <= new Date()) {
                            await User.findByIdAndUpdate(decoded.userId, { 'moderation.status': 'active' });
                        }
                    }
                }
            }
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
/**
 * Attempts to populate `req.user` from a Bearer token if present,
 * but does not reject the request if the token is absent or invalid.
 */
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
            catch {
                // Token invalid — continue without user context
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