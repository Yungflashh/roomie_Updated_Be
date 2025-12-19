"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const schemas_1 = require("../validation/schemas");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user profile
 * @access  Private
 */
router.get('/:userId', user_controller_1.default.getUserProfile);
/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', (0, validation_middleware_1.validate)(schemas_1.updateProfileValidation), user_controller_1.default.updateProfile);
/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', (0, validation_middleware_1.validate)(schemas_1.updatePreferencesValidation), user_controller_1.default.updatePreferences);
/**
 * @route   PUT /api/v1/users/lifestyle
 * @desc    Update user lifestyle
 * @access  Private
 */
router.put('/lifestyle', user_controller_1.default.updateLifestyle);
/**
 * @route   PUT /api/v1/users/location
 * @desc    Update user location
 * @access  Private
 */
router.put('/location', (0, validation_middleware_1.validate)(schemas_1.updateLocationValidation), user_controller_1.default.updateLocation);
/**
 * @route   POST /api/v1/users/profile-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post('/profile-photo', (0, upload_middleware_1.setUploadType)('profiles'), upload_middleware_1.upload.single('photo'), upload_middleware_1.checkImageDuplicate, upload_middleware_1.processImage, user_controller_1.default.uploadProfilePhoto);
/**
 * @route   POST /api/v1/users/photos
 * @desc    Add photo to gallery
 * @access  Private
 */
router.post('/photos', (0, upload_middleware_1.setUploadType)('profiles'), upload_middleware_1.upload.single('photo'), upload_middleware_1.checkImageDuplicate, upload_middleware_1.processImage, user_controller_1.default.addPhoto);
/**
 * @route   DELETE /api/v1/users/photos
 * @desc    Remove photo from gallery
 * @access  Private
 */
router.delete('/photos', user_controller_1.default.removePhoto);
/**
 * @route   POST /api/v1/users/interests
 * @desc    Add interests
 * @access  Private
 */
router.post('/interests', user_controller_1.default.addInterests);
/**
 * @route   DELETE /api/v1/users/interests
 * @desc    Remove interest
 * @access  Private
 */
router.delete('/interests', user_controller_1.default.removeInterest);
/**
 * @route   POST /api/v1/users/block/:targetUserId
 * @desc    Block user
 * @access  Private
 */
router.post('/block/:targetUserId', user_controller_1.default.blockUser);
/**
 * @route   DELETE /api/v1/users/block/:targetUserId
 * @desc    Unblock user
 * @access  Private
 */
router.delete('/block/:targetUserId', user_controller_1.default.unblockUser);
/**
 * @route   POST /api/v1/users/report/:targetUserId
 * @desc    Report user
 * @access  Private
 */
router.post('/report/:targetUserId', user_controller_1.default.reportUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map