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
/** @route POST /api/v1/auth/register — Public */
router.post('/register', (0, validation_middleware_1.validate)(schemas_1.registerValidation), auth_controller_1.default.register);
/** @route POST /api/v1/auth/login — Public */
router.post('/login', (0, validation_middleware_1.validate)(schemas_1.loginValidation), auth_controller_1.default.login);
/** @route POST /api/v1/auth/refresh-token — Public */
router.post('/refresh-token', (0, validation_middleware_1.validate)(schemas_1.refreshTokenValidation), auth_controller_1.default.refreshToken);
/** @route POST /api/v1/auth/logout — Private */
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.default.logout);
/** @route GET /api/v1/auth/me — Private */
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.default.getMe);
/** @route PUT /api/v1/auth/fcm-token — Private */
router.put('/fcm-token', auth_middleware_1.authenticate, auth_controller_1.default.updateFcmToken);
/** @route PUT /api/v1/auth/change-password — Private */
router.put('/change-password', auth_middleware_1.authenticate, auth_controller_1.default.changePassword);
/** @route DELETE /api/v1/auth/account — Private */
router.delete('/account', auth_middleware_1.authenticate, auth_controller_1.default.deleteAccount);
/** @route GET /api/v1/auth/streak — Private */
router.get('/streak', auth_middleware_1.authenticate, auth_controller_1.default.getStreak);
/** @route POST /api/v1/auth/send-verification — Private */
router.post('/send-verification', auth_middleware_1.authenticate, auth_controller_1.default.sendVerification);
/** @route POST /api/v1/auth/verify-email — Private */
router.post('/verify-email', auth_middleware_1.authenticate, auth_controller_1.default.verifyEmail);
/** @route POST /api/v1/auth/forgot-password — Public */
router.post('/forgot-password', auth_controller_1.default.forgotPassword);
/** @route POST /api/v1/auth/verify-reset-code — Public */
router.post('/verify-reset-code', auth_controller_1.default.verifyResetCode);
/** @route POST /api/v1/auth/reset-password — Public */
router.post('/reset-password', auth_controller_1.default.resetPassword);
/** @route POST /api/v1/auth/google — Public — body: { idToken } */
router.post('/google', auth_controller_1.default.googleLogin);
/** @route POST /api/v1/auth/apple — Public — body: { identityToken, authorizationCode, email?, firstName?, lastName? } */
router.post('/apple', auth_controller_1.default.appleLogin);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map