import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, PAGE_ACCESS, DEMO_PERSONAS, ROLE_META } from '../data/mockRoles.js';
import { catchAsync } from '../middleware/asyncHandler.js';

export const getIndex = catchAsync(async (req, res, next) => {
    res.status(200).json({ ROLES, PERMISSIONS, ROLE_PERMISSIONS, PAGE_ACCESS, DEMO_PERSONAS, ROLE_META });
});
