"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const property_controller_1 = __importDefault(require("../controllers/property.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/properties
 * @desc    Create property listing
 * @access  Private (Landlords)
 */
router.post('/', (0, validation_middleware_1.validate)(schemas_1.createPropertyValidation), property_controller_1.default.createProperty);
/**
 * @route   GET /api/v1/properties/search
 * @desc    Search properties
 * @access  Private
 */
router.get('/search', property_controller_1.default.searchProperties);
/**
 * @route   GET /api/v1/properties/my-properties
 * @desc    Get landlord's properties
 * @access  Private (Landlords)
 */
router.get('/my-properties', (0, validation_middleware_1.validate)(schemas_1.paginationValidation), property_controller_1.default.getLandlordProperties);
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
router.get('/:propertyId', property_controller_1.default.getProperty);
/**
 * @route   PUT /api/v1/properties/:propertyId
 * @desc    Update property
 * @access  Private (Landlords)
 */
router.put('/:propertyId', property_controller_1.default.updateProperty);
/**
 * @route   DELETE /api/v1/properties/:propertyId
 * @desc    Delete property
 * @access  Private (Landlords)
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