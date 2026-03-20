// src/routes/roommateAgreement.routes.ts
import { Router } from 'express';
import roommateAgreementController from '../controllers/roommateAgreement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/roommate-agreements
 * @desc    Get all my agreements
 * @access  Private
 */
router.get('/', roommateAgreementController.getMyAgreements);

/**
 * @route   POST /api/v1/roommate-agreements/:matchId
 * @desc    Get or create agreement for a match
 * @access  Private
 */
router.post('/:matchId', roommateAgreementController.getOrCreateAgreement);

/**
 * @route   GET /api/v1/roommate-agreements/:matchId
 * @desc    Get agreement by match ID
 * @access  Private
 */
router.get('/:matchId', roommateAgreementController.getAgreement);

/**
 * @route   PUT /api/v1/roommate-agreements/:agreementId/sign
 * @desc    Sign an agreement
 * @access  Private
 */
router.put('/:agreementId/sign', roommateAgreementController.signAgreement);

export default router;
