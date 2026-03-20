// src/routes/confession.routes.ts
import { Router } from 'express';
import confessionController from '../controllers/confession.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', confessionController.createConfession);
router.get('/group/:groupId', confessionController.getGroupConfessions);
router.post('/:confessionId/react', confessionController.addReaction);
router.post('/:confessionId/reply', confessionController.addReply);
router.post('/:confessionId/replies/:replyIndex/react', confessionController.addReplyReaction);
router.post('/:confessionId/report', confessionController.reportConfession);
router.delete('/:confessionId', confessionController.deleteConfession);

export default router;
