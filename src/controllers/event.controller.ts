// src/controllers/event.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import eventService from '../services/event.service';
import logger from '../utils/logger';

class EventController {
  /**
   * Create a new event
   * POST /api/v1/events
   */
  async createEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { title, description, location, date, endDate, category, coverImage, maxAttendees, tags } = req.body;

      if (!title || !description || !location || !date || !category) {
        res.status(400).json({
          success: false,
          message: 'Title, description, location, date, and category are required',
        });
        return;
      }

      const event = await eventService.createEvent(userId, {
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
    } catch (error: any) {
      logger.error('Create event error:', error);
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
  async getNearbyEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { lat, lng, radius = 25, category } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required',
        });
        return;
      }

      const events = await eventService.getNearbyEvents(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string),
        { category: category as string }
      );

      res.status(200).json({
        success: true,
        data: { events },
      });
    } catch (error: any) {
      logger.error('Get nearby events error:', error);
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
  async getMyEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const events = await eventService.getMyEvents(userId);

      res.status(200).json({
        success: true,
        data: { events },
      });
    } catch (error: any) {
      logger.error('Get my events error:', error);
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
  async getMyRsvps(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const events = await eventService.getMyRsvps(userId);

      res.status(200).json({
        success: true,
        data: { events },
      });
    } catch (error: any) {
      logger.error('Get my RSVPs error:', error);
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
  async getUpcomingEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20 } = req.query;

      const result = await eventService.getUpcomingEvents(
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Get upcoming events error:', error);
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
  async getEventById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;
      const event = await eventService.getEventById(eventId);

      res.status(200).json({
        success: true,
        data: { event },
      });
    } catch (error: any) {
      logger.error('Get event by ID error:', error);
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
  async updateEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { eventId } = req.params;

      const event = await eventService.updateEvent(eventId, userId, req.body);

      res.status(200).json({
        success: true,
        data: { event },
      });
    } catch (error: any) {
      logger.error('Update event error:', error);
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
  async rsvpEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { eventId } = req.params;
      const { status } = req.body;

      if (!status || !['going', 'interested', 'not_going'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status (going, interested, not_going) is required',
        });
        return;
      }

      const event = await eventService.rsvpEvent(eventId, userId, status);

      res.status(200).json({
        success: true,
        data: { event },
      });
    } catch (error: any) {
      logger.error('RSVP event error:', error);
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
  async getAttendees(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { eventId } = req.params;
      const result = await eventService.getEventAttendees(eventId, userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Get attendees error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Cancel an event
   * POST /api/v1/events/:eventId/cancel
   */
  async cancelEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { eventId } = req.params;

      const event = await eventService.cancelEvent(eventId, userId);

      res.status(200).json({
        success: true,
        message: 'Event cancelled successfully',
        data: { event },
      });
    } catch (error: any) {
      logger.error('Cancel event error:', error);
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
  async deleteEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { eventId } = req.params;

      await eventService.deleteEvent(eventId, userId);

      res.status(200).json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete event',
      });
    }
  }
}

export default new EventController();
