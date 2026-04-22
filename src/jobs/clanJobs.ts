import { CronJob } from 'cron';
import clanService from '../services/clan.service';
import { ClanWar } from '../models/Clan';
import logger from '../utils/logger';

/**
 * Initialize all clan-related cron jobs.
 */
export function initClanJobs(): void {
  // Reset weekly points every Monday at 00:00
  const weeklyReset = new CronJob('0 0 * * 1', async () => {
    logger.info('Running weekly clan points reset...');
    try {
      await clanService.resetWeeklyPoints();
    } catch (error) {
      logger.error('Weekly clan reset cron error:', error);
    }
  });

  // Reset monthly points on the 1st of each month at 00:00
  const monthlyReset = new CronJob('0 0 1 * *', async () => {
    logger.info('Running monthly clan points reset...');
    try {
      await clanService.resetMonthlyPoints();
    } catch (error) {
      logger.error('Monthly clan reset cron error:', error);
    }
  });

  // Expire stale wars every hour
  const warExpiry = new CronJob('0 * * * *', async () => {
    try {
      const now = new Date();
      const result = await ClanWar.updateMany(
        { status: { $in: ['pending', 'accepted'] }, expiresAt: { $lt: now } },
        { $set: { status: 'expired' } }
      );
      if (result.modifiedCount > 0) {
        logger.info(`Expired ${result.modifiedCount} stale clan wars`);
      }
    } catch (error) {
      logger.error('War expiry cron error:', error);
    }
  });

  // Seasonal reset — 1st of Jan, Apr, Jul, Oct at 00:00
  const seasonalReset = new CronJob('0 0 1 1,4,7,10 *', async () => {
    logger.info('Running seasonal clan reset...');
    try {
      await clanService.resetSeason();
    } catch (error) {
      logger.error('Seasonal clan reset cron error:', error);
    }
  });

  weeklyReset.start();
  monthlyReset.start();
  warExpiry.start();
  seasonalReset.start();

  logger.info('Clan cron jobs initialized (weekly, monthly, seasonal resets, war expiry)');
}
