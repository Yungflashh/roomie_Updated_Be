// src/controllers/roommateSettings.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import roommateSettingsService from '../services/roommateSettings.service';
import logger from '../utils/logger';

class RoommateSettingsController {
  async updateGroupFeatures(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;
      const { locationSharing, emergencyAlerts, personalityBoard } = req.body;

      const group = await roommateSettingsService.updateGroupFeatures(
        groupId, userId, { locationSharing, emergencyAlerts, personalityBoard }
      );

      res.status(200).json({ success: true, data: { group } });
    } catch (error: any) {
      logger.error('Update group features error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getRoommateLocations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      const locations = await roommateSettingsService.getRoommateLocations(groupId, userId);

      res.status(200).json({ success: true, data: { locations } });
    } catch (error: any) {
      logger.error('Get roommate locations error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getGroupEmergencyContacts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      const contacts = await roommateSettingsService.getGroupEmergencyContacts(groupId, userId);

      res.status(200).json({ success: true, data: { members: contacts } });
    } catch (error: any) {
      logger.error('Get emergency contacts error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getGroupPersonalityBoard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { groupId } = req.params;

      const board = await roommateSettingsService.getGroupPersonalityBoard(groupId, userId);

      res.status(200).json({ success: true, data: { members: board } });
    } catch (error: any) {
      logger.error('Get personality board error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateEmergencyContacts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { contacts } = req.body;

      if (!contacts || !Array.isArray(contacts)) {
        res.status(400).json({ success: false, message: 'contacts array is required' });
        return;
      }

      const result = await roommateSettingsService.updateEmergencyContacts(userId, contacts);

      res.status(200).json({ success: true, data: { emergencyContacts: result } });
    } catch (error: any) {
      logger.error('Update emergency contacts error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updatePersonalityInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { zodiacSign, personalityType } = req.body;

      const result = await roommateSettingsService.updatePersonalityInfo(
        userId, { zodiacSign, personalityType }
      );

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Update personality info error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ---- 1-on-1 match-based endpoints ----

  async getMatchLocation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;
      const result = await roommateSettingsService.getMatchLocation(matchId, userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Get match location error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMatchEmergencyContacts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;
      const members = await roommateSettingsService.getMatchEmergencyContacts(matchId, userId);
      res.status(200).json({ success: true, data: { members } });
    } catch (error: any) {
      logger.error('Get match emergency contacts error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMatchPersonalityBoard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId!;
      const { matchId } = req.params;
      const members = await roommateSettingsService.getMatchPersonalityBoard(matchId, userId);
      res.status(200).json({ success: true, data: { members } });
    } catch (error: any) {
      logger.error('Get match personality board error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default new RoommateSettingsController();
