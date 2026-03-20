"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/event.service.ts
const Event_1 = require("../models/Event");
const User_1 = require("../models/User");
const Transaction_1 = require("../models/Transaction");
const socket_config_1 = require("../config/socket.config");
const weeklyChallenge_service_1 = __importDefault(require("./weeklyChallenge.service"));
const logger_1 = __importDefault(require("../utils/logger"));
class EventService {
    /**
     * Create a new event
     */
    async createEvent(userId, data) {
        try {
            const doc = new Event_1.Event({
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
            const event = await Event_1.Event.findById(doc._id)
                .populate('creator', 'firstName lastName profilePhoto')
                .populate('attendees.user', 'firstName lastName profilePhoto');
            return event;
        }
        catch (error) {
            logger_1.default.error('Create event error:', error);
            throw new Error(error.message || 'Failed to create event');
        }
    }
    /**
     * Get event by ID with populated fields
     */
    async getEventById(eventId) {
        try {
            // Increment views
            await Event_1.Event.findByIdAndUpdate(eventId, { $inc: { views: 1 } });
            const event = await Event_1.Event.findById(eventId)
                .populate('creator', 'firstName lastName profilePhoto')
                .populate('attendees.user', 'firstName lastName profilePhoto');
            if (!event) {
                throw new Error('Event not found');
            }
            return event;
        }
        catch (error) {
            logger_1.default.error('Get event by ID error:', error);
            throw new Error(error.message || 'Failed to get event');
        }
    }
    /**
     * Get nearby events using geospatial query
     */
    async getNearbyEvents(lat, lng, radiusKm = 25, filters = {}) {
        try {
            const query = {
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
            const events = await Event_1.Event.find(query)
                .populate('creator', 'firstName lastName profilePhoto')
                .populate('attendees.user', 'firstName lastName profilePhoto')
                .limit(50)
                .lean();
            return events;
        }
        catch (error) {
            logger_1.default.error('Get nearby events error:', error);
            throw new Error(error.message || 'Failed to get nearby events');
        }
    }
    /**
     * RSVP to an event
     */
    async rsvpEvent(eventId, userId, status) {
        try {
            const event = await Event_1.Event.findById(eventId);
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
            }
            else {
                event.attendees.push({
                    user: userId,
                    status,
                    respondedAt: new Date(),
                });
            }
            await event.save();
            // Track challenge progress for event RSVP
            if (status === 'going' || status === 'interested') {
                try {
                    await weeklyChallenge_service_1.default.trackAction(userId, 'event_rsvp');
                }
                catch (e) {
                    logger_1.default.warn('Challenge tracking (event_rsvp) error:', e);
                }
            }
            // Notify host when someone RSVPs as "going"
            if (status === 'going' && event.creator.toString() !== userId) {
                try {
                    const rsvpUser = await User_1.User.findById(userId).select('firstName lastName');
                    const host = await User_1.User.findById(event.creator).select('notificationSettings');
                    if (host?.notificationSettings?.roommateActivity !== false) {
                        const notification = await Transaction_1.Notification.create({
                            user: event.creator,
                            type: 'system',
                            title: 'New Event Attendee',
                            body: `${rsvpUser?.firstName} ${rsvpUser?.lastName} is going to your event "${event.title}"`,
                            data: { eventId: event._id.toString() },
                        });
                        (0, socket_config_1.emitNotification)(event.creator.toString(), notification.toObject());
                    }
                }
                catch (e) {
                    logger_1.default.warn('Failed to notify event host:', e);
                }
            }
            // Return populated event
            const populated = await Event_1.Event.findById(event._id)
                .populate('creator', 'firstName lastName profilePhoto')
                .populate('attendees.user', 'firstName lastName profilePhoto');
            return populated;
        }
        catch (error) {
            logger_1.default.error('RSVP event error:', error);
            throw new Error(error.message || 'Failed to RSVP to event');
        }
    }
    /**
     * Get attendees list for host (includes email for planning)
     */
    async getEventAttendees(eventId, userId) {
        try {
            const event = await Event_1.Event.findById(eventId)
                .populate('attendees.user', 'firstName lastName profilePhoto email occupation');
            if (!event)
                throw new Error('Event not found');
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
        }
        catch (error) {
            logger_1.default.error('Get attendees error:', error);
            throw new Error(error.message || 'Failed to get attendees');
        }
    }
    /**
     * Get events created by user
     */
    async getMyEvents(userId) {
        try {
            const events = await Event_1.Event.find({ creator: userId })
                .populate('creator', 'firstName lastName profilePhoto')
                .populate('attendees.user', 'firstName lastName profilePhoto')
                .sort({ date: -1 })
                .lean();
            return events;
        }
        catch (error) {
            logger_1.default.error('Get my events error:', error);
            throw new Error(error.message || 'Failed to get your events');
        }
    }
    /**
     * Get events user has RSVP'd to
     */
    async getMyRsvps(userId) {
        try {
            const events = await Event_1.Event.find({
                'attendees.user': userId,
                'attendees.status': { $in: ['going', 'interested'] },
            })
                .populate('creator', 'firstName lastName profilePhoto')
                .populate('attendees.user', 'firstName lastName profilePhoto')
                .sort({ date: 1 })
                .lean();
            return events;
        }
        catch (error) {
            logger_1.default.error('Get my RSVPs error:', error);
            throw new Error(error.message || 'Failed to get your RSVPs');
        }
    }
    /**
     * Update an event (creator only)
     */
    async updateEvent(eventId, userId, data) {
        try {
            const event = await Event_1.Event.findById(eventId);
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
        }
        catch (error) {
            logger_1.default.error('Update event error:', error);
            throw new Error(error.message || 'Failed to update event');
        }
    }
    /**
     * Cancel an event (creator only)
     */
    async cancelEvent(eventId, userId) {
        try {
            const event = await Event_1.Event.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            if (event.creator.toString() !== userId) {
                throw new Error('Only the event creator can cancel this event');
            }
            event.isCancelled = true;
            await event.save();
            return event;
        }
        catch (error) {
            logger_1.default.error('Cancel event error:', error);
            throw new Error(error.message || 'Failed to cancel event');
        }
    }
    /**
     * Delete an event (creator only)
     */
    async deleteEvent(eventId, userId) {
        try {
            const event = await Event_1.Event.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            if (event.creator.toString() !== userId) {
                throw new Error('Only the event creator can delete this event');
            }
            await Event_1.Event.findByIdAndDelete(eventId);
            return { deleted: true };
        }
        catch (error) {
            logger_1.default.error('Delete event error:', error);
            throw new Error(error.message || 'Failed to delete event');
        }
    }
    /**
     * Get upcoming events (paginated)
     */
    async getUpcomingEvents(page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [events, total] = await Promise.all([
                Event_1.Event.find({
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
                Event_1.Event.countDocuments({
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
        }
        catch (error) {
            logger_1.default.error('Get upcoming events error:', error);
            throw new Error(error.message || 'Failed to get upcoming events');
        }
    }
}
exports.default = new EventService();
//# sourceMappingURL=event.service.js.map