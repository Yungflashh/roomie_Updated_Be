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
exports.StudySession = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const answerSchema = new mongoose_1.Schema({ questionIndex: Number, answer: String, correct: Boolean, timeSpent: Number }, { _id: false });
const studySessionSchema = new mongoose_1.Schema({
    creator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    opponent: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true },
    mode: { type: String, enum: ['solo', 'challenge'], default: 'solo' },
    status: { type: String, enum: ['pending', 'active', 'completed', 'cancelled', 'declined'], default: 'active' },
    questions: [{ question: String, options: [String], correctAnswer: String, explanation: String }],
    creatorAnswers: [answerSchema],
    opponentAnswers: [answerSchema],
    creatorScore: { type: Number, default: 0 },
    opponentScore: { type: Number, default: 0 },
    winner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    totalQuestions: { type: Number, default: 10 },
    timeLimit: { type: Number, default: 30 },
    startedAt: Date,
    completedAt: Date,
    expiresAt: Date,
}, { timestamps: true });
studySessionSchema.index({ creator: 1, status: 1 });
studySessionSchema.index({ opponent: 1, status: 1 });
studySessionSchema.index({ category: 1 });
studySessionSchema.index({ createdAt: -1 });
exports.StudySession = mongoose_1.default.model('StudySession', studySessionSchema);
//# sourceMappingURL=StudyBuddy.js.map