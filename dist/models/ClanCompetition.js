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
exports.ClanCompetition = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const memberContributionSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    studyWon: { type: Number, default: 0 },
}, { _id: false });
const competitorSchema = new mongoose_1.Schema({
    clan: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Clan', required: true },
    totalPoints: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    studySessions: { type: Number, default: 0 },
    memberContributions: [memberContributionSchema],
    rank: { type: Number },
    prizeAmount: { type: Number, default: 0 },
}, { _id: false });
const clanCompetitionSchema = new mongoose_1.Schema({
    month: { type: String, required: true, unique: true }, // YYYY-MM
    status: { type: String, enum: ['registration', 'active', 'completed', 'cancelled'], default: 'registration' },
    competitors: [competitorSchema],
    prizeTier: { type: Number, default: 50000 },
    prizeDistributed: { type: Boolean, default: false },
    minMembers: { type: Number, default: 10 },
    minClans: { type: Number, default: 5 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
}, { timestamps: true });
clanCompetitionSchema.index({ month: 1 }, { unique: true });
clanCompetitionSchema.index({ status: 1 });
exports.ClanCompetition = mongoose_1.default.model('ClanCompetition', clanCompetitionSchema);
//# sourceMappingURL=ClanCompetition.js.map