import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import weeklyChallengeService from '../services/weeklyChallenge.service';

const router = Router();
router.use(authenticate);

// Get active challenges
router.get('/active', async (req: any, res) => {
  try {
    const challenges = await weeklyChallengeService.getActiveChallenges(req.user?.userId);
    res.json({ success: true, data: challenges });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Join a challenge
router.post('/:challengeId/join', async (req: any, res) => {
  try {
    await weeklyChallengeService.joinChallenge(req.params.challengeId, req.user?.userId!);
    res.json({ success: true, message: 'Joined challenge!' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Get weekly leaderboard
router.get('/leaderboard', async (req: any, res) => {
  try {
    const leaderboard = await weeklyChallengeService.getWeeklyLeaderboard(50);
    res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
