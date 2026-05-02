import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Validates an ISO 8601 date string (YYYY-MM-DD or full ISO). */
const isoDateString = z
    .string()
    .refine((v) => !isNaN(Date.parse(v)), { message: 'Must be a valid ISO 8601 date' });

/** Max allowed date range span — 1 year. */
const MAX_RANGE_DAYS = 366;

// ---------------------------------------------------------------------------
// POST /reports/generate  —  CSV / JSON
// ---------------------------------------------------------------------------
export const generateReportSchema = z.object({
    body: z.object({
        format: z
            .enum(['csv', 'json'], {
                required_error: 'Report format is required.',
                invalid_type_error: 'Format must be "csv" or "json".',
            }),
    }),
    query:  z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

// ---------------------------------------------------------------------------
// POST /reports/generate-pdf  &  /reports/generate-pdf/sync
// ---------------------------------------------------------------------------
export const generatePDFSchema = z.object({
    body: z.object({
        dateRange: z.object({
            start: isoDateString,
            end:   isoDateString,
        }).optional(),
    }).superRefine((data, ctx) => {
        if (data.dateRange) {
            const start = new Date(data.dateRange.start);
            const end   = new Date(data.dateRange.end);

            if (start > end) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['dateRange', 'end'],
                    message: 'End date must be after start date.',
                });
            }

            const diffDays = (end - start) / (1000 * 60 * 60 * 24);
            if (diffDays > MAX_RANGE_DAYS) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['dateRange'],
                    message: `Date range cannot exceed ${MAX_RANGE_DAYS} days.`,
                });
            }

            if (end > new Date()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['dateRange', 'end'],
                    message: 'End date cannot be in the future.',
                });
            }
        }
    }),
    query:  z.object({}).passthrough(),
    params: z.object({}).passthrough(),
});

// ---------------------------------------------------------------------------
// GET /reports/status/:jobId
// ---------------------------------------------------------------------------
export const jobStatusSchema = z.object({
    body:   z.object({}).passthrough(),
    query:  z.object({}).passthrough(),
    params: z.object({
        jobId: z
            .string({ required_error: 'Job ID is required.' })
            .min(1, 'Job ID cannot be empty.')
            .max(64, 'Job ID is too long.'),
    }),
});

// ---------------------------------------------------------------------------
// GET /reports/download/:filename
// ---------------------------------------------------------------------------

const SAFE_FILENAME_RE = /^[a-zA-Z0-9_\-]+\.pdf$/;

export const downloadReportSchema = z.object({
    body:   z.object({}).passthrough(),
    query:  z.object({}).passthrough(),
    params: z.object({
        filename: z
            .string({ required_error: 'Filename is required.' })
            .min(5, 'Filename is too short.')
            .max(128, 'Filename is too long.')
            .regex(SAFE_FILENAME_RE, 'Filename contains invalid characters. Only alphanumerics, hyphens, underscores, and .pdf extension are allowed.'),
    }),
});
