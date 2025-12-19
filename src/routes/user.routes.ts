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

export default router;