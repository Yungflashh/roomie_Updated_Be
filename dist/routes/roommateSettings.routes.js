"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/roommateSettings.routes.ts
const express_1 = require("express");
const roommateSettings_controller_1 = __importDefault(require("../controllers/roommateSettings.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Group feature toggles
router.put('/group/:groupId/features', roommateSettings_controller_1.default.updateGroupFeatures);
// Location sharing
router.get('/group/:groupId/locations', roommateSettings_controller_1.default.getRoommateLocations);
// Emergency contacts
router.get('/group/:groupId/emergency-contacts', roommateSettings_controller_1.default.getGroupEmergencyContacts);
router.put('/emergency-contacts', roommateSettings_controller_1.default.updateEmergencyContacts);
// Personality board
router.get('/group/:groupId/personality-board', roommateSettings_controller_1.default.getGroupPersonalityBoard);
router.put('/personality', roommateSettings_controller_1.default.updatePersonalityInfo);
// ---- 1-on-1 match-based routes ----
router.get('/match/:matchId/location', roommateSettings_controller_1.default.getMatchLocation);
router.get('/match/:matchId/emergency-contacts', roommateSettings_controller_1.default.getMatchEmergencyContacts);
router.get('/match/:matchId/personality-board', roommateSettings_controller_1.default.getMatchPersonalityBoard);
exports.default = router;
//# sourceMappingURL=roommateSettings.routes.js.map