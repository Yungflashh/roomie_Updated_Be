import { Response } from 'express';
import { AuthRequest } from '../types';
declare class RoommateSettingsController {
    updateGroupFeatures(req: AuthRequest, res: Response): Promise<void>;
    getRoommateLocations(req: AuthRequest, res: Response): Promise<void>;
    getGroupEmergencyContacts(req: AuthRequest, res: Response): Promise<void>;
    getGroupPersonalityBoard(req: AuthRequest, res: Response): Promise<void>;
    updateEmergencyContacts(req: AuthRequest, res: Response): Promise<void>;
    updatePersonalityInfo(req: AuthRequest, res: Response): Promise<void>;
    getMatchLocation(req: AuthRequest, res: Response): Promise<void>;
    getMatchEmergencyContacts(req: AuthRequest, res: Response): Promise<void>;
    getMatchPersonalityBoard(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: RoommateSettingsController;
export default _default;
//# sourceMappingURL=roommateSettings.controller.d.ts.map