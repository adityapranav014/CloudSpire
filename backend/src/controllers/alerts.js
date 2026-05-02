import { anomalies, budgetAlerts, anomalyHistory, anomalyStats } from '../data/mockAlerts.js';

export const getIndex = async (req, res, next) => {
    try {
        res.status(200).json({ anomalies, budgetAlerts, anomalyHistory, anomalyStats });
    } catch (error) { next(error); }
};

export const updateAnomaly = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const anomaly = anomalies.find(a => a.id === id);
        if (anomaly) {
            anomaly.status = status;
            if (status === 'resolved') {
                anomalyStats.resolvedThisMonth++;
                anomalyStats.spendPrevented += anomaly.deviationAmount || 0;
            }
            res.status(200).json({ message: "Anomaly updated", anomaly, anomalyStats });
        } else {
            res.status(404).json({ message: "Anomaly not found" });
        }
    } catch (error) { next(error); }
};
