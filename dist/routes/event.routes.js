"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/event.routes.ts
const express_1 = require("express");
const event_controller_1 = __importDefault(require("../controllers/event.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', event_controller_1.default.createEvent);
router.get('/nearby', event_controller_1.default.getNearbyEvents);
router.get('/mine', event_controller_1.default.getMyEvents);
router.get('/rsvps', event_controller_1.default.getMyRsvps);
router.get('/upcoming', event_controller_1.default.getUpcomingEvents);
router.get('/:eventId', event_controller_1.default.getEventById);
router.put('/:eventId', event_controller_1.default.updateEvent);
router.post('/:eventId/rsvp', event_controller_1.default.rsvpEvent);
router.get('/:eventId/attendees', event_controller_1.default.getAttendees);
router.post('/:eventId/cancel', event_controller_1.default.cancelEvent);
router.delete('/:eventId', event_controller_1.default.deleteEvent);
exports.default = router;
//# sourceMappingURL=event.routes.js.map