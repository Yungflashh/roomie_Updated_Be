import { body, query, param } from 'express-validator';

// Auth validations
export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

// User profile validations
export const updateProfileValidation = [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('dateOfBirth').optional().isISO8601(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('bio').optional().isLength({ max: 500 }),
  body('occupation').optional().trim(),
];

export const updatePreferencesValidation = [
  body('budget.min').optional().isNumeric(),
  body('budget.max').optional().isNumeric(),
  body('budget.currency').optional().isString(),
  body('moveInDate').optional().isISO8601(),
  body('leaseDuration').optional().isInt({ min: 1 }),
  body('roomType').optional().isIn(['private', 'shared', 'any']),
  body('gender').optional().isIn(['male', 'female', 'any']),
];

export const updateLocationValidation = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('address').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
];

// src/validation/schemas.ts - Update createPropertyValidation

export const createPropertyValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  
  body('type')
    .isIn(['apartment', 'house', 'condo', 'room'])
    .withMessage('Invalid property type'),
  
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => value > 0)
    .withMessage('Price must be greater than 0'),
  
  body('currency')
    .optional()
    .isIn(['NGN', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  
  body('country')
    .optional()
    .trim(),
  
  body('zipCode')
    .optional()
    .trim(),
  
  // Make latitude and longitude optional
  body('latitude')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('photos')
    .isArray({ min: 1 })
    .withMessage('At least one photo is required'),
  
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  
  body('bedrooms')
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a non-negative integer'),
  
  body('bathrooms')
    .isInt({ min: 0 })
    .withMessage('Bathrooms must be a non-negative integer'),
  
  body('squareFeet')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Square feet must be a non-negative integer'),
  
  body('availableFrom')
    .optional()
    .isISO8601()
    .withMessage('Available from must be a valid date'),
  
  body('leaseDuration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Lease duration must be at least 1 month'),
  
  body('petFriendly')
    .optional()
    .isBoolean()
    .withMessage('Pet friendly must be a boolean'),
  
  body('smokingAllowed')
    .optional()
    .isBoolean()
    .withMessage('Smoking allowed must be a boolean'),
  
  body('utilitiesIncluded')
    .optional()
    .isBoolean()
    .withMessage('Utilities included must be a boolean'),
  
  body('furnished')
    .optional()
    .isBoolean()
    .withMessage('Furnished must be a boolean'),
  
  body('parkingAvailable')
    .optional()
    .isBoolean()
    .withMessage('Parking available must be a boolean'),
];

export const likeUserValidation = [
  param('targetUserId')
    .isMongoId()
    .withMessage('Valid user ID required'),
];

// Message validations
export const sendMessageValidation = [
  body('matchId').isMongoId().withMessage('Valid match ID required'),
  body('type').isIn(['text', 'image', 'video', 'audio', 'file']),
  body('content').if(body('type').equals('text')).notEmpty().withMessage('Message content required'),
];

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Location search validations
export const locationSearchValidation = [
  query('latitude').isFloat({ min: -90, max: 90 }),
  query('longitude').isFloat({ min: -180, max: 180 }),
  query('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be positive'),
];

// Challenge validations
export const createChallengeValidation = [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('type').isIn(['daily', 'weekly', 'monthly']),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('pointsReward').isInt({ min: 0 }),
];

// Game validations
export const createGameValidation = [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('category').trim().notEmpty(),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('pointsReward').isInt({ min: 0 }),
];

export const submitGameScoreValidation = [
  body('gameId').isMongoId(),
  body('score').isInt({ min: 0 }),
];

// Payment validations
export const initiatePaymentValidation = [
  body('plan').isIn(['premium', 'pro']),
  body('duration').isInt({ min: 1 }).withMessage('Duration in months'),
];
