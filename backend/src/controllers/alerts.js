import { anomalies, budgetAlerts, anomalyHistory } from '../data/mockAlerts.js';

export const getIndex = async (req, res, next) => {
    try {
        res.status(200).json({ anomalies, budgetAlerts, anomalyHistory });
    } catch (error) { next(error); }
};
