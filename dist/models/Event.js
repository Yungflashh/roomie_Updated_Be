"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const eventSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
        address: { type: String, required: true },
        city: String,
        state: String,
    },
    date: { type: Date, required: true },
    endDate: Date,
    category: { type: String, enum: ['study-group', 'house-party', 'movie-night', 'sports', 'food-drinks', 'networking', 'outdoor', 'gaming', 'other'], required: true },
    coverImage: String,
    media: { type: [String], default: [] },
    creator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    attendees: [{
            user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
            status: { type: String, enum: ['going', 'interested', 'not_going'], required: true },
            respondedAt: { type: Date, default: Date.now },
        }],
    maxAttendees: Number,
    isFree: { type: Boolean, default: true },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'NGN' },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    isCancelled: { type: Boolean, default: false },
    tags: [String],
}, { timestamps: true });
eventSchema.index({ 'location.coordinates': '2dsphere' });
eventSchema.index({ creator: 1 });
eventSchema.index({ date: 1, isActive: 1 });
eventSchema.index({ category: 1, date: 1 });
eventSchema.index({ 'attendees.user': 1 });
exports.Event = mongoose_1.default.model('Event', eventSchema);
//# sourceMappingURL=Event.js.map