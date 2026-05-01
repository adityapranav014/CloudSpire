import { users, CURRENT_USER } from '../data/mockUsers.js';

export const getIndex = async (req, res, next) => {
    try {
        res.status(200).json({ users, CURRENT_USER });
    } catch (error) { next(error); }
};
