// src/routes/match.routes.ts
import { Router } from 'express';
import matchController from '../controllers/match.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { likeUserValidation, paginationValidation } from '../validation/schemas';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/matches/discover
 * @desc    Get potential matches (Tinder-style)
 * @access  Private
 */
router.get('/discover', matchController.getPotentialMatches);

/**
 * @route   GET /api/v1/matches/likes/received
 * @desc    Get users who liked current user (requests received)
 * @access  Private
 */
router.get('/likes/received', matchController.getLikes);

/**
 * @route   GET /api/v1/matches/likes/sent
 * @desc    Get users current user has liked (requests sent)
 * @access  Private
 */
router.get('/likes/sent', matchController.getSentLikes);

/**
 * @route   POST /api/v1/matches/like/:targetUserId
 * @desc    Like a user (swipe right)
 * @access  Private
 */
router.post('/like/:targetUserId', validate(likeUserValidation), matchController.likeUser);

/**
 * @route   POST /api/v1/matches/pass/:targetUserId
 * @desc    Pass a user (swipe left)
 * @access  Private
 */
router.post('/pass/:targetUserId', validate(likeUserValidation), matchController.passUser);

/**
 * @route   GET /api/v1/matches
 * @desc    Get user's matches
 * @access  Private
 */
router.get('/', validate(paginationValidation), matchController.getMatches);

/**
 * @route   GET /api/v1/matches/:matchId
 * @desc    Get match details
 * @access  Private
 */
router.get('/:matchId', matchController.getMatchDetails);

/**
 * @route   DELETE /api/v1/matches/:matchId
 * @desc    Unmatch a user
 * @access  Private
 */
router.delete('/:matchId', matchController.unmatch);

export default router;