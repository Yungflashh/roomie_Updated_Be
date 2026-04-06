"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
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
    /**
     * Get a detailed compatibility report between two users
     */
    async getDetailedCompatibilityReport(userId1, userId2) {
        const [user1, user2] = await Promise.all([
            models_1.User.findById(userId1),
            models_1.User.findById(userId2),
        ]);
        if (!user1 || !user2) {
            throw new Error('One or both users not found');
        }
        const factors = this.calculateFactors(user1, user2);
        const overallScore = this.calculateCompatibility(user1, user2);
        const budgetBreakdown = this.getBudgetDetail(user1, user2, factors.budgetScore);
        const locationBreakdown = this.getLocationDetail(user1, user2, factors.locationScore);
        const lifestyleBreakdown = this.getLifestyleDetail(user1, user2, factors.lifestyleScore);
        const interestsBreakdown = this.getInterestsDetail(user1, user2, factors.interestsScore);
        const preferencesBreakdown = this.getPreferencesDetail(user1, user2, factors.preferencesScore);
        const ageBreakdown = this.getAgeDetail(user1, user2, factors.ageScore);
        const tips = this.generateTips(factors, user1, user2, lifestyleBreakdown, interestsBreakdown);
        return {
            overallScore,
            breakdown: {
                budget: budgetBreakdown,
                location: locationBreakdown,
                lifestyle: lifestyleBreakdown,
                interests: interestsBreakdown,
                preferences: preferencesBreakdown,
                age: ageBreakdown,
            },
            tips,
        };
    }
    getBudgetDetail(user1, user2, score) {
        let detail;
        if (!user1.preferences?.budget || !user2.preferences?.budget) {
            detail = 'Budget information not available for one or both users';
        }
        else {
            const b1 = user1.preferences.budget;
            const b2 = user2.preferences.budget;
            const currency = b1.currency || '₦';
            if (score === 0) {
                detail = `No budget overlap: ${currency}${b1.min.toLocaleString()}-${b1.max.toLocaleString()} vs ${currency}${b2.min.toLocaleString()}-${b2.max.toLocaleString()}`;
            }
            else if (score >= 80) {
                const overlapMin = Math.max(b1.min, b2.min);
                const overlapMax = Math.min(b1.max, b2.max);
                detail = `Both looking for ${currency}${overlapMin.toLocaleString()}-${overlapMax.toLocaleString()} range`;
            }
            else {
                detail = `Partial budget overlap between ${currency}${Math.max(b1.min, b2.min).toLocaleString()} and ${currency}${Math.min(b1.max, b2.max).toLocaleString()}`;
            }
        }
        return { score, weight: 0.25, detail };
    }
    getLocationDetail(user1, user2, score) {
        let detail;
        if (!user1.location?.coordinates || !user2.location?.coordinates) {
            detail = 'Location information not available for one or both users';
        }
        else {
            const [lon1, lat1] = user1.location.coordinates;
            const [lon2, lat2] = user2.location.coordinates;
            const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
            if (distance <= 1) {
                detail = 'Less than 1km apart';
            }
            else {
                detail = `${Math.round(distance)}km apart`;
            }
            if (user1.location.city && user2.location.city) {
                if (user1.location.city === user2.location.city) {
                    detail += ` (both in ${user1.location.city})`;
                }
                else {
                    detail += ` (${user1.location.city} / ${user2.location.city})`;
                }
            }
        }
        return { score, weight: 0.20, detail };
    }
    getLifestyleDetail(user1, user2, score) {
        const l1 = user1.lifestyle || {};
        const l2 = user2.lifestyle || {};
        const sleepMatch = l1.sleepSchedule && l2.sleepSchedule
            ? l1.sleepSchedule === l2.sleepSchedule || l1.sleepSchedule === 'flexible' || l2.sleepSchedule === 'flexible'
            : false;
        const cleanlinessMatch = l1.cleanliness && l2.cleanliness
            ? Math.abs(l1.cleanliness - l2.cleanliness) <= 1
            : false;
        const socialMatch = l1.socialLevel && l2.socialLevel
            ? Math.abs(l1.socialLevel - l2.socialLevel) <= 1
            : false;
        const guestMatch = l1.guestFrequency && l2.guestFrequency
            ? l1.guestFrequency === l2.guestFrequency
            : false;
        const wfhMatch = typeof l1.workFromHome === 'boolean' && typeof l2.workFromHome === 'boolean'
            ? l1.workFromHome === l2.workFromHome
            : false;
        const matchCount = [sleepMatch, cleanlinessMatch, socialMatch, guestMatch, wfhMatch].filter(Boolean).length;
        let detail;
        if (matchCount >= 4) {
            detail = 'Very compatible lifestyles';
        }
        else if (matchCount >= 2) {
            detail = 'Mostly compatible lifestyles with some differences';
        }
        else {
            detail = 'Different lifestyles — communication is key';
        }
        return {
            score,
            weight: 0.20,
            detail,
            subcategories: {
                sleepSchedule: {
                    match: sleepMatch,
                    user1: l1.sleepSchedule || 'not set',
                    user2: l2.sleepSchedule || 'not set',
                },
                cleanliness: {
                    match: cleanlinessMatch,
                    user1: l1.cleanliness || 0,
                    user2: l2.cleanliness || 0,
                },
                socialLevel: {
                    match: socialMatch,
                    user1: l1.socialLevel || 0,
                    user2: l2.socialLevel || 0,
                },
                guestFrequency: {
                    match: guestMatch,
                    user1: l1.guestFrequency || 'not set',
                    user2: l2.guestFrequency || 'not set',
                },
                workFromHome: {
                    match: wfhMatch,
                    user1: l1.workFromHome ?? false,
                    user2: l2.workFromHome ?? false,
                },
            },
        };
    }
    getInterestsDetail(user1, user2, score) {
        const i1 = new Set(user1.interests || []);
        const i2 = new Set(user2.interests || []);
        const shared = [...i1].filter((x) => i2.has(x));
        const unique1 = [...i1].filter((x) => !i2.has(x));
        const unique2 = [...i2].filter((x) => !i1.has(x));
        let detail;
        if (shared.length === 0) {
            detail = 'No shared interests — a chance to learn from each other';
        }
        else if (shared.length <= 2) {
            detail = `${shared.length} shared interest${shared.length > 1 ? 's' : ''}: ${shared.join(', ')}`;
        }
        else {
            detail = `${shared.length} shared interests including ${shared.slice(0, 3).join(', ')}`;
        }
        return { score, weight: 0.15, detail, shared, unique1, unique2 };
    }
    getPreferencesDetail(user1, user2, score) {
        let detail;
        if (!user1.preferences || !user2.preferences) {
            detail = 'Preference information not available';
        }
        else {
            const matchPoints = [];
            const diffPoints = [];
            const p1 = user1.preferences;
            const p2 = user2.preferences;
            if (p1.roomType && p2.roomType) {
                if (p1.roomType === p2.roomType || p1.roomType === 'any' || p2.roomType === 'any') {
                    matchPoints.push('room type');
                }
                else {
                    diffPoints.push('room type');
                }
            }
            if (typeof p1.petFriendly === 'boolean' && typeof p2.petFriendly === 'boolean') {
                if (p1.petFriendly === p2.petFriendly) {
                    matchPoints.push('pet policy');
                }
                else {
                    diffPoints.push('pet policy');
                }
            }
            if (typeof p1.smoking === 'boolean' && typeof p2.smoking === 'boolean') {
                if (p1.smoking === p2.smoking) {
                    matchPoints.push('smoking policy');
                }
                else {
                    diffPoints.push('smoking policy');
                }
            }
            if (matchPoints.length > 0 && diffPoints.length === 0) {
                detail = `Aligned on ${matchPoints.join(', ')}`;
            }
            else if (diffPoints.length > 0 && matchPoints.length === 0) {
                detail = `Differ on ${diffPoints.join(', ')}`;
            }
            else if (matchPoints.length > 0 && diffPoints.length > 0) {
                detail = `Aligned on ${matchPoints.join(', ')} but differ on ${diffPoints.join(', ')}`;
            }
            else {
                detail = 'Limited preference data to compare';
            }
        }
        return { score, weight: 0.15, detail };
    }
    getAgeDetail(user1, user2, score) {
        let detail;
        if (!user1.dateOfBirth || !user2.dateOfBirth) {
            detail = 'Age information not available';
        }
        else {
            const age1 = (0, dayjs_1.default)().diff((0, dayjs_1.default)(user1.dateOfBirth), 'year');
            const age2 = (0, dayjs_1.default)().diff((0, dayjs_1.default)(user2.dateOfBirth), 'year');
            const diff = Math.abs(age1 - age2);
            if (diff === 0) {
                detail = `Both are ${age1} years old`;
            }
            else if (diff <= 2) {
                detail = `Close in age (${age1} and ${age2})`;
            }
            else {
                detail = `${diff} year age gap (${age1} and ${age2})`;
            }
            if (score < 50) {
                detail += ' — outside preferred range';
            }
        }
        return { score, weight: 0.05, detail };
    }
    generateTips(factors, user1, user2, lifestyle, interests) {
        const tips = [];
        // Budget tips
        if (factors.budgetScore >= 80) {
            tips.push('Great budget alignment! You can focus on finding the right place together.');
        }
        else if (factors.budgetScore < 40) {
            tips.push('Your budgets differ quite a bit — have an honest conversation about what each person can afford.');
        }
        // Lifestyle tips
        if (!lifestyle.subcategories.cleanliness.match && lifestyle.subcategories.cleanliness.user1 > 0 && lifestyle.subcategories.cleanliness.user2 > 0) {
            tips.push('You differ on cleanliness standards — discuss expectations and chore splits early.');
        }
        if (!lifestyle.subcategories.sleepSchedule.match && lifestyle.subcategories.sleepSchedule.user1 !== 'not set') {
            tips.push('Different sleep schedules — agree on quiet hours to keep things smooth.');
        }
        if (!lifestyle.subcategories.guestFrequency.match && lifestyle.subcategories.guestFrequency.user1 !== 'not set') {
            tips.push('You have different guest preferences — set ground rules about visitors.');
        }
        // Interest tips
        if (interests.shared.length >= 3) {
            tips.push(`You share ${interests.shared.length} interests — plenty of common ground!`);
        }
        else if (interests.shared.length === 0 && interests.unique1.length > 0 && interests.unique2.length > 0) {
            tips.push('No shared interests yet — a great chance to discover new hobbies together.');
        }
        // Location tip
        if (factors.locationScore >= 90) {
            tips.push('You are very close to each other — convenient for house-hunting together.');
        }
        // Preferences tip
        if (factors.preferencesScore < 50) {
            tips.push('Some key preferences differ (room type, pets, or smoking) — make sure to discuss deal-breakers.');
        }
        // Keep tips to 2-4
        if (tips.length > 4) {
            return tips.slice(0, 4);
        }
        if (tips.length < 2) {
            if (factors.budgetScore + factors.locationScore + factors.lifestyleScore > 200) {
                tips.push('Overall a solid match — meet up and see how it goes!');
            }
            if (tips.length < 2) {
                tips.push('Take time to chat and learn about each other before committing.');
            }
        }
        return tips;
    }
}
exports.default = new CompatibilityService();
//# sourceMappingURL=compatibility.service.js.map