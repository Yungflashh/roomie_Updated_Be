import { Response } from 'express';
import { AuthRequest } from '../types';
declare class ChallengeController {
    getActiveChallenges(req: AuthRequest, res: Response): Promise<void>;
    getChallenge(req: AuthRequest, res: Response): Promise<void>;
    joinChallenge(req: AuthRequest, res: Response): Promise<void>;
    updateProgress(req: AuthRequest, res: Response): Promise<void>;
    getUserChallenges(req: AuthRequest, res: Response): Promise<void>;
    getGlobalLeaderboard(req: AuthRequest, res: Response): Promise<void>;
    getChallengeLeaderboard(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: ChallengeController;
export default _default;
//# sourceMappingURL=challenge.controller.d.ts.map