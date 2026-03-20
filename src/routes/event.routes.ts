// src/routes/event.routes.ts
import { Router } from 'express';
import eventController from '../controllers/event.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', eventController.createEvent);
router.get('/nearby', eventController.getNearbyEvents);
router.get('/mine', eventController.getMyEvents);
router.get('/rsvps', eventController.getMyRsvps);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/:eventId', eventController.getEventById);
router.put('/:eventId', eventController.updateEvent);
router.post('/:eventId/rsvp', eventController.rsvpEvent);
router.get('/:eventId/attendees', eventController.getAttendees);
router.post('/:eventId/cancel', eventController.cancelEvent);
router.delete('/:eventId', eventController.deleteEvent);

export default router;
