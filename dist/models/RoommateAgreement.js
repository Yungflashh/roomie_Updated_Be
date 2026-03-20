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
exports.RoommateAgreement = void 0;
// src/models/RoommateAgreement.ts
const mongoose_1 = __importStar(require("mongoose"));
const partySchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fullName: {
        type: String,
        default: '',
    },
    signedAt: Date,
}, { _id: false });
const roommateAgreementSchema = new mongoose_1.Schema({
    match: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
        index: true,
    },
    party1: {
        type: partySchema,
        required: true,
    },
    party2: {
        type: partySchema,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'signed', 'active'],
        default: 'pending',
    },
    moveInDate: String,
    leaseEndDate: String,
    rentAmount: String,
    address: String,
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
// One agreement per match
roommateAgreementSchema.index({ match: 1 }, { unique: true });
roommateAgreementSchema.index({ 'party1.user': 1 });
roommateAgreementSchema.index({ 'party2.user': 1 });
roommateAgreementSchema.set('toJSON', { virtuals: true });
roommateAgreementSchema.set('toObject', { virtuals: true });
exports.RoommateAgreement = mongoose_1.default.model('RoommateAgreement', roommateAgreementSchema);
//# sourceMappingURL=RoommateAgreement.js.map