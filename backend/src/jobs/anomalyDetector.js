import cron from 'node-cron';
import CostRecord from '../models/CostRecord.js';
import Alert from '../models/Alert.js';
import Team from '../models/Team.js';
import Integration from '../models/Integration.js';
>>>>>>> origin/main
import { sendAnomalyAlertEmail } from '../services/emailService.js';
import { notifySlack } from '../services/integrationService.js';

export const analyzeAnomalies = async () => {
    try {
        console.log("Running Daily Anomaly Detection Job...");

        // Find all teams
        const teams = await Team.find();

        for (let team of teams) {
            // Aggregation pipeline to find average service cost over last 30 days
            const stats = await CostRecord.aggregate([
                { $match: { teamId: team._id, date: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } },
                { $group: { _id: "$service", avgCost: { $avg: "$cost" }, maxCost: { $max: "$cost" } } }
            ]);

            for (let stat of stats) {
                // Determine if recent record is wildly higher than moving average
                const latestRecord = await CostRecord.findOne({ teamId: team._id, service: stat._id }).sort('-date');

                if (latestRecord && latestRecord.cost > (stat.avgCost * 1.5)) { // 50% deviation Threshold
                    // We found an anomaly! Check if we already alerted
                    const existingAlert = await Alert.findOne({ teamId: team._id, resourceId: stat._id, status: 'open' });

                    if (!existingAlert) {
                        const newAlert = await Alert.create({
                            teamId: team._id,
                            title: `${stat._id} Spend Surge`,
                            description: `Spend on ${stat._id} jumped to $${latestRecord.cost} (avg: $${stat.avgCost.toFixed(2)})`,
                            severity: latestRecord.cost > stat.avgCost * 3 ? 'critical' : 'high',
                            status: 'open',
                            provider: latestRecord.provider,
                            resourceId: stat._id,
                            expectedSpend: stat.avgCost,
                            actualSpend: latestRecord.cost
                        });

                        // Fetch team integrations to notify
                        const slackDest = await Integration.findOne({ teamId: team._id, provider: 'slack' });
                        if (slackDest && slackDest.config?.webhookUrl) {
                            await notifySlack(slackDest.config.webhookUrl, `🚨 CloudSpire Anomaly: ${newAlert.title}`, {
                                Service: stat._id,
                                'Actual Spend': `$${latestRecord.cost}`,
                                'Expected Spend': `$${stat.avgCost.toFixed(2)}`
                            });
                        }
                    }
                }
            }
        }

    } catch (err) {
        console.error("Anomaly Job Failed", err);
    }
};

// Run every night at midnight
export const initJobs = () => {
    cron.schedule('0 0 * * *', analyzeAnomalies);
};