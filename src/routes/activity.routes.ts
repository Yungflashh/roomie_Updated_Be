import { Router, Response } from 'express';
import { UserActivity } from '../models/UserActivity';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate);

// Record a session heartbeat (call every 60s from frontend)
router.post('/heartbeat', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false }); return; }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const activity = await UserActivity.findOneAndUpdate(
      { user: userId, date: today },
      {
        $inc: { totalSeconds: 60 },
        $set: { lastSessionStart: new Date() },
        $setOnInsert: { sessions: 1 },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { totalSeconds: activity.totalSeconds } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Record session start
router.post('/session-start', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false }); return; }

    const today = new Date().toISOString().slice(0, 10);

    await UserActivity.findOneAndUpdate(
      { user: userId, date: today },
      {
        $inc: { sessions: 1 },
        $set: { lastSessionStart: new Date() },
      },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
