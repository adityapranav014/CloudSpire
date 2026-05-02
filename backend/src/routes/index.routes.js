import { Router } from 'express';
import alertsRouter from './alerts.routes.js';
import cloudRouter from './cloud.routes.js';
import optimizationsRouter from './optimizations.routes.js';
import rolesRouter from './roles.routes.js';
import teamsRouter from './teams.routes.js';
import unifiedRouter from './unified.routes.js';
import usersRouter from './users.routes.js';
import settingsRouter from './settings.routes.js';
import reportsRouter from './reports.routes.js';
import authRouter from './auth.routes.js';

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

export default router;