import mongoose from 'mongoose';

import { connectToDatabase, disconnectFromDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import Org from '../src/models/Org.js';
import Team from '../src/models/Team.model.js';
import User from '../src/models/User.model.js';
import Alert from '../src/models/Alert.model.js';
import Optimization from '../src/models/Optimization.model.js';
import { anomalies, budgetAlerts, anomalyHistory } from '../src/data/mockAlerts.js';
import {
    rightsizingRecommendations,
    reservedInstanceOpportunities,
    scheduledShutdowns,
} from '../src/data/mockOptimizations.js';

const DEMO_EMAIL = 'demo@cloudspire.local';
const DEMO_PASSWORD = 'DemoPass123!';
const DEMO_ORG_NAME = 'CloudSpire Demo Org';
const DEMO_TEAM_NAME = 'Platform';

function pickProviderResource(anomaly, fallback = 'resource') {
    return anomaly.affectedResource || anomaly.resourceId || `${anomaly.provider}-${fallback}`;
}

function mapAlertSeed(anomaly, orgId, teamId) {
    return {
        orgId,
        teamId,
        title: anomaly.service,
        description: anomaly.description,
        severity: anomaly.severity,
        status: anomaly.status === 'acknowledged' ? 'acknowledged' : anomaly.status,
        provider: anomaly.provider,
        resourceId: pickProviderResource(anomaly, anomaly.service?.toLowerCase().replace(/\s+/g, '-')),
        expectedSpend: anomaly.expectedSpend,
        actualSpend: anomaly.spendToday,
        dateDetected: anomaly.detectedAt ? new Date(anomaly.detectedAt) : new Date(),
        aiExplanation: anomaly.possibleCause || anomaly.description,
    };
}

function mapRightsizeOptimization(item, orgId, teamId) {
    return {
        orgId,
        teamId,
        title: `Rightsize ${item.resourceName}`,
        description: `${item.currentType} can be reduced to ${item.recommendedType} to save ${item.monthlySavings.toFixed(2)} USD/month.`,
        type: 'rightsize',
        provider: item.provider,
        resourceId: item.resourceId,
        potentialSavings: item.monthlySavings,
        confidenceScore: item.confidence === 'high' ? 0.92 : 0.75,
        status: item.status === 'implementing' ? 'implemented' : item.status,
    };
}

function mapReservedOptimization(item, orgId, teamId) {
    return {
        orgId,
        teamId,
        title: `Reserved ${item.service} commitment`,
        description: `Move ${item.instanceType} usage in ${item.region} to a reserved commitment to save ${item.monthlySavings.toFixed(2)} USD/month.`,
        type: 'reserved-instance',
        provider: item.provider,
        resourceId: `${item.service}-${item.region}-${item.instanceType}`,
        potentialSavings: item.monthlySavings,
        confidenceScore: 0.88,
        status: 'pending',
    };
}

function mapShutdownOptimization(item, orgId, teamId) {
    return {
        orgId,
        teamId,
        title: item.name,
        description: item.description,
        type: 'shutdown',
        provider: 'aws',
        resourceId: item.id,
        potentialSavings: item.estimatedSavings,
        confidenceScore: item.enabled ? 0.8 : 0.6,
        status: item.enabled ? 'pending' : 'ignored',
    };
}

async function seedDemoUserAndOrg() {
    let org = await Org.findOne({ name: DEMO_ORG_NAME });

    if (!org) {
        org = await Org.create({
            name: DEMO_ORG_NAME,
            plan: 'pro',
            monthlyBudget: 180000,
            currency: 'USD',
            settings: {
                timezone: 'UTC',
            },
        });
    }

    let team = await Team.findOne({ orgId: org._id, isDefault: true });

    if (!team) {
        team = await Team.create({
            orgId: org._id,
            name: DEMO_TEAM_NAME,
            isDefault: true,
            ownerId: org.ownerId || undefined,
        });
    }

    let user = await User.findOne({ email: DEMO_EMAIL });

    if (!user) {
        user = await User.create({
            orgId: org._id,
            teamId: team._id,
            name: 'Demo Admin',
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            role: 'super_admin',
            onboardingCompleted: true,
        });
    } else {
        user.orgId = org._id;
        user.teamId = team._id;
        user.role = 'super_admin';
        user.onboardingCompleted = true;
        await user.save();
    }

    org.ownerId = user._id;
    org.plan = 'pro';
    org.monthlyBudget = 180000;
    org.currency = 'USD';
    await org.save();

    team.ownerId = user._id;
    team.members = [user._id];
    team.name = DEMO_TEAM_NAME;
    await team.save();

    return { org, team, user };
}

async function seedDemoAlertsAndOptimizations(org, team) {
    await Alert.deleteMany({ orgId: org._id });
    await Optimization.deleteMany({ orgId: org._id });

    const alertSeeds = anomalies.map((anomaly) => mapAlertSeed(anomaly, org._id, team._id));
    const optimizationSeeds = [
        ...rightsizingRecommendations.map((item) => mapRightsizeOptimization(item, org._id, team._id)),
        ...reservedInstanceOpportunities.map((item) => mapReservedOptimization(item, org._id, team._id)),
        ...scheduledShutdowns.map((item) => mapShutdownOptimization(item, org._id, team._id)),
    ];

    if (alertSeeds.length > 0) {
        await Alert.insertMany(alertSeeds);
    }

    if (optimizationSeeds.length > 0) {
        await Optimization.insertMany(optimizationSeeds);
    }

    return { alertCount: alertSeeds.length, optimizationCount: optimizationSeeds.length };
}

async function main() {
    await connectToDatabase(env.mongoUri);

    const { org, team, user } = await seedDemoUserAndOrg();
    const counts = await seedDemoAlertsAndOptimizations(org, team);

    // Budget alerts and anomaly history remain mock-backed in the controller,
    // but we still report them here so the demo seed is self-documenting.
    console.log('[DemoSeed] Seeded demo org:', org._id.toString());
    console.log('[DemoSeed] Seeded demo team:', team._id.toString());
    console.log('[DemoSeed] Seeded demo user:', user.email);
    console.log('[DemoSeed] Seeded alerts:', counts.alertCount);
    console.log('[DemoSeed] Seeded optimizations:', counts.optimizationCount);
    console.log('[DemoSeed] Budget alerts in UI:', budgetAlerts.length);
    console.log('[DemoSeed] Anomaly history points in UI:', anomalyHistory.length);
    console.log('[DemoSeed] Demo login credentials:', `${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
    .catch((err) => {
        console.error('[DemoSeed] Failed:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await disconnectFromDatabase();
        await mongoose.connection.close().catch(() => {});
    });
