import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import matchRoutes from './match.routes';
import messageRoutes from './message.routes';
import propertyRoutes from './property.routes';
import gameRoutes from './game.routes';
import challengeRoutes from './challenge.routes';
import discoveryRoutes from './discovery.routes';
import socialRoutes from './social.routes';
import notificationRoutes from './notification.routes';
import roomatesRoutes from './roommate.routes';
import roommateFeaturesRoutes from './roommateFeatures.routes';
import roommateGroupRoutes from './roommateGroup.routes';





const router = Router();

// API v1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/matches', matchRoutes);
router.use('/messages', messageRoutes);
router.use('/properties', propertyRoutes);
router.use('/games', gameRoutes);
router.use('/challenges', challengeRoutes);
router.use('/discover', discoveryRoutes);
router.use('/social', socialRoutes);
router.use('/notifications', notificationRoutes);
router.use('/roommates', roomatesRoutes);
router.use('/roommate-features', roommateFeaturesRoutes);
router.use('/roommate-groups', roommateGroupRoutes);



// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
