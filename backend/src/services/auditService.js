import AuditLog from '../models/AuditLog.model.js';

export const logAction = async ({ teamId, userId, action, category, details }) => {
    try {
        await AuditLog.create({
            teamId,
            userId,
            action,
            category,
            details
        });
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};