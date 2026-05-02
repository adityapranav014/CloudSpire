import AuditLog from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export const logAction = async ({ teamId, userId, action, category, details }) => {
    try {
        await AuditLog.create({ teamId, userId, action, category, details });
    } catch (error) {
        logger.warn({ err: error, teamId, action }, 'Failed to write audit log');
    }
};