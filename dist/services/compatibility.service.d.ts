import { IUserDocument } from '../models/User';
interface SubcategoryMatch<T> {
    match: boolean;
    user1: T;
    user2: T;
}
interface LifestyleBreakdown {
    score: number;
    weight: number;
    detail: string;
    subcategories: {
        sleepSchedule: SubcategoryMatch<string>;
        cleanliness: SubcategoryMatch<number>;
        socialLevel: SubcategoryMatch<number>;
        guestFrequency: SubcategoryMatch<string>;
        workFromHome: SubcategoryMatch<boolean>;
    };
}
interface CategoryBreakdown {
    score: number;
    weight: number;
    detail: string;
}
interface InterestsBreakdown extends CategoryBreakdown {
    shared: string[];
    unique1: string[];
    unique2: string[];
}
interface DetailedCompatibilityReport {
    overallScore: number;
    breakdown: {
        budget: CategoryBreakdown;
        location: CategoryBreakdown;
        lifestyle: LifestyleBreakdown;
        interests: InterestsBreakdown;
        preferences: CategoryBreakdown;
        age: CategoryBreakdown;
    };
    tips: string[];
}
declare class CompatibilityService {
    /**
     * Calculate overall compatibility score between two users
     */
    calculateCompatibility(user1: IUserDocument, user2: IUserDocument): number;
    /**
     * Calculate individual compatibility factors
     */
    private calculateFactors;
    /**
     * Calculate budget compatibility
     */
    private calculateBudgetScore;
    /**
     * Calculate location proximity score
     */
    private calculateLocationScore;
    /**
     * Calculate lifestyle compatibility
     */
    private calculateLifestyleScore;
    /**
     * Calculate shared interests score
     */
    private calculateInterestsScore;
    /**
     * Calculate preferences compatibility
     */
    private calculatePreferencesScore;
    /**
     * Calculate age compatibility
     */
    private calculateAgeScore;
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private calculateDistance;
    private toRad;
    /**
     * Get a detailed compatibility report between two users
     */
    getDetailedCompatibilityReport(userId1: string, userId2: string): Promise<DetailedCompatibilityReport>;
    private getBudgetDetail;
    private getLocationDetail;
    private getLifestyleDetail;
    private getInterestsDetail;
    private getPreferencesDetail;
    private getAgeDetail;
    private generateTips;
}
declare const _default: CompatibilityService;
export default _default;
//# sourceMappingURL=compatibility.service.d.ts.map