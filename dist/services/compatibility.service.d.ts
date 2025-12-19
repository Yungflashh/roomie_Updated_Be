import { IUserDocument } from '../models/User';
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
}
declare const _default: CompatibilityService;
export default _default;
//# sourceMappingURL=compatibility.service.d.ts.map