import fs from 'fs';
import path from 'path';

const controllersDir = path.join(process.cwd(), 'backend/src/controllers');
const routesDir = path.join(process.cwd(), 'backend/src/routes');

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(controllersDir);
ensureDir(routesDir);

const routes = [
    {
        name: 'alerts',
        file: 'mockAlerts.js',
        exports: ['anomalies', 'budgetAlerts', 'anomalyHistory']
    },
    {
        name: 'cloud',
        file: 'mockAWS.js',
        // handling multiple clouds
    },
    {
        name: 'optimizations',
        file: 'mockOptimizations.js',
        exports: ['optimizationSummary', 'rightsizingRecommendations', 'reservedInstanceOpportunities', 'scheduledShutdowns']
    },
    {
        name: 'roles',
        file: 'mockRoles.js',
        exports: ['ROLES', 'PERMISSIONS', 'ROLE_PERMISSIONS', 'PAGE_ACCESS', 'DEMO_PERSONAS', 'ROLE_META']
    },
    {
        name: 'teams',
        file: 'mockTeams.js',
        exports: ['teams']
    },
    {
        name: 'unified',
        file: 'mockUnified.js',
        exports: ['UNIFIED_SCHEMA_FIELDS', 'dailySpend', 'monthlySpend', 'currentMonthStats', 'tagBreakdown']
    },
    {
        name: 'users',
        file: 'mockUsers.js',
        exports: ['users', 'CURRENT_USER']
    }
];

routes.forEach(route => {
    if (route.name === 'cloud') {
        const cloudController = `
import { awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources, awsRegionBreakdown } from '../data/mockAWS.js';
import { azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown } from '../data/mockAzure.js';
import { gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts } from '../data/mockGCP.js';

export const getAws = async (req, res, next) => {
    try {
        res.status(200).json({ awsAccounts, awsServiceBreakdown, awsEC2Instances, awsOrphanedResources, awsRegionBreakdown });
    } catch (error) { next(error); }
};

export const getAzure = async (req, res, next) => {
    try {
        res.status(200).json({ azureSubscriptions, azureServiceBreakdown, azureVMs, azureRegionBreakdown });
    } catch (error) { next(error); }
};

export const getGcp = async (req, res, next) => {
    try {
        res.status(200).json({ gcpProjects, gcpServiceBreakdown, gcpRegionBreakdown, gcpCommittedUseDiscounts });
    } catch (error) { next(error); }
};
`;
        fs.writeFileSync(path.join(controllersDir, 'cloud.js'), cloudController.trim() + '\n');

        const cloudRoute = `
import express from 'express';
import * as cloudController from '../controllers/cloud.js';

const router = express.Router();
router.get('/aws', cloudController.getAws);
router.get('/azure', cloudController.getAzure);
router.get('/gcp', cloudController.getGcp);

export default router;
`;
        fs.writeFileSync(path.join(routesDir, 'cloud.js'), cloudRoute.trim() + '\n');
        return;
    }

    const controllerContent = `
import { ${route.exports.join(', ')} } from '../data/${route.file}';

export const getIndex = async (req, res, next) => {
    try {
        res.status(200).json({ ${route.exports.join(', ')} });
    } catch (error) { next(error); }
};
`;
    fs.writeFileSync(path.join(controllersDir, `${route.name}.js`), controllerContent.trim() + '\n');

    const routeContent = `
import express from 'express';
import * as ${route.name}Controller from '../controllers/${route.name}.js';

const router = express.Router();
router.get('/', ${route.name}Controller.getIndex);

export default router;
`;
    fs.writeFileSync(path.join(routesDir, `${route.name}.js`), routeContent.trim() + '\n');
});

console.log("Generated successfully.");
