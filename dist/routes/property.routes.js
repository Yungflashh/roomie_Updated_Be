"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/property.routes.ts
const express_1 = require("express");
const property_controller_1 = __importDefault(require("../controllers/property.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const verification_middleware_1 = require("../middleware/verification.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Simple validation without required lat/lng
const createPropertyValidation = [
    (0, express_validator_1.body)('title').trim().notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('description').trim().notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('type').isIn(['apartment', 'house', 'condo', 'room']).withMessage('Invalid property type'),
    (0, express_validator_1.body)('price').isNumeric().withMessage('Price must be a number'),
    (0, express_validator_1.body)('city').trim().notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('state').trim().notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('photos').isArray({ min: 1 }).withMessage('At least one photo is required'),
    (0, express_validator_1.body)('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
    (0, express_validator_1.body)('bathrooms').isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),
    // Optional fields
    (0, express_validator_1.body)('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
    (0, express_validator_1.body)('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
    (0, express_validator_1.body)('address').optional().trim(),
    (0, express_validator_1.body)('country').optional().trim(),
    (0, express_validator_1.body)('zipCode').optional().trim(),
    (0, express_validator_1.body)('squareFeet').optional().isInt({ min: 0 }),
    (0, express_validator_1.body)('amenities').optional().isArray(),
    (0, express_validator_1.body)('leaseDuration').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('petFriendly').optional().isBoolean(),
    (0, express_validator_1.body)('smokingAllowed').optional().isBoolean(),
    (0, express_validator_1.body)('utilitiesIncluded').optional().isBoolean(),
    (0, express_validator_1.body)('furnished').optional().isBoolean(),
    (0, express_validator_1.body)('parkingAvailable').optional().isBoolean(),
];
/**
 * @route   POST /api/v1/properties
 * @desc    Create property listing
 * @access  Private
 */
router.post('/', (0, validation_middleware_1.validate)(createPropertyValidation), property_controller_1.default.createProperty);
/**
 * @route   GET /api/v1/properties/search
 * @desc    Search properties
 * @access  Private
 */
router.get('/search', property_controller_1.default.searchProperties);
/**
 * @route   GET /api/v1/properties/my-properties
 * @desc    Get landlord's properties
 * @access  Private
 */
router.get('/my-properties', property_controller_1.default.getLandlordProperties);
/**
 * @route   GET /api/v1/properties/liked
 * @desc    Get liked properties
 * @access  Private
 */
router.get('/liked', property_controller_1.default.getLikedProperties);
/**
 * @route   GET /api/v1/properties/:propertyId
 * @desc    Get property details
 * @access  Private
 */
router.get('/:propertyId', verification_middleware_1.requireVerification, property_controller_1.default.getProperty);
/**
 * @route   PUT /api/v1/properties/:propertyId
 * @desc    Update property
 * @access  Private
 */
router.put('/:propertyId', property_controller_1.default.updateProperty);
/**
 * @route   DELETE /api/v1/properties/:propertyId
 * @desc    Delete property
 * @access  Private
 */
router.delete('/:propertyId', property_controller_1.default.deleteProperty);
/**
 * @route   POST /api/v1/properties/:propertyId/like
 * @desc    Like property
 * @access  Private
 */
router.post('/:propertyId/like', property_controller_1.default.likeProperty);
/**
 * @route   DELETE /api/v1/properties/:propertyId/like
 * @desc    Unlike property
 * @access  Private
 */
router.delete('/:propertyId/like', property_controller_1.default.unlikeProperty);
exports.default = router;
//# sourceMappingURL=property.routes.js.map