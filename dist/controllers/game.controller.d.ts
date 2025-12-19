import { Response } from 'express';
import { AuthRequest } from '../types';
declare class GameController {
    getAllGames(req: AuthRequest, res: Response): Promise<void>;
    getGame(req: AuthRequest, res: Response): Promise<void>;
    createSession(req: AuthRequest, res: Response): Promise<void>;
    joinSession(req: AuthRequest, res: Response): Promise<void>;
    startSession(req: AuthRequest, res: Response): Promise<void>;
    submitScore(req: AuthRequest, res: Response): Promise<void>;
    completeSession(req: AuthRequest, res: Response): Promise<void>;
    getGameHistory(req: AuthRequest, res: Response): Promise<void>;
    getLeaderboard(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: GameController;
export default _default;
//# sourceMappingURL=game.controller.d.ts.map