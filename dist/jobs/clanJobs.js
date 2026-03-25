"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initClanJobs = initClanJobs;
const cron_1 = require("cron");
const clan_service_1 = __importDefault(require("../services/clan.service"));
const Clan_1 = require("../models/Clan");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Initialize all clan-related cron jobs.
 */
function initClanJobs() {
    // Reset weekly points every Monday at 00:00
    const weeklyReset = new cron_1.CronJob('0 0 * * 1', async () => {
        logger_1.default.info('Running weekly clan points reset...');
        try {
            await clan_service_1.default.resetWeeklyPoints();
        }
        catch (error) {
            logger_1.default.error('Weekly clan reset cron error:', error);
        }
    });
    // Reset monthly points on the 1st of each month at 00:00
    const monthlyReset = new cron_1.CronJob('0 0 1 * *', async () => {
        logger_1.default.info('Running monthly clan points reset...');
        try {
            await clan_service_1.default.resetMonthlyPoints();
        }
        catch (error) {
            logger_1.default.error('Monthly clan reset cron error:', error);
        }
    });
    // Expire stale wars every hour
    const warExpiry = new cron_1.CronJob('0 * * * *', async () => {
        try {
            const now = new Date();
            const result = await Clan_1.ClanWar.updateMany({ status: { $in: ['pending', 'accepted'] }, expiresAt: { $lt: now } }, { $set: { status: 'expired' } });
            if (result.modifiedCount > 0) {
                logger_1.default.info(`Expired ${result.modifiedCount} stale clan wars`);
            }
        }
        catch (error) {
            logger_1.default.error('War expiry cron error:', error);
        }
    });
    // Seasonal reset — 1st of Jan, Apr, Jul, Oct at 00:00
    const seasonalReset = new cron_1.CronJob('0 0 1 1,4,7,10 *', async () => {
        logger_1.default.info('Running seasonal clan reset...');
        try {
            await clan_service_1.default.resetSeason();
        }
        catch (error) {
            logger_1.default.error('Seasonal clan reset cron error:', error);
        }
    });
    weeklyReset.start();
    monthlyReset.start();
    warExpiry.start();
    seasonalReset.start();
    logger_1.default.info('Clan cron jobs initialized (weekly, monthly, seasonal resets, war expiry)');
}
//# sourceMappingURL=clanJobs.js.map