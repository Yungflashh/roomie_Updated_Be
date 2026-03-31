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
exports.ClanWar = exports.Clan = exports.RANK_WEIGHTS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.RANK_WEIGHTS = {
    leader: 5,
    'co-leader': 4,
    elder: 3,
    officer: 2,
    member: 1,
};
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
const clanMemberSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['leader', 'co-leader', 'elder', 'officer', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    pointsContributed: { type: Number, default: 0 },
    weeklyContribution: { type: Number, default: 0 },
}, { _id: false });
const clanSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, maxlength: 30 },
    tag: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 6,
        match: /^[A-Z0-9]{3,6}$/,
    },
    description: { type: String, default: '', maxlength: 300 },
    emoji: { type: String, default: '🏠' },
    color: { type: String, default: '#6C63FF', match: /^#[0-9A-Fa-f]{6}$/ },
    leader: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    coLeaders: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    members: [clanMemberSchema],
    totalPoints: { type: Number, default: 0 },
    weeklyPoints: { type: Number, default: 0 },
    monthlyPoints: { type: Number, default: 0 },
    warsWon: { type: Number, default: 0 },
    warsLost: { type: Number, default: 0 },
    warsTied: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    maxMembers: { type: Number, default: 10 },
    isOpen: { type: Boolean, default: true },
    inviteCode: { type: String, unique: true, default: generateInviteCode },
    badges: [{ type: String }],
    activityLog: [
        {
            type: { type: String, required: true },
            userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            message: { type: String, required: true },
            points: { type: Number, default: 0 },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    treasury: { type: Number, default: 0 },
    pendingMembers: [{
            user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
            requestedAt: { type: Date, default: Date.now },
            message: { type: String, maxlength: 200 },
        }],
    banner: { type: String, default: '' },
    streak: {
        current: { type: Number, default: 0 },
        best: { type: Number, default: 0 },
        lastActiveDate: { type: Date },
    },
    chatMatchId: { type: String, unique: true, sparse: true },
    announcement: { type: String, default: '', maxlength: 500 },
    achievements: [{ type: String }],
    season: {
        number: { type: Number, default: 1 },
        points: { type: Number, default: 0 },
    },
    settings: {
        minLevel: { type: Number, default: 0, min: 0 },
        requireVerification: { type: Boolean, default: false },
        autoKickDays: { type: Number, default: 0, min: 0 },
    },
    activePerks: [{ type: String }],
    purchasedUpgrades: [
        {
            itemId: { type: String, required: true },
            purchasedAt: { type: Date, default: Date.now },
            expiresAt: { type: Date },
        },
    ],
}, { timestamps: true });
clanSchema.index({ name: 1 });
clanSchema.index({ tag: 1 }, { unique: true });
clanSchema.index({ inviteCode: 1 }, { unique: true });
clanSchema.index({ leader: 1 });
clanSchema.index({ 'members.user': 1 });
clanSchema.index({ totalPoints: -1 });
clanSchema.index({ weeklyPoints: -1 });
clanSchema.index({ monthlyPoints: -1 });
clanSchema.index({ level: -1 });
const clanWarMatchSchema = new mongoose_1.Schema({
    challengerPlayer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    defenderPlayer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    gameType: { type: String, required: true },
    challengerScore: { type: Number, default: 0 },
    defenderScore: { type: Number, default: 0 },
    winner: { type: String, enum: ['challenger', 'defender', 'tie', null], default: null },
    status: { type: String, enum: ['pending', 'playing', 'completed'], default: 'pending' },
    completedAt: { type: Date },
}, { _id: false });
const clanWarSchema = new mongoose_1.Schema({
    challenger: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Clan', required: true },
    defender: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Clan', required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in_progress', 'completed', 'declined', 'expired'],
        default: 'pending',
    },
    warType: { type: String, enum: ['games', 'study', 'mixed'], default: 'games' },
    matches: [clanWarMatchSchema],
    challengerScore: { type: Number, default: 0 },
    defenderScore: { type: Number, default: 0 },
    winner: { type: String, enum: ['challenger', 'defender', 'tie', null], default: null },
    pointsStake: { type: Number, default: 0 },
    startedAt: { type: Date },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date },
}, { timestamps: true });
clanWarSchema.index({ challenger: 1, status: 1 });
clanWarSchema.index({ defender: 1, status: 1 });
clanWarSchema.index({ status: 1 });
clanWarSchema.index({ expiresAt: 1 });
exports.Clan = mongoose_1.default.model('Clan', clanSchema);
exports.ClanWar = mongoose_1.default.model('ClanWar', clanWarSchema);
//# sourceMappingURL=Clan.js.map