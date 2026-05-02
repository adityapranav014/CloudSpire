#!/usr/bin/env node
/**
 * scripts/generateEncryptionKey.js
 * Generates a 64-character hex string (32 bytes) for AES-256-GCM encryption.
 */

console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'));
