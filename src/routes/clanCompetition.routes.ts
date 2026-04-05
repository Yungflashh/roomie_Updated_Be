import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { AuthRequest } from '../types';
import clanCompetitionService from '../services/clanCompetition.service';

const router = Router();

router.use(authenticate);

// Get current competition status & leaderboard
router.get('/current', async (req: AuthRequest, res: Response) => {
  try {
    const data = await clanCompetitionService.getLeaderboard();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register clan for competition
router.post('/register/:clanId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
    const competition = await clanCompetitionService.registerClan(req.params.clanId, userId);
    res.json({ success: true, data: { month: competition.month, competitors: competition.competitors.length, prizeTier: competition.prizeTier, status: competition.status } });
  } catch (error: any) {
    const status = error.message.includes('Only') || error.message.includes('needs') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
});

// Admin: finalize competition (call at month end via cron)
router.post('/finalize', async (req: AuthRequest, res: Response) => {
  try {
    const result = await clanCompetitionService.finalizeCompetition(req.body.month);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
