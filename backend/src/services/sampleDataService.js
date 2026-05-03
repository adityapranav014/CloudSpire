/**
 * sampleDataService.js
 *
 * Seeds the database with real AWS Cost and Usage Report sample data on first launch.
 * This data is used exclusively for demo accounts — orgs with zero connected CloudAccounts.
 *
 * Data source:
 *   https://github.com/aws-samples/aws-cost-and-usage-report-samples
 *
 * Isolation guarantee:
 *   - All sample records have { source: 'sample' }
 *   - orgId and teamId are fixed sentinel ObjectIds (SAMPLE_ORG_ID, SAMPLE_TEAM_ID)
 *   - Real org queries NEVER touch these records (dashboard gates on cloudAccounts.length)
 *   - Grep check: db.costrecords.find({ source: 'sample' }) → all demo records in one shot
 *
 * Seeding lifecycle:
 *   1. server.js calls seedSampleDataIfNeeded() after connectToDatabase()
 *   2. If CostRecord.countDocuments({ source: 'sample' }) > 0 → skip (already seeded)
 *   3. If CSV is missing → log warning, skip gracefully (server still starts)
 *   4. If CSV exists → parse, bulkWrite, log count
 *
 * Currency:
 *   - AWS CUR costs are in USD.
 *   - We store the raw USD amount in cost and set currency: 'USD'.
 *   - INR conversion (×83) happens in the dashboard controller's response mapping
 *     when org.currency === 'INR', not at storage time. This keeps raw data canonical.
 *
 * Field mapping (AWS CUR → CostRecord):
 *   line_item_product_code       → service
 *   line_item_unblended_cost     → cost (USD)
 *   line_item_usage_start_date   → date
 *   product_region               → region (falls back to 'global')
 *   line_item_resource_id        → resourceId
 *   resource_tags_user_team      → meta tag only (not stored in teamId — fixed sentinel)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse';
import mongoose from 'mongoose';

import CostRecord from '../models/CostRecord.model.js';
import { logger } from '../utils/logger.js';

// ── Sentinel IDs ───────────────────────────────────────────────────────────────
// These are fixed, well-known ObjectIds used ONLY for sample records.
// They do not correspond to any real Org or Team document.
// Both IDs are chosen to be visually recognisable in queries.
export const SAMPLE_ORG_ID  = new mongoose.Types.ObjectId('000000000000000000000001');
export const SAMPLE_TEAM_ID = new mongoose.Types.ObjectId('000000000000000000000002');

// ── File path ─────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const CSV_PATH   = path.join(__dirname, '..', '..', 'data', 'samples', 'aws-sample.csv');

// ── Constants ─────────────────────────────────────────────────────────────────
const USD_TO_INR   = 83;       // approximate — Sprint 2: fetch live from forex API
const BATCH_SIZE   = 500;      // bulkWrite batch to avoid hitting MongoDB 16MB doc limit
const PROVIDER     = 'aws';
const FALLBACK_REGION  = 'us-east-1';
const FALLBACK_SERVICE = 'AmazonEC2';

// ── CUR column name constants ─────────────────────────────────────────────────
// AWS CUR headers use snake_case. Some older CUR versions use camelCase or
// include a BOM prefix on the first column — normalise defensively.
const COL = {
    SERVICE:    'line_item_product_code',
    COST_USD:   'line_item_unblended_cost',
    START_DATE: 'line_item_usage_start_date',
    REGION:     'product_region',
    RESOURCE:   'line_item_resource_id',
    TAG_TEAM:   'resource_tags_user_team',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalises a CUR header string:
 *   - Strips BOM (ï»¿ / \uFEFF)
 *   - Lowercases + trims
 *   - Replaces spaces/hyphens with underscores
 */
function normaliseHeader(h) {
    return h
        .replace(/^\uFEFF/, '')   // UTF-8 BOM
        .replace(/^ï»¿/, '')      // Windows BOM artefact
        .toLowerCase()
        .trim()
        .replace(/[\s-]+/g, '_');
}

/**
 * Parses a CUR date string to a JS Date.
 * CUR format: "2023-08-01T00:00:00Z" or "2023-08-01 00:00:00"
 * Returns null if unparseable (row will be skipped).
 */
function parseCurDate(raw) {
    if (!raw) return null;
    const d = new Date(raw.replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Parses an AWS CUR CSV file into an array of CostRecord-compatible objects.
 * Skips rows with cost ≤ 0 or missing required fields.
 *
 * @param {string} filePath  Absolute path to the CSV
 * @returns {Promise<Array>} Array of plain objects ready for bulkWrite
 */
function parseCurCsv(filePath) {
    return new Promise((resolve, reject) => {
        const records = [];

        const parser = parse({
            columns: (headers) => headers.map(normaliseHeader),
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true, // CUR files sometimes have trailing commas
        });

        parser.on('readable', () => {
            let row;
            while ((row = parser.read()) !== null) {
                const costRaw = parseFloat(row[COL.COST_USD] || '0');
                if (costRaw <= 0) continue; // skip $0.00 lines (support/tax rows)

                const date = parseCurDate(row[COL.START_DATE]);
                if (!date) continue;

                const service    = (row[COL.SERVICE] || FALLBACK_SERVICE).trim();
                const region     = (row[COL.REGION]  || FALLBACK_REGION).trim() || FALLBACK_REGION;
                const resourceId = (row[COL.RESOURCE] || '').trim() || null;

                records.push({
                    orgId:         SAMPLE_ORG_ID,
                    teamId:        SAMPLE_TEAM_ID,
                    cloudAccountId: null,
                    provider:      PROVIDER,
                    source:        'sample',
                    date,
                    service,
                    region,
                    cost:          costRaw,
                    currency:      'USD',
                    resourceId,
                });
            }
        });

        parser.on('error', reject);
        parser.on('end', () => resolve(records));

        fs.createReadStream(filePath).pipe(parser);
    });
}

/**
 * Writes records to MongoDB in batches using bulkWrite (upsert on service+date+region).
 * Duplicate rows in the CSV (same service + date + region) are merged via $max on cost.
 *
 * @param {Array} records
 * @returns {Promise<number>} Total upserted/modified count
 */
async function bulkUpsertSampleRecords(records) {
    let total = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const ops   = batch.map((r) => ({
            updateOne: {
                filter: {
                    source:   'sample',
                    provider: PROVIDER,
                    date:     r.date,
                    service:  r.service,
                    region:   r.region,
                },
                update: { $setOnInsert: r },
                upsert: true,
            },
        }));

        const result = await CostRecord.bulkWrite(ops, { ordered: false });
        total += (result.upsertedCount || 0) + (result.modifiedCount || 0);
    }

    return total;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Called once at server startup after the DB connection is established.
 *
 * Contract:
 *   - If sample records already exist → log + return (idempotent).
 *   - If CSV not found → log warning + return (server still starts without sample data).
 *   - If any error → log + return (never crashes the server).
 *
 * @returns {Promise<void>}
 */
export async function seedSampleDataIfNeeded() {
    try {
        const existingCount = await CostRecord.countDocuments({ source: 'sample' });

        if (existingCount > 0) {
            logger.info(
                { existingCount },
                '[SampleData] Already seeded — skipping CSV parse'
            );
            return;
        }

        if (!fs.existsSync(CSV_PATH)) {
            logger.warn(
                { csvPath: CSV_PATH },
                '[SampleData] CSV not found. Run: node scripts/downloadSampleData.js'
            );
            return;
        }

        logger.info({ csvPath: CSV_PATH }, '[SampleData] Parsing AWS CUR CSV…');
        const records = await parseCurCsv(CSV_PATH);

        if (records.length === 0) {
            logger.warn(
                { csvPath: CSV_PATH },
                '[SampleData] CSV parsed but produced zero valid records (all rows had cost ≤ 0 or invalid dates)'
            );
            return;
        }

        logger.info({ count: records.length }, '[SampleData] Inserting records into MongoDB…');
        const written = await bulkUpsertSampleRecords(records);

        logger.info(
            { parsed: records.length, written },
            '[SampleData] ✓ Seed complete. Dashboard will serve sample data for accounts with no cloud connections.'
        );
    } catch (err) {
        // Non-fatal — server continues; demo data just won't be available
        logger.error({ err }, '[SampleData] Seeding failed — server will start without demo data');
    }
}

/**
 * Returns the SAMPLE_ORG_ID and SAMPLE_TEAM_ID for use in dashboard queries.
 * Exported so the dashboard controller can use these without hardcoding.
 */
export function getSampleIds() {
    return { orgId: SAMPLE_ORG_ID, teamId: SAMPLE_TEAM_ID };
}
