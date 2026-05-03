import crypto from 'crypto';
import ApiKey from '../models/ApiKey.model.js';
import Integration from '../models/Integration.model.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logAction } from '../services/auditService.js';
import { mockSettings } from '../data/mockSettings.js';

export const getSettings = catchAsync(async (req, res) => {
    console.log('[SETTINGS] GET /settings — User:', req.user);

    const teamId = req.user.teamId;
    const liveIntegrations = await Integration.find({ teamId });
    console.log('[SETTINGS] getSettings — liveIntegrations:', liveIntegrations.length);

    // 2. We keep the base mock for the profile UI details until the full user preferences logic is built
    const settingsData = {
        ...mockSettings,
        integrations: liveIntegrations.length > 0 ? liveIntegrations.map(inv => ({
            id: inv._id,
            name: inv.name,
            provider: inv.provider,
            status: inv.isActive ? 'connected' : 'disconnected',
            category: inv.provider === 'slack' || inv.provider === 'msteams' ? 'Chat Ops' :
                inv.provider === 'jira' ? 'Ticketing' : 'Custom',
            features: [inv.provider === 'webhook' ? 'Receive raw JSON' : 'Automated Notifications']
        })) : mockSettings.integrations // fallback to mock integrations
    };

    console.log('[SETTINGS] getSettings success — integrations:', settingsData.integrations?.length);
    res.status(200).json({
        success: true,
        data: settingsData,
    });
});

export const connectIntegration = catchAsync(async (req, res, next) => {
    console.log('[SETTINGS] POST /settings/integrations — User:', req.user, 'Body:', { provider: req.body.provider, name: req.body.name });

    const { provider, name, config } = req.body;
    const teamId = req.user.teamId;

    if (!provider || !name) {
        console.log('[SETTINGS] connectIntegration error: Missing provider or name');
        return next(new AppError('Provider and name are required.', 400, 'MISSING_FIELDS'));
    }

    const newIntegration = await Integration.create({
        teamId,
        provider,
        name,
        config,
        isActive: true
    });

    console.log('[SETTINGS] connectIntegration success — integrationId:', newIntegration._id, 'provider:', provider);
    res.status(201).json({
        success: true,
        data: newIntegration
    });
});

export const getApiKeys = catchAsync(async (req, res, next) => {
    console.log('[SETTINGS] GET /settings/api-keys — User:', req.user);

    const teamId = req.user.teamId;
    const keys = await ApiKey.find({ teamId }).select('-keyHash').sort('-createdAt');

    console.log('[SETTINGS] getApiKeys success — count:', keys.length);
    res.status(200).json({ success: true, data: { keys } });
});

export const createApiKey = catchAsync(async (req, res, next) => {
    console.log('[SETTINGS] POST /settings/api-keys — User:', req.user, 'Body:', { name: req.body.name });

    const { name } = req.body;
    const teamId = req.user.teamId;
    const userId = req.user.id;

    if (!name) {
        console.log('[SETTINGS] createApiKey error: Missing API key name');
        return next(new AppError('API key name is required.', 400, 'MISSING_FIELDS'));
    }

    // 1. Generate unrecoverable raw key
    const rawValue = crypto.randomBytes(32).toString('hex');
    const displayToken = `cs_live_${rawValue}`;

    // 2. Hash it to store in database securely
    const keyHash = crypto.createHash('sha256').update(displayToken).digest('hex');
    const prefix = displayToken.substring(0, 15) + '...';

    const apiKey = await ApiKey.create({
        teamId,
        createdBy: userId,
        name,
        keyHash,
        prefix
    });

    // 3. Write purely to Audit Log (SOC2 compliance footprint)
    await logAction({
        teamId,
        userId,
        action: 'api_key_created',
        category: 'api_key',
        details: { keyName: name, generatedAt: new Date() }
    });

    console.log('[SETTINGS] createApiKey success — apiKeyId:', apiKey._id, 'name:', name);
    // 4. Return raw key exactly once so UI can display it
    res.status(201).json({
        success: true,
        data: { rawKey: displayToken, apiKey }
    });
});

export const deleteApiKey = catchAsync(async (req, res, next) => {
    console.log('[SETTINGS] DELETE /settings/api-keys/:id — Params:', req.params, 'User:', req.user);

    const { id } = req.params;
    const teamId = req.user.teamId;

    const apiKey = await ApiKey.findOneAndDelete({ _id: id, teamId });
    if (!apiKey) {
        console.log('[SETTINGS] deleteApiKey error: API key not found — id:', id, 'teamId:', teamId);
        return next(new AppError('API key not found or already revoked.', 404, 'NOT_FOUND'));
    }

    await logAction({
        teamId,
        userId: req.user?.id,
        action: 'api_key_revoked',
        category: 'api_key',
        details: { keyName: apiKey.name }
    });

    console.log('[SETTINGS] deleteApiKey success — id:', id, 'name:', apiKey.name);
    res.status(200).json({ success: true, data: null });
});