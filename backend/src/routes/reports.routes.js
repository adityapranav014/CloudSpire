import { Router } from 'express';
import {
    getReports,
    triggerReportGeneration,
    generatePDFQueued,
    generatePDFDownload,
    getReportJobStatus,
    downloadReport,
} from '../controllers/reports.controller.js';
import { protect } from '../middleware/auth.js';
import { authorize, WRITE_ROLES } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
    reportGenerationLimiter,
    reportStatusLimiter,
    reportDownloadLimiter,
} from '../middleware/rateLimiter.js';
import {
    generateReportSchema,
    generatePDFSchema,
    jobStatusSchema,
    downloadReportSchema,
} from '../validators/reportSchemas.js';

const router = Router();

// All routes require JWT authentication
router.use(protect);

// GET  /                     — list report templates
router.get('/', getReports);

// POST /generate             — CSV / JSON  (write — rate limited + validated)
router.post('/generate',
    reportGenerationLimiter,
    authorize(...WRITE_ROLES),
    validate(generateReportSchema),
    triggerReportGeneration,
);

// POST /generate-pdf         — async BullMQ  (write — rate limited + validated)
router.post('/generate-pdf',
    reportGenerationLimiter,
    authorize(...WRITE_ROLES),
    validate(generatePDFSchema),
    generatePDFQueued,
);

// POST /generate-pdf/sync    — sync download  (write — rate limited + validated)
router.post('/generate-pdf/sync',
    reportGenerationLimiter,
    authorize(...WRITE_ROLES),
    validate(generatePDFSchema),
    generatePDFDownload,
);

// GET  /status/:jobId        — poll job progress (rate limited + validated)
router.get('/status/:jobId',
    reportStatusLimiter,
    validate(jobStatusSchema),
    getReportJobStatus,
);

// GET  /download/:filename   — download saved PDF (rate limited + validated)
router.get('/download/:filename',
    reportDownloadLimiter,
    validate(downloadReportSchema),
    downloadReport,
);

export default router;