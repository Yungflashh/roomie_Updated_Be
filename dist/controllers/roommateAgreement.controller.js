"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roommateAgreement_service_1 = __importDefault(require("../services/roommateAgreement.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class RoommateAgreementController {
    /**
     * Get or create agreement for a match
     */
    getOrCreateAgreement = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const { matchId } = req.params;
            const agreement = await roommateAgreement_service_1.default.getOrCreateAgreement(matchId, userId);
            res.status(200).json({
                success: true,
                data: { agreement },
            });
        }
        catch (error) {
            logger_1.default.error('Get/create agreement error:', error);
            res.status(error.message.includes('not') ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to get agreement',
            });
        }
    };
    /**
     * Get agreement by match ID
     */
    getAgreement = async (req, res) => {
        try {
            const { matchId } = req.params;
            const agreement = await roommateAgreement_service_1.default.getAgreementByMatch(matchId);
            res.status(200).json({
                success: true,
                data: { agreement },
            });
        }
        catch (error) {
            logger_1.default.error('Get agreement error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get agreement',
            });
        }
    };
    /**
     * Sign agreement
     */
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
            const agreement = await roommateAgreement_service_1.default.signAgreement(agreementId, userId, { fullName, moveInDate, leaseEndDate, rentAmount, address });
            res.status(200).json({
                success: true,
                message: 'Agreement signed!',
                data: { agreement },
            });
        }
        catch (error) {
            logger_1.default.error('Sign agreement error:', error);
            res.status(error.message.includes('already') ? 400 :
                error.message.includes('not part') ? 403 :
                    error.message.includes('not found') ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to sign agreement',
            });
        }
    };
    /**
     * Get all my agreements
     */
    getMyAgreements = async (req, res) => {
        try {
            const userId = req.user?.userId;
            const agreements = await roommateAgreement_service_1.default.getMyAgreements(userId);
            res.status(200).json({
                success: true,
                data: { agreements, count: agreements.length },
            });
        }
        catch (error) {
            logger_1.default.error('Get my agreements error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get agreements',
            });
        }
    };
}
exports.default = new RoommateAgreementController();
//# sourceMappingURL=roommateAgreement.controller.js.map