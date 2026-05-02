import { Router } from 'express';
import alertsRouter from './alerts.js';
import cloudRouter from './cloud.js';
import optimizationsRouter from './optimizations.js';
import rolesRouter from './roles.js';
import teamsRouter from './teams.js';
import unifiedRouter from './unified.js';
import usersRouter from './users.js';
import settingsRouter from './settings.js';
import reportsRouter from './reports.js';
import authRouter from './auth.js';
import metricsRouter from './metricsRoutes.js';

const router = Router();

router.get('/', (_request, response) => {
    response.status(200).json({
        message: 'CloudSpire API is ready',
    });
});

router.get('/health', (_request, response) => {
    response.status(200).json({
        status: 'ok',
        scope: 'api',
    });
});

router.use('/alerts', alertsRouter);
router.use('/cloud', cloudRouter);
router.use('/optimizations', optimizationsRouter);
router.use('/roles', rolesRouter);
router.use('/teams', teamsRouter);
router.use('/unified', unifiedRouter);
router.use('/users', usersRouter);
router.use('/settings', settingsRouter);
router.use('/reports', reportsRouter);
router.use('/auth', authRouter);
router.use('/metrics', metricsRouter);

export default router;