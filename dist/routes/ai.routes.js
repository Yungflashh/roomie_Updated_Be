"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const ai_service_1 = __importDefault(require("../services/ai.service"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Send message & get AI reply (with chat persistence)
router.post('/chat', async (req, res) => {
    try {
        const { messages, chatId } = req.body;
        const userId = req.user?.userId;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            res.status(400).json({ success: false, message: 'Messages array is required' });
            return;
        }
        // Save user message
        const lastUserMsg = messages[messages.length - 1];
        const chat = await ai_service_1.default.saveMessage(userId, chatId || null, 'user', lastUserMsg.content);
        // Get AI reply
        const reply = await ai_service_1.default.chat(messages, userId);
        // Save AI reply
        await ai_service_1.default.saveMessage(userId, chat._id.toString(), 'assistant', reply);
        res.json({
            success: true,
            data: { reply, chatId: chat._id },
        });
    }
    catch (error) {
        const status = error.message?.includes('not configured') ? 503 : 500;
        res.status(status).json({ success: false, message: error.message });
    }
});
// Get chat history list
router.get('/chats', async (req, res) => {
    try {
        const chats = await ai_service_1.default.getChats(req.user?.userId);
        res.json({ success: true, data: chats });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get single chat with messages
router.get('/chats/:chatId', async (req, res) => {
    try {
        const chat = await ai_service_1.default.getChat(req.params.chatId, req.user?.userId);
        if (!chat) {
            res.status(404).json({ success: false, message: 'Chat not found' });
            return;
        }
        res.json({ success: true, data: chat });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Delete a chat
router.delete('/chats/:chatId', async (req, res) => {
    try {
        await ai_service_1.default.deleteChat(req.params.chatId, req.user?.userId);
        res.json({ success: true, message: 'Chat deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get AI preferences
router.get('/preferences', async (req, res) => {
    try {
        const prefs = await ai_service_1.default.getPreferences(req.user?.userId);
        res.json({ success: true, data: prefs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Update AI preferences
router.put('/preferences', async (req, res) => {
    try {
        const { aiName, colorTheme, personality } = req.body;
        const prefs = await ai_service_1.default.updatePreferences(req.user?.userId, { aiName, colorTheme, personality });
        res.json({ success: true, data: prefs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Get suggested questions
router.get('/suggestions', async (_req, res) => {
    const suggestions = ai_service_1.default.getSuggestedQuestions();
    res.json({ success: true, data: { suggestions } });
});
exports.default = router;
//# sourceMappingURL=ai.routes.js.map