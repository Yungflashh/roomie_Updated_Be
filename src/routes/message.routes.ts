import { Router } from 'express';
import messageController from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { sendMessageValidation, paginationValidation } from '../validation/schemas';
import {
  upload,
  setUploadType,
  checkImageDuplicate,
  checkVideoDuplicate,
} from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/messages
 * @desc    Send message
 * @access  Private
 */
router.post(
  '/',
  setUploadType('chat'),
  upload.single('media'),
  checkImageDuplicate,
  validate(sendMessageValidation),
  messageController.sendMessage
);

/**
 * @route   GET /api/v1/messages/:matchId
 * @desc    Get messages for a match
 * @access  Private
 */
router.get(
  '/:matchId',
  validate(paginationValidation),
  messageController.getMessages
);

/**
 * @route   PUT /api/v1/messages/:matchId/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put('/:matchId/read', messageController.markAsRead);

/**
 * @route   DELETE /api/v1/messages/:messageId
 * @desc    Delete message
 * @access  Private
 */
router.delete('/:messageId', messageController.deleteMessage);

/**
 * @route   POST /api/v1/messages/:messageId/reaction
 * @desc    Add reaction to message
 * @access  Private
 */
router.post('/:messageId/reaction', messageController.addReaction);

/**
 * @route   DELETE /api/v1/messages/:messageId/reaction
 * @desc    Remove reaction from message
 * @access  Private
 */
router.delete('/:messageId/reaction', messageController.removeReaction);

/**
 * @route   GET /api/v1/messages/unread/count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread/count', messageController.getUnreadCount);

/**
 * @route   GET /api/v1/messages/:matchId/search
 * @desc    Search messages
 * @access  Private
 */
router.get('/:matchId/search', messageController.searchMessages);

export default router;
