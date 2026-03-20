// src/routes/groupAgreement.routes.ts
import { Router } from 'express';
import groupAgreementController from '../controllers/groupAgreement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/v1/group-agreements/:groupId
 * @desc    Get or create agreement for a group
 * @access  Private
 */
router.post('/:groupId', groupAgreementController.getOrCreateAgreement);

/**
 * @route   GET /api/v1/group-agreements/:groupId
 * @desc    Get agreement by group ID
 * @access  Private
 */
router.get('/:groupId', groupAgreementController.getAgreement);

/**
 * @route   PUT /api/v1/group-agreements/:agreementId/sign
 * @desc    Sign a group agreement
 * @access  Private
 */
router.put('/:agreementId/sign', groupAgreementController.signAgreement);

export default router;
