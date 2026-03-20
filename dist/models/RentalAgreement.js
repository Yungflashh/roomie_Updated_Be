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
exports.RentalAgreement = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const partySchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, default: '' },
    signedAt: Date,
}, { _id: false });
const termsSchema = new mongoose_1.Schema({
    monthlyRent: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    securityDeposit: Number,
    moveInDate: { type: Date, required: true },
    leaseEndDate: Date,
    leaseDuration: { type: Number, required: true },
    paymentDueDay: { type: Number, min: 1, max: 28 },
    utilitiesIncluded: { type: Boolean, default: false },
    additionalTerms: String,
}, { _id: false });
const rentalAgreementSchema = new mongoose_1.Schema({
    inquiry: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ListingInquiry', required: true, unique: true },
    property: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Property', required: true },
    match: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Match', required: true },
    landlord: { type: partySchema, required: true },
    tenant: { type: partySchema, required: true },
    status: {
        type: String,
        enum: ['draft', 'pending', 'signed', 'active', 'terminated'],
        default: 'draft',
    },
    terms: { type: termsSchema, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
rentalAgreementSchema.index({ property: 1 });
rentalAgreementSchema.index({ 'landlord.user': 1 });
rentalAgreementSchema.index({ 'tenant.user': 1 });
rentalAgreementSchema.index({ status: 1 });
exports.RentalAgreement = mongoose_1.default.model('RentalAgreement', rentalAgreementSchema);
//# sourceMappingURL=RentalAgreement.js.map