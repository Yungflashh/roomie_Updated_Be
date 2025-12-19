"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/social.routes.ts
const express_1 = require("express");
const social_auth_controller_1 = __importDefault(require("../controllers/social-auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// OAuth initiation routes (require auth to know which user)
router.get('/facebook/auth', auth_middleware_1.authenticate, social_auth_controller_1.default.initiateFacebookAuth);
router.get('/instagram/auth', auth_middleware_1.authenticate, social_auth_controller_1.default.initiateInstagramAuth);
router.get('/twitter/auth', auth_middleware_1.authenticate, social_auth_controller_1.default.initiateTwitterAuth);
// OAuth callback routes (no auth - callback from social platform)
router.get('/facebook/callback', social_auth_controller_1.default.facebookCallback);
router.get('/instagram/callback', social_auth_controller_1.default.instagramCallback);
// Protected routes
router.use(auth_middleware_1.authenticate);
// Manual linking (for platforms without OAuth or as fallback)
router.post('/link', social_auth_controller_1.default.linkManually);
// Unlink social account
router.delete('/unlink/:platform', social_auth_controller_1.default.unlinkSocial);
// Get social links
router.get('/', social_auth_controller_1.default.getSocialLinks);
// Verify connection
router.get('/verify/:platform', social_auth_controller_1.default.verifySocialConnection);
exports.default = router;
//# sourceMappingURL=social.routes.js.map