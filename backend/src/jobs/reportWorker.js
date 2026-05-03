import { Parser } from 'json2csv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import CostRecord from '../models/CostRecord.model.js';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const s3 = new S3Client({ region: env.awsRegion });

export const generateStandardReport = async (teamId, format = 'csv') => {
    try {
        logger.info({ teamId, format }, 'Generating report');

        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const costs = await CostRecord.aggregate([
            { $match: { teamId: teamId, date: { $gte: twelveMonthsAgo } } },
            { $group: { _id: { svc: '$service', prov: '$provider' }, totalCost: { $sum: '$cost' } } },
        ]);

        if (costs.length === 0) {
            logger.info({ teamId }, 'No data available for report');
            return 'No data';
        }

        let fileContent = '';
        if (format === 'csv') {
            const parser = new Parser();
            fileContent = parser.parse(costs);
        } else if (format === 'json') {
            fileContent = JSON.stringify(costs, null, 2);
        } else {
            throw new Error(`Unsupported format ${format}`);
        }

        const fileName = `reports/${teamId}-${Date.now()}.${format}`;
        const params = {
            Bucket: env.s3BucketName,
            Key: fileName,
            Body: fileContent,
            ContentType: format === 'csv' ? 'text/csv' : 'application/json',
        };

        if (env.s3BucketName) {
            await s3.send(new PutObjectCommand(params));
            logger.info({ teamId, fileName, bucket: params.Bucket }, 'Report saved to S3');
        } else {
            logger.warn({ teamId }, 'S3_BUCKET_NAME not configured — report generated in memory only');
        }

        return fileName;
    } catch (e) {
        logger.error({ err: e, teamId }, 'Report generation failed');
        throw e;
    }
};