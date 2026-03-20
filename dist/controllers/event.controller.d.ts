import { Response } from 'express';
import { AuthRequest } from '../types';
declare class EventController {
    /**
     * Create a new event
     * POST /api/v1/events
     */
    createEvent(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get nearby events
     * GET /api/v1/events/nearby?lat=6.5&lng=3.4&radius=25&category=sports
     */
    getNearbyEvents(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get events created by user
     * GET /api/v1/events/mine
     */
    getMyEvents(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get events user has RSVP'd to
     * GET /api/v1/events/rsvps
     */
    getMyRsvps(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get upcoming events
     * GET /api/v1/events/upcoming?page=1&limit=20
     */
    getUpcomingEvents(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get event by ID
     * GET /api/v1/events/:eventId
     */
    getEventById(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Update an event
     * PUT /api/v1/events/:eventId
     */
    updateEvent(req: AuthRequest, res: Response): Promise<void>;
    /**
     * RSVP to an event
     * POST /api/v1/events/:eventId/rsvp
     */
    rsvpEvent(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Get attendees (host only — includes email)
     * GET /api/v1/events/:eventId/attendees
     */
    getAttendees(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Cancel an event
     * POST /api/v1/events/:eventId/cancel
     */
    cancelEvent(req: AuthRequest, res: Response): Promise<void>;
    /**
     * Delete an event
     * DELETE /api/v1/events/:eventId
     */
    deleteEvent(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: EventController;
export default _default;
//# sourceMappingURL=event.controller.d.ts.map