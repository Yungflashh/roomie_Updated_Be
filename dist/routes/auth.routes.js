"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', (0, validation_middleware_1.validate)(schemas_1.registerValidation), auth_controller_1.default.register);
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', (0, validation_middleware_1.validate)(schemas_1.loginValidation), auth_controller_1.default.login);
/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', (0, validation_middleware_1.validate)(schemas_1.refreshTokenValidation), auth_controller_1.default.refreshToken);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.default.logout);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.default.getMe);
/**
 * @route   PUT /api/v1/auth/fcm-token
 * @desc    Update FCM token
 * @access  Private
 */
router.put('/fcm-token', auth_middleware_1.authenticate, auth_controller_1.default.updateFcmToken);
/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put('/change-password', auth_middleware_1.authenticate, auth_controller_1.default.changePassword);
/**
 * @route   DELETE /api/v1/auth/account
 * @desc    Delete account
 * @access  Private
 */
router.delete('/account', auth_middleware_1.authenticate, auth_controller_1.default.deleteAccount);
router.get('/streak', auth_middleware_1.authenticate, auth_controller_1.default.getStreak); // ✅ NEW ENDPOINT
exports.default = router;
//# sourceMappingURL=auth.routes.js.map