import { Router } from 'express';
import {
    getReports,
    triggerReportGeneration,
    generatePDFQueued,
    generatePDFDownload,
    getReportJobStatus,
    downloadReport,
} from '../controllers/reports.js';
import { protect } from '../middleware/auth.js';
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

// POST /generate             — CSV / JSON  (rate limited + validated)
router.post('/generate',
    reportGenerationLimiter,
    validate(generateReportSchema),
    triggerReportGeneration,
);

// POST /generate-pdf         — async BullMQ  (rate limited + validated)
router.post('/generate-pdf',
    reportGenerationLimiter,
    validate(generatePDFSchema),
    generatePDFQueued,
);

// POST /generate-pdf/sync    — sync download  (rate limited + validated)
router.post('/generate-pdf/sync',
    reportGenerationLimiter,
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