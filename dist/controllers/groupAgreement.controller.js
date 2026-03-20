"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const groupAgreement_service_1 = __importDefault(require("../services/groupAgreement.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class GroupAgreementController {
    getOrCreateAgreement = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const agreement = await groupAgreement_service_1.default.getOrCreateAgreement(groupId, userId);
            res.status(200).json({
                success: true,
                data: { agreement },
            });
        }
        catch (error) {
            logger_1.default.error('Get/create group agreement error:', error);
            res.status(error.message.includes('not') ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to get agreement',
            });
        }
    };
    getAgreement = async (req, res) => {
        try {
            const { groupId } = req.params;
            const agreement = await groupAgreement_service_1.default.getAgreementByGroup(groupId);
            res.status(200).json({
                success: true,
                data: { agreement },
            });
        }
        catch (error) {
            logger_1.default.error('Get group agreement error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get agreement',
            });
        }
    };
    signAgreement = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { agreementId } = req.params;
            const { fullName, moveInDate, leaseEndDate, rentAmount, address } = req.body;
            if (!fullName || !fullName.trim()) {
                res.status(400).json({
                    success: false,
                    message: 'Full name is required',
                });
                return;
            }
            const agreement = await groupAgreement_service_1.default.signAgreement(agreementId, userId, { fullName, moveInDate, leaseEndDate, rentAmount, address });
            res.status(200).json({
                success: true,
                message: 'Agreement signed!',
                data: { agreement },
            });
        }
        catch (error) {
            logger_1.default.error('Sign group agreement error:', error);
            res.status(error.message.includes('already') ? 400 :
                error.message.includes('not part') ? 403 :
                    error.message.includes('not found') ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to sign agreement',
            });
        }
    };
}
exports.default = new GroupAgreementController();
//# sourceMappingURL=groupAgreement.controller.js.map