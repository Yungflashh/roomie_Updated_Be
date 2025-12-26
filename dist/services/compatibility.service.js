"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
class CompatibilityService {
    /**
     * Calculate overall compatibility score between two users
     */
    calculateCompatibility(user1, user2) {
        const factors = this.calculateFactors(user1, user2);
        // Weighted scoring
        const weights = {
            budgetScore: 0.25,
            locationScore: 0.20,
            lifestyleScore: 0.20,
            preferencesScore: 0.15,
            interestsScore: 0.15,
            ageScore: 0.05,
        };
        const totalScore = factors.budgetScore * weights.budgetScore +
            factors.locationScore * weights.locationScore +
            factors.lifestyleScore * weights.lifestyleScore +
            factors.preferencesScore * weights.preferencesScore +
            factors.interestsScore * weights.interestsScore +
            factors.ageScore * weights.ageScore;
        return Math.round(totalScore);
    }
    /**
     * Calculate individual compatibility factors
     */
    calculateFactors(user1, user2) {
        return {
            budgetScore: this.calculateBudgetScore(user1, user2),
            locationScore: this.calculateLocationScore(user1, user2),
            lifestyleScore: this.calculateLifestyleScore(user1, user2),
            interestsScore: this.calculateInterestsScore(user1, user2),
            preferencesScore: this.calculatePreferencesScore(user1, user2),
            ageScore: this.calculateAgeScore(user1, user2),
        };
    }
    /**
     * Calculate budget compatibility
     */
    calculateBudgetScore(user1, user2) {
        // Add null checks for preferences and budget
        if (!user1.preferences?.budget || !user2.preferences?.budget) {
            return 50; // Default score if budget info is missing
        }
        const budget1 = user1.preferences.budget;
        const budget2 = user2.preferences.budget;
        // Check overlap in budget ranges
        const overlapMin = Math.max(budget1.min, budget2.min);
        const overlapMax = Math.min(budget1.max, budget2.max);
        if (overlapMax < overlapMin) {
            return 0; // No overlap
        }
        const overlapRange = overlapMax - overlapMin;
        const avgRange = ((budget1.max - budget1.min) + (budget2.max - budget2.min)) / 2;
        return Math.min(100, (overlapRange / avgRange) * 100);
    }
    /**
     * Calculate location proximity score
     */
    calculateLocationScore(user1, user2) {
        // Add null checks for location
        if (!user1.location?.coordinates || !user2.location?.coordinates) {
            return 50; // Default score if location is missing
        }
        const [lon1, lat1] = user1.location.coordinates;
        const [lon2, lat2] = user2.location.coordinates;
        // Calculate distance using Haversine formula
        const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
        // Score based on distance (closer = higher score)
        if (distance <= 5)
            return 100;
        if (distance <= 10)
            return 90;
        if (distance <= 20)
            return 75;
        if (distance <= 50)
            return 50;
        if (distance <= 100)
            return 25;
        return 10;
    }
    /**
     * Calculate lifestyle compatibility
     */
    calculateLifestyleScore(user1, user2) {
        // Add null checks for lifestyle object - THIS IS THE KEY FIX
        if (!user1.lifestyle || !user2.lifestyle) {
            return 50; // Default score if lifestyle info is missing
        }
        let score = 0;
        let factors = 0;
        const lifestyle1 = user1.lifestyle;
        const lifestyle2 = user2.lifestyle;
        // Sleep schedule
        if (lifestyle1.sleepSchedule && lifestyle2.sleepSchedule) {
            factors++;
            if (lifestyle1.sleepSchedule === lifestyle2.sleepSchedule) {
                score += 100;
            }
            else if (lifestyle1.sleepSchedule === 'flexible' ||
                lifestyle2.sleepSchedule === 'flexible') {
                score += 70;
            }
            else {
                score += 30;
            }
        }
        // Cleanliness (closer = better)
        if (lifestyle1.cleanliness && lifestyle2.cleanliness) {
            factors++;
            const diff = Math.abs(lifestyle1.cleanliness - lifestyle2.cleanliness);
            score += 100 - (diff * 20);
        }
        // Social level (closer = better)
        if (lifestyle1.socialLevel && lifestyle2.socialLevel) {
            factors++;
            const diff = Math.abs(lifestyle1.socialLevel - lifestyle2.socialLevel);
            score += 100 - (diff * 20);
        }
        // Guest frequency
        if (lifestyle1.guestFrequency && lifestyle2.guestFrequency) {
            factors++;
            if (lifestyle1.guestFrequency === lifestyle2.guestFrequency) {
                score += 100;
            }
            else {
                score += 50;
            }
        }
        // Work from home
        if (typeof lifestyle1.workFromHome === 'boolean' &&
            typeof lifestyle2.workFromHome === 'boolean') {
            factors++;
            score += lifestyle1.workFromHome === lifestyle2.workFromHome ? 100 : 60;
        }
        return factors > 0 ? score / factors : 50;
    }
    /**
     * Calculate shared interests score
     */
    calculateInterestsScore(user1, user2) {
        // Add null checks for interests
        const interests1 = new Set(user1.interests || []);
        const interests2 = new Set(user2.interests || []);
        if (interests1.size === 0 && interests2.size === 0)
            return 50;
        const intersection = new Set([...interests1].filter((x) => interests2.has(x)));
        const union = new Set([...interests1, ...interests2]);
        // Jaccard similarity
        return union.size > 0 ? (intersection.size / union.size) * 100 : 50;
    }
    /**
     * Calculate preferences compatibility
     */
    calculatePreferencesScore(user1, user2) {
        // Add null check for preferences
        if (!user1.preferences || !user2.preferences) {
            return 50;
        }
        let score = 0;
        let factors = 0;
        const pref1 = user1.preferences;
        const pref2 = user2.preferences;
        // Room type
        if (pref1.roomType && pref2.roomType) {
            factors++;
            if (pref1.roomType === pref2.roomType ||
                pref1.roomType === 'any' ||
                pref2.roomType === 'any') {
                score += 100;
            }
            else {
                score += 30;
            }
        }
        // Gender preference
        if (pref1.gender && pref2.gender && user1.gender && user2.gender) {
            factors++;
            const user1MatchesPref2 = pref2.gender === 'any' || user1.gender === pref2.gender;
            const user2MatchesPref1 = pref1.gender === 'any' || user2.gender === pref1.gender;
            if (user1MatchesPref2 && user2MatchesPref1) {
                score += 100;
            }
            else if (user1MatchesPref2 || user2MatchesPref1) {
                score += 50;
            }
            else {
                score += 0;
            }
        }
        // Pet friendly
        if (typeof pref1.petFriendly === 'boolean' &&
            typeof pref2.petFriendly === 'boolean') {
            factors++;
            score += pref1.petFriendly === pref2.petFriendly ? 100 : 40;
        }
        // Smoking
        if (typeof pref1.smoking === 'boolean' &&
            typeof pref2.smoking === 'boolean') {
            factors++;
            score += pref1.smoking === pref2.smoking ? 100 : 30;
        }
        return factors > 0 ? score / factors : 50;
    }
    /**
     * Calculate age compatibility
     */
    calculateAgeScore(user1, user2) {
        if (!user1.dateOfBirth || !user2.dateOfBirth)
            return 50;
        const age1 = (0, dayjs_1.default)().diff((0, dayjs_1.default)(user1.dateOfBirth), 'year');
        const age2 = (0, dayjs_1.default)().diff((0, dayjs_1.default)(user2.dateOfBirth), 'year');
        // Check if within preferred age range
        let score = 100;
        if (user1.preferences?.ageRange) {
            if (age2 < user1.preferences.ageRange.min ||
                age2 > user1.preferences.ageRange.max) {
                score -= 50;
            }
        }
        if (user2.preferences?.ageRange) {
            if (age1 < user2.preferences.ageRange.min ||
                age1 > user2.preferences.ageRange.max) {
                score -= 50;
            }
        }
        return Math.max(0, score);
    }
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
}
exports.default = new CompatibilityService();
//# sourceMappingURL=compatibility.service.js.map