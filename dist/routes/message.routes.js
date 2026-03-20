"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = __importDefault(require("../controllers/message.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const schemas_1 = require("../validation/schemas");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @route   POST /api/v1/messages
 * @desc    Send message
 * @access  Private
 */
router.post('/', (0, upload_middleware_1.setUploadType)('chat'), upload_middleware_1.upload.single('media'), upload_middleware_1.checkImageDuplicate, 
// NOTE: uploadToCloudinary removed — media messages now use deferred processing
(0, validation_middleware_1.validate)(schemas_1.sendMessageValidation), message_controller_1.default.sendMessage);
/**
 * @route   DELETE /api/v1/messages/pending/:pendingId
 * @desc    Cancel a pending media upload (within 4s window)
 * @access  Private
 */
router.delete('/pending/:pendingId', message_controller_1.default.cancelPendingUpload);
/**
 * @route   GET /api/v1/messages/:matchId
 * @desc    Get messages for a match
 * @access  Private
 */
router.get('/:matchId', (0, validation_middleware_1.validate)(schemas_1.paginationValidation), message_controller_1.default.getMessages);
/**
 * @route   PUT /api/v1/messages/:matchId/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put('/:matchId/read', message_controller_1.default.markAsRead);
/**
 * @route   DELETE /api/v1/messages/:matchId/clear
 * @desc    Clear all messages in a chat (for requesting user only)
 * @access  Private
 */
router.delete('/:matchId/clear', message_controller_1.default.clearChat);
/**
 * @route   DELETE /api/v1/messages/:messageId
 * @desc    Delete message
 * @access  Private
 */
router.delete('/:messageId', message_controller_1.default.deleteMessage);
/**
 * @route   POST /api/v1/messages/:messageId/reaction
 * @desc    Add reaction to message
 * @access  Private
 */
router.post('/:messageId/reaction', message_controller_1.default.addReaction);
/**
 * @route   DELETE /api/v1/messages/:messageId/reaction
 * @desc    Remove reaction from message
 * @access  Private
 */
router.delete('/:messageId/reaction', message_controller_1.default.removeReaction);
/**
 * @route   GET /api/v1/messages/unread/count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread/count', message_controller_1.default.getUnreadCount);
/**
 * @route   GET /api/v1/messages/:matchId/search
 * @desc    Search messages
 * @access  Private
 */
router.get('/:matchId/search', message_controller_1.default.searchMessages);
exports.default = router;
//# sourceMappingURL=message.routes.js.map