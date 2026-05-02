import { Parser } from 'json2csv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import CostRecord from '../models/CostRecord.model.js';
import crypto from 'crypto';

// In a real environment, you'd configure an S3 bucket with env vars
const s3 = new S3Client({ region: 'us-east-1' });

export const generateStandardReport = async (teamId, format = 'csv') => {
    try {
        console.log(`Generating Async Report for Team ${teamId}`);
        // 1. Heavy Database Query simulating Data Warehousing
        const costs = await CostRecord.aggregate([
            { $match: { teamId: teamId } },
            { $group: { _id: { svc: "$service", prov: "$provider" }, totalCost: { $sum: "$cost" } } }
        ]);

        if (costs.length === 0) {
            console.log("No data available to report");
            return "No data";
        }

        // 2. Format parsing
        let fileContent = '';
        if (format === 'csv') {
            const parser = new Parser();
            fileContent = parser.parse(costs);
        } else if (format === 'json') {
            fileContent = JSON.stringify(costs, null, 2);
        } else {
            throw new Error(`Unsupported format ${format}`);
        }

        // 3. Simulating file upload to Cloud Storage
        // For production, S3 config is required
        const fileName = `reports/${teamId}-${Date.now()}.${format}`;

        const params = {
            Bucket: process.env.S3_BUCKET_NAME || 'cloudspire-reports-bucket', // Requires actual bucket configuration
            Key: fileName,
            Body: fileContent,
            ContentType: format === 'csv' ? 'text/csv' : 'application/json'
        };

        if (process.env.S3_BUCKET_NAME) {
            await s3.send(new PutObjectCommand(params));
            console.log(`Document saved to S3 bucket ${params.Bucket} at ${fileName}`);
        } else {
            // We fallback to console mock behavior so the prototype doesn't break locally
            console.log("S3 Bucket env not configured. File generated in memory successfully.");
        }

        return fileName;
    } catch (e) {
        console.error("Report Generation Failed", e);
        throw e;
    }
};