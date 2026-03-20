"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const event_service_1 = __importDefault(require("../services/event.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class EventController {
    /**
     * Create a new event
     * POST /api/v1/events
     */
    async createEvent(req, res) {
        try {
            const userId = req.user?.userId;
            const { title, description, location, date, endDate, category, coverImage, maxAttendees, tags } = req.body;
            if (!title || !description || !location || !date || !category) {
                res.status(400).json({
                    success: false,
                    message: 'Title, description, location, date, and category are required',
                });
                return;
            }
            const event = await event_service_1.default.createEvent(userId, {
                title,
                description,
                location,
                date,
                endDate,
                category,
                coverImage,
                maxAttendees,
                tags,
            });
            res.status(201).json({
                success: true,
                data: { event },
            });
        }
        catch (error) {
            logger_1.default.error('Create event error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create event',
            });
        }
    }
    /**
     * Get nearby events
     * GET /api/v1/events/nearby?lat=6.5&lng=3.4&radius=25&category=sports
     */
    async getNearbyEvents(req, res) {
        try {
            const { lat, lng, radius = 25, category } = req.query;
            if (!lat || !lng) {
                res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required',
                });
                return;
            }
            const events = await event_service_1.default.getNearbyEvents(parseFloat(lat), parseFloat(lng), parseFloat(radius), { category: category });
            res.status(200).json({
                success: true,
                data: { events },
            });
        }
        catch (error) {
            logger_1.default.error('Get nearby events error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get nearby events',
            });
        }
    }
    /**
     * Get events created by user
     * GET /api/v1/events/mine
     */
    async getMyEvents(req, res) {
        try {
            const userId = req.user?.userId;
            const events = await event_service_1.default.getMyEvents(userId);
            res.status(200).json({
                success: true,
                data: { events },
            });
        }
        catch (error) {
            logger_1.default.error('Get my events error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get your events',
            });
        }
    }
    /**
     * Get events user has RSVP'd to
     * GET /api/v1/events/rsvps
     */
    async getMyRsvps(req, res) {
        try {
            const userId = req.user?.userId;
            const events = await event_service_1.default.getMyRsvps(userId);
            res.status(200).json({
                success: true,
                data: { events },
            });
        }
        catch (error) {
            logger_1.default.error('Get my RSVPs error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get your RSVPs',
            });
        }
    }
    /**
     * Get upcoming events
     * GET /api/v1/events/upcoming?page=1&limit=20
     */
    async getUpcomingEvents(req, res) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const result = await event_service_1.default.getUpcomingEvents(parseInt(page), parseInt(limit));
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            logger_1.default.error('Get upcoming events error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get upcoming events',
            });
        }
    }
    /**
     * Get event by ID
     * GET /api/v1/events/:eventId
     */
    async getEventById(req, res) {
        try {
            const { eventId } = req.params;
            const event = await event_service_1.default.getEventById(eventId);
            res.status(200).json({
                success: true,
                data: { event },
            });
        }
        catch (error) {
            logger_1.default.error('Get event by ID error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get event',
            });
        }
    }
    /**
     * Update an event
     * PUT /api/v1/events/:eventId
     */
    async updateEvent(req, res) {
        try {
            const userId = req.user?.userId;
            const { eventId } = req.params;
            const event = await event_service_1.default.updateEvent(eventId, userId, req.body);
            res.status(200).json({
                success: true,
                data: { event },
            });
        }
        catch (error) {
            logger_1.default.error('Update event error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update event',
            });
        }
    }
    /**
     * RSVP to an event
     * POST /api/v1/events/:eventId/rsvp
     */
    async rsvpEvent(req, res) {
        try {
            const userId = req.user?.userId;
            const { eventId } = req.params;
            const { status } = req.body;
            if (!status || !['going', 'interested', 'not_going'].includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Valid status (going, interested, not_going) is required',
                });
                return;
            }
            const event = await event_service_1.default.rsvpEvent(eventId, userId, status);
            res.status(200).json({
                success: true,
                data: { event },
            });
        }
        catch (error) {
            logger_1.default.error('RSVP event error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to RSVP to event',
            });
        }
    }
    /**
     * Get attendees (host only — includes email)
     * GET /api/v1/events/:eventId/attendees
     */
    async getAttendees(req, res) {
        try {
            const userId = req.user?.userId;
            const { eventId } = req.params;
            const result = await event_service_1.default.getEventAttendees(eventId, userId);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            logger_1.default.error('Get attendees error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
    /**
     * Cancel an event
     * POST /api/v1/events/:eventId/cancel
     */
    async cancelEvent(req, res) {
        try {
            const userId = req.user?.userId;
            const { eventId } = req.params;
            const event = await event_service_1.default.cancelEvent(eventId, userId);
            res.status(200).json({
                success: true,
                message: 'Event cancelled successfully',
                data: { event },
            });
        }
        catch (error) {
            logger_1.default.error('Cancel event error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to cancel event',
            });
        }
    }
    /**
     * Delete an event
     * DELETE /api/v1/events/:eventId
     */
    async deleteEvent(req, res) {
        try {
            const userId = req.user?.userId;
            const { eventId } = req.params;
            await event_service_1.default.deleteEvent(eventId, userId);
            res.status(200).json({
                success: true,
                message: 'Event deleted successfully',
            });
        }
        catch (error) {
            logger_1.default.error('Delete event error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete event',
            });
        }
    }
}
exports.default = new EventController();
//# sourceMappingURL=event.controller.js.map