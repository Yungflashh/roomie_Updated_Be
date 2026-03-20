import { Router } from 'express';
import rentalAgreementController from '../controllers/rentalAgreement.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Get my agreements
router.get('/', rentalAgreementController.getMyAgreements);

// Create agreement from inquiry
router.post('/inquiry/:inquiryId', rentalAgreementController.create);

// Get agreement by inquiry
router.get('/inquiry/:inquiryId', rentalAgreementController.getByInquiry);

// Get agreement by ID
router.get('/:agreementId', rentalAgreementController.getAgreement);

// Update terms
router.put('/:agreementId/terms', rentalAgreementController.updateTerms);

// Sign agreement
router.put('/:agreementId/sign', rentalAgreementController.sign);

// Terminate agreement
router.put('/:agreementId/terminate', rentalAgreementController.terminate);

export default router;
