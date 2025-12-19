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
exports.Property = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const propertySchema = new mongoose_1.Schema({
    landlord: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['apartment', 'house', 'condo', 'room'],
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: 'USD',
    },
    address: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
        zipCode: String,
    },
    photos: {
        type: [String],
        default: [],
    },
    videos: {
        type: [String],
        default: [],
    },
    amenities: {
        type: [String],
        default: [],
    },
    bedrooms: {
        type: Number,
        required: true,
        min: 0,
    },
    bathrooms: {
        type: Number,
        required: true,
        min: 0,
    },
    squareFeet: Number,
    availableFrom: {
        type: Date,
        required: true,
    },
    leaseDuration: {
        type: Number,
        required: true,
        min: 1,
    },
    petFriendly: {
        type: Boolean,
        default: false,
    },
    smokingAllowed: {
        type: Boolean,
        default: false,
    },
    utilitiesIncluded: {
        type: Boolean,
        default: false,
    },
    furnished: {
        type: Boolean,
        default: false,
    },
    parkingAvailable: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['available', 'rented', 'pending', 'inactive'],
        default: 'available',
        index: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    likes: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }],
    isVerified: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// Indexes
propertySchema.index({ 'location.coordinates': '2dsphere' });
propertySchema.index({ landlord: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ createdAt: -1 });
exports.Property = mongoose_1.default.model('Property', propertySchema);
//# sourceMappingURL=Property.js.map