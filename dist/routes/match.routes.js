"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/match.routes.ts
const express_1 = require("express");
const match_controller_1 = __importDefault(require("../controllers/match.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const verification_middleware_1 = require("../middleware/verification.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const schemas_1 = require("../validation/schemas");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/v1/matches/feed
 * @desc    Aggregated matches feed — single endpoint for the Matches screen
 * @access  Private
 */
router.get('/feed', match_controller_1.default.getMatchesFeed);
/**
 * @route   GET /api/v1/matches/near-you
 * @desc    Refresh only Near You data (lightweight, for distance changes)
 * @access  Private
 */
router.get('/near-you', match_controller_1.default.refreshNearYou);
/**
 * @route   GET /api/v1/matches/discover
 * @desc    Get potential matches (Tinder-style)
 * @access  Private
 */
router.get('/discover', match_controller_1.default.getPotentialMatches);
/**
 * @route   GET /api/v1/matches/likes/received
 * @desc    Get users who liked current user (requests received)
 * @access  Private
 */
router.get('/likes/received', match_controller_1.default.getLikes);
/**
 * @route   GET /api/v1/matches/likes/sent
 * @desc    Get users current user has liked (requests sent)
 * @access  Private
 */
router.get('/likes/sent', match_controller_1.default.getSentLikes);
/**
 * @route   POST /api/v1/matches/like/:targetUserId
 * @desc    Like a user (swipe right)
 * @access  Private
 */
router.post('/like/:targetUserId', verification_middleware_1.requireVerification, (0, validation_middleware_1.validate)(schemas_1.likeUserValidation), match_controller_1.default.likeUser);
/**
 * @route   POST /api/v1/matches/request/:targetUserId
 * @desc    Send a match request (visible to recipient, costs more)
 * @access  Private
 */
router.post('/request/:targetUserId', verification_middleware_1.requireVerification, (0, validation_middleware_1.validate)(schemas_1.likeUserValidation), match_controller_1.default.sendMatchRequest);
/**
 * @route   POST /api/v1/matches/pass/:targetUserId
 * @desc    Pass a user (swipe left)
 * @access  Private
 */
router.post('/pass/:targetUserId', (0, validation_middleware_1.validate)(schemas_1.likeUserValidation), match_controller_1.default.passUser);
/**
 * @route   GET /api/v1/matches/compatibility-report/:userId
 * @desc    Get detailed compatibility report between current user and target user
 * @access  Private
 */
router.get('/compatibility-report/:userId', match_controller_1.default.getCompatibilityReport);
/**
 * @route   GET /api/v1/matches
 * @desc    Get user's matches
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(schemas_1.paginationValidation), match_controller_1.default.getMatches);
/**
 * @route   GET /api/v1/matches/:matchId
 * @desc    Get match details
 * @access  Private
 */
router.get('/:matchId', match_controller_1.default.getMatchDetails);
/**
 * @route   POST /api/v1/matches/listing-inquiry
 * @desc    Find or create a match for listing chat
 * @access  Private
 */
router.post('/listing-inquiry', verification_middleware_1.requireVerification, match_controller_1.default.listingInquiry);
/**
 * @route   DELETE /api/v1/matches/:matchId
 * @desc    Unmatch a user
 * @access  Private
 */
router.delete('/:matchId', match_controller_1.default.unmatch);
exports.default = router;
//# sourceMappingURL=match.routes.js.map