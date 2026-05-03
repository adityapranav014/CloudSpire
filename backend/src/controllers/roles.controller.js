import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, PAGE_ACCESS, DEMO_PERSONAS, ROLE_META } from '../data/mockRoles.js';
import { catchAsync } from '../middleware/asyncHandler.js';

export const getIndex = catchAsync(async (req, res, next) => {
    console.log('[ROLES] GET /roles — User:', req.user);
    console.log('[ROLES] getIndex success — roles:', Object.keys(ROLE_PERMISSIONS).length);
    res.status(200).json({ ROLES, PERMISSIONS, ROLE_PERMISSIONS, PAGE_ACCESS, DEMO_PERSONAS, ROLE_META });
});
