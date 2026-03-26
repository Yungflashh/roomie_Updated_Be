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
exports.Cosmetic = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const cosmeticSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: {
        type: String,
        enum: ['profile_frame', 'chat_bubble', 'badge', 'name_effect'],
        required: true,
    },
    rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common',
    },
    icon: { type: String, required: true },
    preview: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: {
        type: String,
        enum: ['points', 'money'],
        default: 'points',
    },
    style: {
        borderColor: String,
        borderWidth: Number,
        glowColor: String,
        gradient: [String],
        animation: {
            type: String,
            enum: ['none', 'pulse', 'shimmer', 'sparkle'],
            default: 'none',
        },
        textColor: String,
    },
    requiredLevel: { type: Number, default: 0 },
    isLimited: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
}, { timestamps: true });
cosmeticSchema.index({ type: 1, isActive: 1 });
cosmeticSchema.index({ rarity: 1 });
exports.Cosmetic = mongoose_1.default.model('Cosmetic', cosmeticSchema);
//# sourceMappingURL=Cosmetic.js.map