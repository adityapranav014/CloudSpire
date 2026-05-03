import crypto from 'crypto';
import ApiKey from '../models/ApiKey.model.js';
import { asyncHandler } from './asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const protectApiKey = asyncHandler(async (req, res, next) => {
    const apiKeyHeader = req.headers['x-api-key'];

    if (!apiKeyHeader) {
        return next(new AppError('API key is missing in x-api-key header', 401));
    }

    // Hash the incoming key to compare with the DB
    const keyHash = crypto.createHash('sha256').update(apiKeyHeader).digest('hex');
    const apiKey = await ApiKey.findOne({ keyHash });

    if (!apiKey) {
        return next(new AppError('Invalid API key', 401));
    }

    // Update last used footprint asynchronously
    apiKey.lastUsedAt = new Date();
    apiKey.save().catch(e => console.error('Failed to update API key timestamp', e));

    // Attach minimal team payload context equivalent to an authenticated user
    req.user = { teamId: apiKey.teamId, isApiKey: true };
    next();
});