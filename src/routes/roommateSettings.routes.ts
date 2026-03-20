// src/routes/roommateSettings.routes.ts
import { Router } from 'express';
import roommateSettingsController from '../controllers/roommateSettings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Group feature toggles
router.put('/group/:groupId/features', roommateSettingsController.updateGroupFeatures);

// Location sharing
router.get('/group/:groupId/locations', roommateSettingsController.getRoommateLocations);

// Emergency contacts
router.get('/group/:groupId/emergency-contacts', roommateSettingsController.getGroupEmergencyContacts);
router.put('/emergency-contacts', roommateSettingsController.updateEmergencyContacts);

// Personality board
router.get('/group/:groupId/personality-board', roommateSettingsController.getGroupPersonalityBoard);
router.put('/personality', roommateSettingsController.updatePersonalityInfo);

// ---- 1-on-1 match-based routes ----
router.get('/match/:matchId/location', roommateSettingsController.getMatchLocation);
router.get('/match/:matchId/emergency-contacts', roommateSettingsController.getMatchEmergencyContacts);
router.get('/match/:matchId/personality-board', roommateSettingsController.getMatchPersonalityBoard);

export default router;
