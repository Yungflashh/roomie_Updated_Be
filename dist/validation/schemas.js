"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiatePaymentValidation = exports.submitGameScoreValidation = exports.createGameValidation = exports.createChallengeValidation = exports.locationSearchValidation = exports.paginationValidation = exports.sendMessageValidation = exports.likeUserValidation = exports.createPropertyValidation = exports.updateLocationValidation = exports.updatePreferencesValidation = exports.updateProfileValidation = exports.refreshTokenValidation = exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
// Auth validations
exports.registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),
    (0, express_validator_1.body)('firstName').trim().notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().notEmpty().withMessage('Last name is required'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.refreshTokenValidation = [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
// User profile validations
exports.updateProfileValidation = [
    (0, express_validator_1.body)('firstName').optional().trim().notEmpty(),
    (0, express_validator_1.body)('lastName').optional().trim().notEmpty(),
    (0, express_validator_1.body)('dateOfBirth').optional().isISO8601(),
    (0, express_validator_1.body)('gender').optional().isIn(['male', 'female', 'other']),
    (0, express_validator_1.body)('bio').optional().isLength({ max: 500 }),
    (0, express_validator_1.body)('occupation').optional().trim(),
];
exports.updatePreferencesValidation = [
    (0, express_validator_1.body)('budget.min').optional().isNumeric(),
    (0, express_validator_1.body)('budget.max').optional().isNumeric(),
    (0, express_validator_1.body)('budget.currency').optional().isString(),
    (0, express_validator_1.body)('moveInDate').optional().isISO8601(),
    (0, express_validator_1.body)('leaseDuration').optional().isInt({ min: 1 }),
    (0, express_validator_1.body)('roomType').optional().isIn(['private', 'shared', 'any']),
    (0, express_validator_1.body)('gender').optional().isIn(['male', 'female', 'any']),
];
exports.updateLocationValidation = [
    (0, express_validator_1.body)('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    (0, express_validator_1.body)('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    (0, express_validator_1.body)('address').optional().trim(),
    (0, express_validator_1.body)('city').optional().trim(),
    (0, express_validator_1.body)('state').optional().trim(),
    (0, express_validator_1.body)('country').optional().trim(),
];
// src/validation/schemas.ts - Update createPropertyValidation
exports.createPropertyValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    (0, express_validator_1.body)('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 20, max: 2000 })
        .withMessage('Description must be between 20 and 2000 characters'),
    (0, express_validator_1.body)('type')
        .isIn(['apartment', 'house', 'condo', 'room'])
        .withMessage('Invalid property type'),
    (0, express_validator_1.body)('price')
        .isNumeric()
        .withMessage('Price must be a number')
        .custom((value) => value > 0)
        .withMessage('Price must be greater than 0'),
    (0, express_validator_1.body)('currency')
        .optional()
        .isIn(['NGN', 'USD', 'EUR', 'GBP'])
        .withMessage('Invalid currency'),
    (0, express_validator_1.body)('address')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Address must be less than 200 characters'),
    (0, express_validator_1.body)('city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    (0, express_validator_1.body)('state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),
    (0, express_validator_1.body)('country')
        .optional()
        .trim(),
    (0, express_validator_1.body)('zipCode')
        .optional()
        .trim(),
    // Make latitude and longitude optional
    (0, express_validator_1.body)('latitude')
        .optional({ nullable: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
    (0, express_validator_1.body)('longitude')
        .optional({ nullable: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    (0, express_validator_1.body)('photos')
        .isArray({ min: 1 })
        .withMessage('At least one photo is required'),
    (0, express_validator_1.body)('amenities')
        .optional()
        .isArray()
        .withMessage('Amenities must be an array'),
    (0, express_validator_1.body)('bedrooms')
        .isInt({ min: 0 })
        .withMessage('Bedrooms must be a non-negative integer'),
    (0, express_validator_1.body)('bathrooms')
        .isInt({ min: 0 })
        .withMessage('Bathrooms must be a non-negative integer'),
    (0, express_validator_1.body)('squareFeet')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Square feet must be a non-negative integer'),
    (0, express_validator_1.body)('availableFrom')
        .optional()
        .isISO8601()
        .withMessage('Available from must be a valid date'),
    (0, express_validator_1.body)('leaseDuration')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Lease duration must be at least 1 month'),
    (0, express_validator_1.body)('petFriendly')
        .optional()
        .isBoolean()
        .withMessage('Pet friendly must be a boolean'),
    (0, express_validator_1.body)('smokingAllowed')
        .optional()
        .isBoolean()
        .withMessage('Smoking allowed must be a boolean'),
    (0, express_validator_1.body)('utilitiesIncluded')
        .optional()
        .isBoolean()
        .withMessage('Utilities included must be a boolean'),
    (0, express_validator_1.body)('furnished')
        .optional()
        .isBoolean()
        .withMessage('Furnished must be a boolean'),
    (0, express_validator_1.body)('parkingAvailable')
        .optional()
        .isBoolean()
        .withMessage('Parking available must be a boolean'),
];
exports.likeUserValidation = [
    (0, express_validator_1.param)('targetUserId')
        .isMongoId()
        .withMessage('Valid user ID required'),
];
// Message validations
exports.sendMessageValidation = [
    (0, express_validator_1.body)('matchId').isMongoId().withMessage('Valid match ID required'),
    (0, express_validator_1.body)('type').isIn(['text', 'image', 'video', 'audio', 'file']),
    (0, express_validator_1.body)('content').if((0, express_validator_1.body)('type').equals('text')).notEmpty().withMessage('Message content required'),
];
exports.paginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
];
// Location search validations
exports.locationSearchValidation = [
    (0, express_validator_1.query)('latitude').isFloat({ min: -90, max: 90 }),
    (0, express_validator_1.query)('longitude').isFloat({ min: -180, max: 180 }),
    (0, express_validator_1.query)('radius').optional().isFloat({ min: 0 }).withMessage('Radius must be positive'),
];
// Challenge validations
exports.createChallengeValidation = [
    (0, express_validator_1.body)('title').trim().notEmpty(),
    (0, express_validator_1.body)('description').trim().notEmpty(),
    (0, express_validator_1.body)('type').isIn(['daily', 'weekly', 'monthly']),
    (0, express_validator_1.body)('startDate').isISO8601(),
    (0, express_validator_1.body)('endDate').isISO8601(),
    (0, express_validator_1.body)('pointsReward').isInt({ min: 0 }),
];
// Game validations
exports.createGameValidation = [
    (0, express_validator_1.body)('name').trim().notEmpty(),
    (0, express_validator_1.body)('description').trim().notEmpty(),
    (0, express_validator_1.body)('category').trim().notEmpty(),
    (0, express_validator_1.body)('difficulty').isIn(['easy', 'medium', 'hard']),
    (0, express_validator_1.body)('pointsReward').isInt({ min: 0 }),
];
exports.submitGameScoreValidation = [
    (0, express_validator_1.body)('gameId').isMongoId(),
    (0, express_validator_1.body)('score').isInt({ min: 0 }),
];
// Payment validations
exports.initiatePaymentValidation = [
    (0, express_validator_1.body)('plan').isIn(['premium', 'pro']),
    (0, express_validator_1.body)('duration').isInt({ min: 1 }).withMessage('Duration in months'),
];
//# sourceMappingURL=schemas.js.map