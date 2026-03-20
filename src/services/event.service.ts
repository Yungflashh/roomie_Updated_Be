// src/services/event.service.ts
import { Event } from '../models/Event';
import { User } from '../models/User';
import { Notification } from '../models/Transaction';
import { emitNotification } from '../config/socket.config';
import weeklyChallengeService from './weeklyChallenge.service';
import logger from '../utils/logger';

class EventService {
  /**
   * Create a new event
   */
  async createEvent(userId: string, data: any) {
    try {
      const doc = new Event({
        ...data,
        creator: userId,
        attendees: [{
          user: userId,
          status: 'going',
          respondedAt: new Date(),
        }],
      });
      await doc.save();

      // Populate so response has full creator/attendee info
      const event = await Event.findById(doc._id)
        .populate('creator', 'firstName lastName profilePhoto')
        .populate('attendees.user', 'firstName lastName profilePhoto');

      return event;
    } catch (error: any) {
      logger.error('Create event error:', error);
      throw new Error(error.message || 'Failed to create event');
    }
  }

  /**
   * Get event by ID with populated fields
   */
  async getEventById(eventId: string) {
    try {
      // Increment views
      await Event.findByIdAndUpdate(eventId, { $inc: { views: 1 } });

      const event = await Event.findById(eventId)
        .populate('creator', 'firstName lastName profilePhoto')
        .populate('attendees.user', 'firstName lastName profilePhoto');

      if (!event) {
        throw new Error('Event not found');
      }

      return event;
    } catch (error: any) {
      logger.error('Get event by ID error:', error);
      throw new Error(error.message || 'Failed to get event');
    }
  }

  /**
   * Get nearby events using geospatial query
   */
  async getNearbyEvents(lat: number, lng: number, radiusKm: number = 25, filters: { category?: string } = {}) {
    try {
      const query: any = {
        date: { $gte: new Date() },
        isActive: true,
        isCancelled: false,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            $maxDistance: radiusKm * 1000, // Convert km to meters
          },
        },
      };

      if (filters.category) {
        query.category = filters.category;
      }

      const events = await Event.find(query)
        .populate('creator', 'firstName lastName profilePhoto')
        .populate('attendees.user', 'firstName lastName profilePhoto')
        .limit(50)
        .lean();

      return events;
    } catch (error: any) {
      logger.error('Get nearby events error:', error);
      throw new Error(error.message || 'Failed to get nearby events');
    }
  }

  /**
   * RSVP to an event
   */
  async rsvpEvent(eventId: string, userId: string, status: 'going' | 'interested' | 'not_going') {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.isCancelled) {
        throw new Error('This event has been cancelled');
      }

      // Check maxAttendees for 'going' status
      if (status === 'going' && event.maxAttendees) {
        const goingCount = event.attendees.filter(a => a.status === 'going').length;
        const existingAttendee = event.attendees.find(a => a.user.toString() === userId);
        const isAlreadyGoing = existingAttendee?.status === 'going';

        if (goingCount >= event.maxAttendees && !isAlreadyGoing) {
          throw new Error('Event has reached maximum capacity');
        }
      }

      // Upsert attendee
      const existingIndex = event.attendees.findIndex(a => a.user.toString() === userId);
      if (existingIndex >= 0) {
        event.attendees[existingIndex].status = status;
        event.attendees[existingIndex].respondedAt = new Date();
      } else {
        event.attendees.push({
          user: userId as any,
          status,
          respondedAt: new Date(),
        });
      }

      await event.save();

      // Track challenge progress for event RSVP
      if (status === 'going' || status === 'interested') {
        try { await weeklyChallengeService.trackAction(userId, 'event_rsvp'); } catch (e) { logger.warn('Challenge tracking (event_rsvp) error:', e); }
      }

      // Notify host when someone RSVPs as "going"
      if (status === 'going' && event.creator.toString() !== userId) {
        try {
          const rsvpUser = await User.findById(userId).select('firstName lastName');
          const host = await User.findById(event.creator).select('notificationSettings');

          if (host?.notificationSettings?.roommateActivity !== false) {
            const notification = await Notification.create({
              user: event.creator,
              type: 'system',
              title: 'New Event Attendee',
              body: `${rsvpUser?.firstName} ${rsvpUser?.lastName} is going to your event "${event.title}"`,
              data: { eventId: event._id.toString() },
            });
            emitNotification(event.creator.toString(), notification.toObject());
          }
        } catch (e) {
          logger.warn('Failed to notify event host:', e);
        }
      }

      // Return populated event
      const populated = await Event.findById(event._id)
        .populate('creator', 'firstName lastName profilePhoto')
        .populate('attendees.user', 'firstName lastName profilePhoto');

      return populated;
    } catch (error: any) {
      logger.error('RSVP event error:', error);
      throw new Error(error.message || 'Failed to RSVP to event');
    }
  }

  /**
   * Get attendees list for host (includes email for planning)
   */
  async getEventAttendees(eventId: string, userId: string) {
    try {
      const event = await Event.findById(eventId)
        .populate('attendees.user', 'firstName lastName profilePhoto email occupation');

      if (!event) throw new Error('Event not found');
      if (event.creator.toString() !== userId) {
        throw new Error('Only the host can view attendee details');
      }

      const going = event.attendees
        .filter(a => a.status === 'going')
        .map(a => ({ user: a.user, respondedAt: a.respondedAt }));

      const interested = event.attendees
        .filter(a => a.status === 'interested')
        .map(a => ({ user: a.user, respondedAt: a.respondedAt }));

      return { going, interested, goingCount: going.length, interestedCount: interested.length };
    } catch (error: any) {
      logger.error('Get attendees error:', error);
      throw new Error(error.message || 'Failed to get attendees');
    }
  }

  /**
   * Get events created by user
   */
  async getMyEvents(userId: string) {
    try {
      const events = await Event.find({ creator: userId })
        .populate('creator', 'firstName lastName profilePhoto')
        .populate('attendees.user', 'firstName lastName profilePhoto')
        .sort({ date: -1 })
        .lean();

      return events;
    } catch (error: any) {
      logger.error('Get my events error:', error);
      throw new Error(error.message || 'Failed to get your events');
    }
  }

  /**
   * Get events user has RSVP'd to
   */
  async getMyRsvps(userId: string) {
    try {
      const events = await Event.find({
        'attendees.user': userId,
        'attendees.status': { $in: ['going', 'interested'] },
      })
        .populate('creator', 'firstName lastName profilePhoto')
        .populate('attendees.user', 'firstName lastName profilePhoto')
        .sort({ date: 1 })
        .lean();

      return events;
    } catch (error: any) {
      logger.error('Get my RSVPs error:', error);
      throw new Error(error.message || 'Failed to get your RSVPs');
    }
  }

  /**
   * Update an event (creator only)
   */
  async updateEvent(eventId: string, userId: string, data: any) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.creator.toString() !== userId) {
        throw new Error('Only the event creator can update this event');
      }

      // Remove fields that shouldn't be updated directly
      delete data.creator;
      delete data.attendees;

      Object.assign(event, data);
      await event.save();

      return event;
    } catch (error: any) {
      logger.error('Update event error:', error);
      throw new Error(error.message || 'Failed to update event');
    }
  }

  /**
   * Cancel an event (creator only)
   */
  async cancelEvent(eventId: string, userId: string) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.creator.toString() !== userId) {
        throw new Error('Only the event creator can cancel this event');
      }

      event.isCancelled = true;
      await event.save();

      return event;
    } catch (error: any) {
      logger.error('Cancel event error:', error);
      throw new Error(error.message || 'Failed to cancel event');
    }
  }

  /**
   * Delete an event (creator only)
   */
  async deleteEvent(eventId: string, userId: string) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.creator.toString() !== userId) {
        throw new Error('Only the event creator can delete this event');
      }

      await Event.findByIdAndDelete(eventId);
      return { deleted: true };
    } catch (error: any) {
      logger.error('Delete event error:', error);
      throw new Error(error.message || 'Failed to delete event');
    }
  }

  /**
   * Get upcoming events (paginated)
   */
  async getUpcomingEvents(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        Event.find({
          date: { $gte: new Date() },
          isActive: true,
          isCancelled: false,
        })
          .populate('creator', 'firstName lastName profilePhoto')
          .populate('attendees.user', 'firstName lastName profilePhoto')
          .sort({ date: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Event.countDocuments({
          date: { $gte: new Date() },
          isActive: true,
          isCancelled: false,
        }),
      ]);

      return {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Get upcoming events error:', error);
      throw new Error(error.message || 'Failed to get upcoming events');
    }
  }
}

export default new EventService();
