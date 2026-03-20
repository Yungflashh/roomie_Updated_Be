"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roommateSettings_service_1 = __importDefault(require("../services/roommateSettings.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class RoommateSettingsController {
    async updateGroupFeatures(req, res) {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const { locationSharing, emergencyAlerts, personalityBoard } = req.body;
            const group = await roommateSettings_service_1.default.updateGroupFeatures(groupId, userId, { locationSharing, emergencyAlerts, personalityBoard });
            res.status(200).json({ success: true, data: { group } });
        }
        catch (error) {
            logger_1.default.error('Update group features error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getRoommateLocations(req, res) {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const locations = await roommateSettings_service_1.default.getRoommateLocations(groupId, userId);
            res.status(200).json({ success: true, data: { locations } });
        }
        catch (error) {
            logger_1.default.error('Get roommate locations error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getGroupEmergencyContacts(req, res) {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const contacts = await roommateSettings_service_1.default.getGroupEmergencyContacts(groupId, userId);
            res.status(200).json({ success: true, data: { members: contacts } });
        }
        catch (error) {
            logger_1.default.error('Get emergency contacts error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getGroupPersonalityBoard(req, res) {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const board = await roommateSettings_service_1.default.getGroupPersonalityBoard(groupId, userId);
            res.status(200).json({ success: true, data: { members: board } });
        }
        catch (error) {
            logger_1.default.error('Get personality board error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async updateEmergencyContacts(req, res) {
        try {
            const userId = req.user?.userId;
            const { contacts } = req.body;
            if (!contacts || !Array.isArray(contacts)) {
                res.status(400).json({ success: false, message: 'contacts array is required' });
                return;
            }
            const result = await roommateSettings_service_1.default.updateEmergencyContacts(userId, contacts);
            res.status(200).json({ success: true, data: { emergencyContacts: result } });
        }
        catch (error) {
            logger_1.default.error('Update emergency contacts error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async updatePersonalityInfo(req, res) {
        try {
            const userId = req.user?.userId;
            const { zodiacSign, personalityType } = req.body;
            const result = await roommateSettings_service_1.default.updatePersonalityInfo(userId, { zodiacSign, personalityType });
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            logger_1.default.error('Update personality info error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    // ---- 1-on-1 match-based endpoints ----
    async getMatchLocation(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            const result = await roommateSettings_service_1.default.getMatchLocation(matchId, userId);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            logger_1.default.error('Get match location error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getMatchEmergencyContacts(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            const members = await roommateSettings_service_1.default.getMatchEmergencyContacts(matchId, userId);
            res.status(200).json({ success: true, data: { members } });
        }
        catch (error) {
            logger_1.default.error('Get match emergency contacts error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    async getMatchPersonalityBoard(req, res) {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            const members = await roommateSettings_service_1.default.getMatchPersonalityBoard(matchId, userId);
            res.status(200).json({ success: true, data: { members } });
        }
        catch (error) {
            logger_1.default.error('Get match personality board error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.default = new RoommateSettingsController();
//# sourceMappingURL=roommateSettings.controller.js.map