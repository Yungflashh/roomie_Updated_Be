import { Router } from 'express';
import listingInquiryController from '../controllers/listingInquiry.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Create inquiry
router.post('/', listingInquiryController.create);

// My inquiries (as seeker)
router.get('/my-inquiries', listingInquiryController.getMyInquiries);

// Inquiries on my listings (as lister)
router.get('/my-listings', listingInquiryController.getMyListingInquiries);

// Get single inquiry
router.get('/:inquiryId', listingInquiryController.getInquiry);

// Viewing flow
router.post('/:inquiryId/viewing/request', listingInquiryController.requestViewing);
router.put('/:inquiryId/viewing/respond', listingInquiryController.respondToViewing);
router.put('/:inquiryId/viewing/complete', listingInquiryController.completeViewing);
router.put('/:inquiryId/viewing/cancel', listingInquiryController.cancelViewing);

// Offer flow
router.post('/:inquiryId/offer', listingInquiryController.makeOffer);
router.put('/:inquiryId/offer/respond', listingInquiryController.respondToOffer);

// Withdraw
router.put('/:inquiryId/withdraw', listingInquiryController.withdraw);

export default router;
