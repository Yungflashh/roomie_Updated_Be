declare class EventService {
    /**
     * Create a new event
     */
    createEvent(userId: string, data: any): Promise<(import("mongoose").Document<unknown, {}, import("../models/Event").IEventDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Event").IEventDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Get event by ID with populated fields
     */
    getEventById(eventId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Event").IEventDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Event").IEventDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Get nearby events using geospatial query
     */
    getNearbyEvents(lat: number, lng: number, radiusKm?: number, filters?: {
        category?: string;
    }): Promise<(import("../models/Event").IEventDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * RSVP to an event
     */
    rsvpEvent(eventId: string, userId: string, status: 'going' | 'interested' | 'not_going'): Promise<(import("mongoose").Document<unknown, {}, import("../models/Event").IEventDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Event").IEventDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    /**
     * Get attendees list for host (includes email for planning)
     */
    getEventAttendees(eventId: string, userId: string): Promise<{
        going: {
            user: import("mongoose").Types.ObjectId;
            respondedAt: Date;
        }[];
        interested: {
            user: import("mongoose").Types.ObjectId;
            respondedAt: Date;
        }[];
        goingCount: number;
        interestedCount: number;
    }>;
    /**
     * Get events created by user
     */
    getMyEvents(userId: string): Promise<(import("../models/Event").IEventDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Get events user has RSVP'd to
     */
    getMyRsvps(userId: string): Promise<(import("../models/Event").IEventDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    /**
     * Update an event (creator only)
     */
    updateEvent(eventId: string, userId: string, data: any): Promise<import("mongoose").Document<unknown, {}, import("../models/Event").IEventDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Event").IEventDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Cancel an event (creator only)
     */
    cancelEvent(eventId: string, userId: string): Promise<import("mongoose").Document<unknown, {}, import("../models/Event").IEventDocument, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Event").IEventDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    /**
     * Delete an event (creator only)
     */
    deleteEvent(eventId: string, userId: string): Promise<{
        deleted: boolean;
    }>;
    /**
     * Get upcoming events (paginated)
     */
    getUpcomingEvents(page?: number, limit?: number): Promise<{
        events: (import("../models/Event").IEventDocument & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
}
declare const _default: EventService;
export default _default;
//# sourceMappingURL=event.service.d.ts.map