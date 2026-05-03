import { Parser } from 'json2csv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import CostRecord from '../models/CostRecord.model.js';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const s3 = new S3Client({ region: env.awsRegion });

/**
 * Generates a standard CSV/JSON cost report for a given org (and optionally team).
 *
 * @param {object}  opts
 * @param {string}  opts.orgId   — organisation ObjectId (required for tenant scoping)
 * @param {string}  [opts.teamId] — optional team filter
 * @param {string}  [opts.format] — 'csv' or 'json' (default: 'csv')
 * @param {object}  data         — data fetched from controller { costs, teams, alerts }
 * @returns {Promise<string>}    — S3 key or 'in-memory' if S3 is not configured
 */
export const generateStandardReport = async (orgId, format = 'csv', data = {}) => {
    const startTime = Date.now();
    console.log('[REPORT_WORKER] generateStandardReport — START, orgId:', orgId, 'format:', format);

    try {
        const costs = data.costs || [];
        const teams = data.teams || [];
        const alerts = data.alerts || [];

        if (costs.length === 0) {
            console.log('[REPORT_WORKER] No cost data found for orgId:', orgId, '— returning empty report indicator');
            return 'No data';
        }

        let fileContent = '';
        if (format === 'csv') {
            const parser = new Parser();
            fileContent = parser.parse(costs);
            console.log('[REPORT_WORKER] CSV generated — size:', fileContent.length, 'bytes');
        } else if (format === 'json') {
            fileContent = JSON.stringify(costs, null, 2);
            console.log('[REPORT_WORKER] JSON generated — size:', fileContent.length, 'bytes');
        } else {
            console.error('[REPORT_WORKER] Unsupported format:', format);
            throw new Error(`Unsupported format "${format}". Use "csv" or "json".`);
        }

        const fileName = `reports/${orgId}-${Date.now()}.${format}`;
        const params = {
            Bucket: env.s3BucketName,
            Key: fileName,
            Body: fileContent,
            ContentType: format === 'csv' ? 'text/csv' : 'application/json',
        };

        if (env.s3BucketName) {
            console.log('[REPORT_WORKER] Uploading to S3 — bucket:', params.Bucket, 'key:', fileName);
            const uploadStart = Date.now();
            await s3.send(new PutObjectCommand(params));
            console.log('[REPORT_WORKER] S3 upload completed in', Date.now() - uploadStart, 'ms');
            logger.info({ orgId, fileName, bucket: params.Bucket }, 'Report saved to S3');
        } else {
            console.warn('[REPORT_WORKER] S3_BUCKET_NAME not configured — report generated in memory only');
        }

        const elapsed = Date.now() - startTime;
        console.log('[REPORT_WORKER] generateStandardReport — COMPLETE in', elapsed, 'ms, file:', fileName);

        return fileName;
    } catch (e) {
        const elapsed = Date.now() - startTime;
        console.error('[REPORT_WORKER] generateStandardReport — FAILED after', elapsed, 'ms:', e.message);
        console.error('[REPORT_WORKER] Stack:', e.stack);
        logger.error({ err: e, orgId }, 'Report generation failed');
        throw e;
    }
};