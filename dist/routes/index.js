"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const match_routes_1 = __importDefault(require("./match.routes"));
const message_routes_1 = __importDefault(require("./message.routes"));
const property_routes_1 = __importDefault(require("./property.routes"));
const game_routes_1 = __importDefault(require("./game.routes"));
const challenge_routes_1 = __importDefault(require("./challenge.routes"));
const discovery_routes_1 = __importDefault(require("./discovery.routes"));
const social_routes_1 = __importDefault(require("./social.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const roommate_routes_1 = __importDefault(require("./roommate.routes"));
const roommateFeatures_routes_1 = __importDefault(require("./roommateFeatures.routes"));
const roommateGroup_routes_1 = __importDefault(require("./roommateGroup.routes"));
const router = (0, express_1.Router)();
// API v1 routes
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/matches', match_routes_1.default);
router.use('/messages', message_routes_1.default);
router.use('/properties', property_routes_1.default);
router.use('/games', game_routes_1.default);
router.use('/challenges', challenge_routes_1.default);
router.use('/discover', discovery_routes_1.default);
router.use('/social', social_routes_1.default);
router.use('/notifications', notification_routes_1.default);
router.use('/roommates', roommate_routes_1.default);
router.use('/roommate-features', roommateFeatures_routes_1.default);
router.use('/roommate-groups', roommateGroup_routes_1.default);
// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map