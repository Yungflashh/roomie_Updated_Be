"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const user_controller_1 = __importDefault(require("../controllers/user.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const schemas_1 = require("../validation/schemas");
const upload_middleware_1 = require("../middleware/upload.middleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user's profile
 * @access  Private
 * IMPORTANT: This MUST come BEFORE /:userId
 */
router.get('/me', user_controller_1.default.getMyProfile);
router.get('/me/completion', user_controller_1.default.getProfileCompletion);
/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.patch('/me', user_controller_1.default.updateMyProfile);
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
router.post('/profile-photo', (0, upload_middleware_1.setUploadType)('profiles'), upload_middleware_1.upload.single('photo'), upload_middleware_1.checkImageDuplicate, upload_middleware_1.uploadToCloudinary, user_controller_1.default.uploadProfilePhoto);
/**
 * @route   POST /api/v1/users/photos
 * @desc    Add photo to gallery
 * @access  Private
 */
router.post('/photos', (0, upload_middleware_1.setUploadType)('profiles'), upload_middleware_1.upload.single('photo'), upload_middleware_1.checkImageDuplicate, upload_middleware_1.uploadToCloudinary, user_controller_1.default.addPhoto);
/**
 * @route   POST /api/v1/users/upload-media
 * @desc    Upload a media file (image/video) and return the URL. General purpose.
 * @access  Private
 */
router.post('/upload-media', (0, upload_middleware_1.setUploadType)('media'), upload_middleware_1.upload.single('file'), upload_middleware_1.uploadToCloudinary, (req, res) => {
    if (!req.cloudinaryResult) {
        return res.status(400).json({ success: false, message: 'Upload failed' });
    }
    res.status(200).json({
        success: true,
        data: { url: req.cloudinaryResult.url },
    });
});
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
// Get notification settings
router.get('/settings/notifications', user_controller_1.default.getNotificationSettings);
// Update notification settings
router.put('/settings/notifications', user_controller_1.default.updateNotificationSettings);
// Get privacy settings
router.get('/settings/privacy', user_controller_1.default.getPrivacySettings);
// Update privacy settings
router.put('/settings/privacy', user_controller_1.default.updatePrivacySettings);
/**
 * @route   POST /api/v1/users/delete-account
 * @desc    Delete user account (requires password confirmation)
 * @access  Private
 */
router.post('/delete-account', user_controller_1.default.deleteAccount);
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
/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user profile by ID
 * @access  Private
 * IMPORTANT: This MUST come AFTER /me and other specific routes
 */
router.get('/:userId', user_controller_1.default.getUserProfile);
// Error handling middleware for multer errors
router.use((error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || '50'}MB`,
            });
            return;
        }
        res.status(400).json({
            success: false,
            message: error.message,
        });
        return;
    }
    if (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Upload failed',
        });
        return;
    }
    next();
});
// Request verification with KYC documents
router.post('/request-verification', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const { User } = require('../models');
        const user = await User.findById(req.user.userId);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        if (user.verified) {
            res.status(400).json({ success: false, message: 'Already verified' });
            return;
        }
        if (user.metadata?.verificationStatus === 'pending') {
            res.status(400).json({ success: false, message: 'Verification request already pending' });
            return;
        }
        // Check profile completion >= 80%
        const completion = user.getProfileCompletion();
        if (completion.percentage < 80) {
            res.status(400).json({ success: false, message: `Profile must be at least 80% complete. Currently at ${completion.percentage}%.` });
            return;
        }
        // Check at least 1 social link
        const connectedSocials = (user.socialLinks || []).filter((l) => l.connected);
        if (connectedSocials.length < 1) {
            res.status(400).json({ success: false, message: 'At least one social media account must be linked.' });
            return;
        }
        // Check KYC documents
        const { documentType, idFrontPhoto, idBackPhoto } = req.body;
        if (!documentType) {
            res.status(400).json({ success: false, message: 'Please select a document type.' });
            return;
        }
        if (!idFrontPhoto || !idBackPhoto) {
            res.status(400).json({ success: false, message: 'Front and back photos of your document are required.' });
            return;
        }
        await User.findByIdAndUpdate(req.user.userId, {
            $set: {
                'metadata.verificationRequested': true,
                'metadata.verificationRequestedAt': new Date(),
                'metadata.verificationStatus': 'pending',
                'metadata.kycDocuments': { documentType, idFrontPhoto, idBackPhoto, submittedAt: new Date() },
            },
        });
        res.json({ success: true, message: 'Verification request submitted! An admin will review your documents.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map