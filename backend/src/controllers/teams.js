import { teams } from '../data/mockTeams.js';

export const getIndex = async (req, res, next) => {
    try {
        res.status(200).json({ teams });
    } catch (error) { next(error); }
};
