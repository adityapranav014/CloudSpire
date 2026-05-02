#!/usr/bin/env node
/**
 * scripts/migrateCredentials.js
 * 
 * Migrates existing plaintext CloudAccount credentials to AES-256-GCM.
 * Run manually: node scripts/migrateCredentials.js
 * Supports DRY_RUN=true environment variable.
 */

import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import CloudAccount from '../src/models/CloudAccount.js';
import { encrypt } from '../src/services/encryptionService.js';
import { logger } from '../src/utils/logger.js';

const SENSITIVE_FIELDS = ['accessKey', 'secretKey', 'tenantId', 'clientId', 'clientSecret', 'subscriptionId', 'serviceAccountJson'];

async function migrate() {
    const isDryRun = process.env.DRY_RUN === 'true';
    console.log(`\n=== CloudSpire Credentials Migration ===\n`);
    if (isDryRun) {
        console.log(`[DRY RUN MODE] No changes will be saved to the database.\n`);
    }

    try {
        await mongoose.connect(env.mongoUri);
        console.log(`Connected to MongoDB: ${env.mongoUri.split('@').pop()}`);

        const accounts = await CloudAccount.find({});
        console.log(`Found ${accounts.length} CloudAccount documents.`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const account of accounts) {
            if (!account.credentials) {
                skippedCount++;
                continue;
            }

            let needsMigration = false;
            const updates = {};

            for (const field of SENSITIVE_FIELDS) {
                const val = account.credentials[field];
                if (val && typeof val === 'string') {
                    // Check if it already looks like an encrypted payload "iv:tag:data"
                    const parts = val.split(':');
                    if (parts.length === 3) {
                        // Already encrypted
                        continue;
                    }

                    // It's plaintext
                    needsMigration = true;
                    updates[field] = encrypt(val);
                }
            }

            if (needsMigration) {
                if (isDryRun) {
                    console.log(`[DRY_RUN] Would encrypt credentials for account ${account.name} (${account._id})`);
                } else {
                    // Update credentials directly
                    for (const [k, v] of Object.entries(updates)) {
                        account.credentials[k] = v;
                    }
                    
                    // Mark as modified to trigger Mongoose pre('save')? 
                    // No, since we manually encrypted above using encryptionService, 
                    // but wait, if we use account.save(), the pre('save') hook in CloudAccount.js
                    // will re-encrypt it!
                    // Let's use updateOne to bypass pre('save') and avoid double encryption.
                    await CloudAccount.updateOne(
                        { _id: account._id },
                        { $set: { credentials: account.credentials } }
                    );
                    console.log(`[MIGRATED] Encrypted credentials for account ${account.name} (${account._id})`);
                }
                migratedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`\n=== Migration Complete ===`);
        console.log(`Migrated: ${migratedCount}`);
        console.log(`Skipped:  ${skippedCount}`);

    } catch (error) {
        console.error(`\n[FATAL ERROR] Migration failed:`, error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log(`Disconnected from MongoDB.\n`);
    }
}

migrate();
