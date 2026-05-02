import { writeFile, readFile, unlink, readdir, stat, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, resolve } from "path";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// PDF Storage Service
//
// Primary:   Local filesystem   (hackathon / dev)
// Optional:  S3 upload          (production — set S3_BUCKET_NAME env var)
//
// All files are stored under REPORTS_DIR with unique names.
// A built-in cleanup deletes files older than MAX_AGE_MS.
// ---------------------------------------------------------------------------

const REPORTS_DIR = resolve("generated-reports");
const MAX_AGE_MS  = 24 * 60 * 60 * 1000;   // 24 hours
const SERVER_URL  = process.env.SERVER_URL || "http://localhost:4000";

/** Ensure the reports directory exists (called once at import time). */
async function ensureDir() {
    if (!existsSync(REPORTS_DIR)) {
        await mkdir(REPORTS_DIR, { recursive: true });
    }
}
ensureDir();

// ---------------------------------------------------------------------------
// Unique filename generator
// ---------------------------------------------------------------------------

/**
 * Builds a collision-free filename.
 *
 * Format: `CloudSpire_Report_<date>_<6-char-hex>.<ext>`
 *
 * @param {string} [prefix="CloudSpire_Report"]
 * @param {string} [ext="pdf"]
 * @returns {string}
 */
export const generateFilename = (prefix = "CloudSpire_Report", ext = "pdf") => {
    const datePart = new Date().toISOString().slice(0, 10);         // 2026-05-03
    const uid      = crypto.randomBytes(3).toString("hex");         // 6 hex chars
    return `${prefix}_${datePart}_${uid}.${ext}`;
};

// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

/**
 * Saves a PDF buffer to local disk and returns metadata including a
 * download URL the client can use.
 *
 * @param {Buffer} buffer   — PDF file contents
 * @param {string} [filename] — custom filename (auto-generated if omitted)
 * @returns {Promise<{ filename: string, filePath: string, downloadUrl: string, savedAt: string }>}
 */
export const saveReport = async (buffer, filename) => {
    const name     = filename || generateFilename();
    const filePath = join(REPORTS_DIR, name);

    await ensureDir();
    await writeFile(filePath, buffer);

    const downloadUrl = `${SERVER_URL}/api/v1/reports/download/${encodeURIComponent(name)}`;

    return {
        filename:    name,
        filePath,
        downloadUrl,
        savedAt:     new Date().toISOString(),
    };
};

// ---------------------------------------------------------------------------
// Read / Stream
// ---------------------------------------------------------------------------

/**
 * Reads a saved report from disk by filename.
 *
 * @param {string} filename
 * @returns {Promise<{ buffer: Buffer, filePath: string } | null>}
 */
export const getReport = async (filename) => {
    const filePath = join(REPORTS_DIR, filename);

    // Security: prevent path traversal
    if (!filePath.startsWith(REPORTS_DIR)) return null;

    try {
        const buffer = await readFile(filePath);
        return { buffer, filePath };
    } catch {
        return null;
    }
};

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Deletes a single report file.
 * @param {string} filename
 * @returns {Promise<boolean>}
 */
export const deleteReport = async (filename) => {
    const filePath = join(REPORTS_DIR, filename);
    if (!filePath.startsWith(REPORTS_DIR)) return false;

    try {
        await unlink(filePath);
        return true;
    } catch {
        return false;
    }
};

// ---------------------------------------------------------------------------
// Cleanup — removes files older than MAX_AGE_MS
// ---------------------------------------------------------------------------

/**
 * Scans the reports directory and deletes files past their max age.
 * Returns the number of files removed.
 *
 * @param {number} [maxAgeMs=MAX_AGE_MS]
 * @returns {Promise<number>}
 */
export const cleanupOldReports = async (maxAgeMs = MAX_AGE_MS) => {
    await ensureDir();
    const files  = await readdir(REPORTS_DIR);
    const now    = Date.now();
    let removed  = 0;

    for (const file of files) {
        try {
            const filePath  = join(REPORTS_DIR, file);
            const fileStat  = await stat(filePath);

            if (now - fileStat.mtimeMs > maxAgeMs) {
                await unlink(filePath);
                removed++;
            }
        } catch {
            // skip files that disappeared between readdir and stat
        }
    }

    if (removed > 0) {
        console.log(`[StorageService] Cleaned up ${removed} expired report(s)`);
    }

    return removed;
};
