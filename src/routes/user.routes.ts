// src/routes/user.routes.ts
import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  updateProfileValidation,
  updatePreferencesValidation,
  updateLocationValidation,
} from '../validation/schemas';
import {
  upload,
  setUploadType,
  uploadToCloudinary,
  checkImageDuplicate,
} from '../middleware/upload.middleware';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user's profile
 * @access  Private
 * IMPORTANT: This MUST come BEFORE /:userId
 */
router.get('/me', userController.getMyProfile);



router.get('/me/completion', userController.getProfileCompletion);


/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.patch('/me', userController.updateMyProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', validate(updateProfileValidation), userController.updateProfile);

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', validate(updatePreferencesValidation), userController.updatePreferences);

/**
 * @route   PUT /api/v1/users/lifestyle
 * @desc    Update user lifestyle
 * @access  Private
 */
router.put('/lifestyle', userController.updateLifestyle);

/**
 * @route   PUT /api/v1/users/location
 * @desc    Update user location
 * @access  Private
 */
router.put('/location', validate(updateLocationValidation), userController.updateLocation);

/**
 * @route   POST /api/v1/users/profile-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post(
  '/profile-photo',
  setUploadType('profiles'),
  upload.single('photo'),
  checkImageDuplicate,
  uploadToCloudinary,
  userController.uploadProfilePhoto
);

/**
 * @route   POST /api/v1/users/photos
 * @desc    Add photo to gallery
 * @access  Private
 */
router.post(
  '/photos',
  setUploadType('profiles'),
  upload.single('photo'),
  checkImageDuplicate,
  uploadToCloudinary,
  userController.addPhoto
);

/**
 * @route   POST /api/v1/users/upload-media
 * @desc    Upload a media file (image/video) and return the URL. General purpose.
 * @access  Private
 */
router.post(
  '/upload-media',
  setUploadType('media'),
  upload.single('file'),
  uploadToCloudinary,
  (req: any, res: any) => {
    if (!req.cloudinaryResult) {
      return res.status(400).json({ success: false, message: 'Upload failed' });
    }
    res.status(200).json({
      success: true,
      data: { url: req.cloudinaryResult.url },
    });
  }
);

/**
 * @route   DELETE /api/v1/users/photos
 * @desc    Remove photo from gallery
 * @access  Private
 */
router.delete('/photos', userController.removePhoto);

/**
 * @route   POST /api/v1/users/interests
 * @desc    Add interests
 * @access  Private
 */
router.post('/interests', userController.addInterests);

/**
 * @route   DELETE /api/v1/users/interests
 * @desc    Remove interest
 * @access  Private
 */
router.delete('/interests', userController.removeInterest);

// Get notification settings
router.get('/settings/notifications', userController.getNotificationSettings);
// Update notification settings
router.put('/settings/notifications', userController.updateNotificationSettings);
// Get privacy settings
router.get('/settings/privacy', userController.getPrivacySettings);
// Update privacy settings
router.put('/settings/privacy', userController.updatePrivacySettings);

/**
 * @route   POST /api/v1/users/delete-account
 * @desc    Delete user account (requires password confirmation)
 * @access  Private
 */
router.post('/delete-account', userController.deleteAccount);

/**
 * @route   POST /api/v1/users/block/:targetUserId
 * @desc    Block user
 * @access  Private
 */
router.post('/block/:targetUserId', userController.blockUser);

/**
 * @route   DELETE /api/v1/users/block/:targetUserId
 * @desc    Unblock user
 * @access  Private
 */
router.delete('/block/:targetUserId', userController.unblockUser);

/**
 * @route   POST /api/v1/users/report/:targetUserId
 * @desc    Report user
 * @access  Private
 */
router.post('/report/:targetUserId', userController.reportUser);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user profile by ID
 * @access  Private
 * IMPORTANT: This MUST come AFTER /me and other specific routes
 */
router.get('/:userId', userController.getUserProfile);

// Error handling middleware for multer errors
router.use((error: any, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof multer.MulterError) {
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
router.post('/request-verification', authenticate, async (req: any, res: any) => {
  try {
    const { User } = require('../models');
    const user = await User.findById(req.user.userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    if (user.verified) { res.status(400).json({ success: false, message: 'Already verified' }); return; }
    if ((user as any).metadata?.verificationStatus === 'pending') { res.status(400).json({ success: false, message: 'Verification request already pending' }); return; }

    // Check profile completion >= 80%
    const completion = user.getProfileCompletion();
    if (completion.percentage < 80) {
      res.status(400).json({ success: false, message: `Profile must be at least 80% complete. Currently at ${completion.percentage}%.` });
      return;
    }

    // Check at least 1 social link
    const connectedSocials = (user.socialLinks || []).filter((l: any) => l.connected);
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;