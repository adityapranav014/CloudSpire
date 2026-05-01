import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, PAGE_ACCESS, DEMO_PERSONAS, ROLE_META } from '../data/mockRoles.js';

export const getIndex = async (req, res, next) => {
    try {
        res.status(200).json({ ROLES, PERMISSIONS, ROLE_PERMISSIONS, PAGE_ACCESS, DEMO_PERSONAS, ROLE_META });
    } catch (error) { next(error); }
};
