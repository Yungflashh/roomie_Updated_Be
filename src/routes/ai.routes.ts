import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import aiService from '../services/ai.service';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// Send message & get AI reply (with chat persistence)
router.post('/chat', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messages, chatId } = req.body;
    const userId = req.user?.userId!;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, message: 'Messages array is required' });
      return;
    }

    // Save user message
    const lastUserMsg = messages[messages.length - 1];
    const chat = await aiService.saveMessage(userId, chatId || null, 'user', lastUserMsg.content);

    // Get AI reply
    const reply = await aiService.chat(messages, userId);

    // Save AI reply
    await aiService.saveMessage(userId, chat._id.toString(), 'assistant', reply);

    res.json({
      success: true,
      data: { reply, chatId: chat._id },
    });
  } catch (error: any) {
    const status = error.message?.includes('not configured') ? 503 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// Get chat history list
router.get('/chats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chats = await aiService.getChats(req.user?.userId!);
    res.json({ success: true, data: chats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single chat with messages
router.get('/chats/:chatId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const chat = await aiService.getChat(req.params.chatId, req.user?.userId!);
    if (!chat) {
      res.status(404).json({ success: false, message: 'Chat not found' });
      return;
    }
    res.json({ success: true, data: chat });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a chat
router.delete('/chats/:chatId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await aiService.deleteChat(req.params.chatId, req.user?.userId!);
    res.json({ success: true, message: 'Chat deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get AI preferences
router.get('/preferences', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const prefs = await aiService.getPreferences(req.user?.userId!);
    res.json({ success: true, data: prefs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update AI preferences
router.put('/preferences', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { aiName, colorTheme, personality } = req.body;
    const prefs = await aiService.updatePreferences(req.user?.userId!, { aiName, colorTheme, personality });
    res.json({ success: true, data: prefs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get suggested questions
router.get('/suggestions', async (_req: AuthRequest, res: Response): Promise<void> => {
  const suggestions = aiService.getSuggestedQuestions();
  res.json({ success: true, data: { suggestions } });
});

export default router;
