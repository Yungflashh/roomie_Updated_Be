// src/routes/property.routes.ts
import { Router } from 'express';
import propertyController from '../controllers/property.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireVerification } from '../middleware/verification.middleware';
import { validate } from '../middleware/validation.middleware';
import { body } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Simple validation without required lat/lng
const createPropertyValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('type').isIn(['apartment', 'house', 'condo', 'room']).withMessage('Invalid property type'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('photos').isArray({ min: 1 }).withMessage('At least one photo is required'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms').isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
  // Optional fields
  body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
  body('address').optional().trim(),
  body('country').optional().trim(),
  body('zipCode').optional().trim(),
  body('squareFeet').optional().isInt({ min: 0 }),
  body('amenities').optional().isArray(),
  body('leaseDuration').optional().isInt({ min: 1 }),
  body('petFriendly').optional().isBoolean(),
  body('smokingAllowed').optional().isBoolean(),
  body('utilitiesIncluded').optional().isBoolean(),
  body('furnished').optional().isBoolean(),
  body('parkingAvailable').optional().isBoolean(),
];

/**
 * @route   POST /api/v1/properties
 * @desc    Create property listing
 * @access  Private
 */
router.post('/', validate(createPropertyValidation), propertyController.createProperty);

/**
 * @route   GET /api/v1/properties/search
 * @desc    Search properties
 * @access  Private
 */
router.get('/search', propertyController.searchProperties);

/**
 * @route   GET /api/v1/properties/my-properties
 * @desc    Get landlord's properties
 * @access  Private
 */
router.get('/my-properties', propertyController.getLandlordProperties);

/**
 * @route   GET /api/v1/properties/liked
 * @desc    Get liked properties
 * @access  Private
 */
router.get('/liked', propertyController.getLikedProperties);

/**
 * @route   GET /api/v1/properties/:propertyId
 * @desc    Get property details
 * @access  Private
 */
router.get('/:propertyId', requireVerification, propertyController.getProperty);

/**
 * @route   PUT /api/v1/properties/:propertyId
 * @desc    Update property
 * @access  Private
 */
router.put('/:propertyId', propertyController.updateProperty);

/**
 * @route   DELETE /api/v1/properties/:propertyId
 * @desc    Delete property
 * @access  Private
 */
router.delete('/:propertyId', propertyController.deleteProperty);

/**
 * @route   POST /api/v1/properties/:propertyId/like
 * @desc    Like property
 * @access  Private
 */
router.post('/:propertyId/like', propertyController.likeProperty);

/**
 * @route   DELETE /api/v1/properties/:propertyId/like
 * @desc    Unlike property
 * @access  Private
 */
router.delete('/:propertyId/like', propertyController.unlikeProperty);

export default router;