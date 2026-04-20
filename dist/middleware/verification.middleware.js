"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerification = requireVerification;
const models_1 = require("../models");
/**
 * Requires the authenticated user to have completed identity verification
 * before accessing the route. Returns 403 with code VERIFICATION_REQUIRED otherwise.
 */
async function requireVerification(req, res, next) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const user = await models_1.User.findById(userId).select('verified').lean();
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        if (!user.verified) {
            res.status(403).json({
                success: false,
                message: 'Account verification required. Please verify your identity to use this feature.',
                code: 'VERIFICATION_REQUIRED',
            });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Verification check failed' });
    }
}
//# sourceMappingURL=verification.middleware.js.map