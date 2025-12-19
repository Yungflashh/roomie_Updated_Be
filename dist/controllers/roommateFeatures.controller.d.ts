import { Response } from 'express';
import { AuthRequest } from '../types';
declare class RoommateFeaturesController {
    createExpense: (req: AuthRequest, res: Response) => Promise<void>;
    getExpenses: (req: AuthRequest, res: Response) => Promise<void>;
    markExpensePaid: (req: AuthRequest, res: Response) => Promise<void>;
    verifyExpensePayment: (req: AuthRequest, res: Response) => Promise<void>;
    deleteExpense: (req: AuthRequest, res: Response) => Promise<void>;
    getExpenseSummary: (req: AuthRequest, res: Response) => Promise<void>;
    createChore: (req: AuthRequest, res: Response) => Promise<void>;
    getChores: (req: AuthRequest, res: Response) => Promise<void>;
    completeChore: (req: AuthRequest, res: Response) => Promise<void>;
    verifyChore: (req: AuthRequest, res: Response) => Promise<void>;
    transferChore: (req: AuthRequest, res: Response) => Promise<void>;
    skipChore: (req: AuthRequest, res: Response) => Promise<void>;
    deleteChore: (req: AuthRequest, res: Response) => Promise<void>;
    getChoreStats: (req: AuthRequest, res: Response) => Promise<void>;
}
declare const _default: RoommateFeaturesController;
export default _default;
//# sourceMappingURL=roommateFeatures.controller.d.ts.map