/**
 * services/encryptionService.js
 *
 * AES-256-GCM encryption for sensitive cloud credentials.
 * GCM provides both confidentiality and authenticity (via auth tag),
 * preventing padding oracle attacks that affect CBC.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

const ALGO = 'aes-256-gcm';

// Cache the key buffer — must be exactly 32 bytes (64 hex chars)
let keyBuffer = null;

function getKey() {
    if (!keyBuffer) {
        if (!env.encryptionKey) {
            console.error('FATAL: ENCRYPTION_KEY not set');
            process.exit(1);
        }
        keyBuffer = Buffer.from(env.encryptionKey, 'hex');
        if (keyBuffer.length !== 32) {
            console.error('FATAL: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
            process.exit(1);
        }
    }
    return keyBuffer;
}

/**
 * Encrypts a plaintext string.
 * @param {string} plaintext
 * @returns {string} Format: "iv:authTag:encryptedHex"
 */
export function encrypt(plaintext) {
    if (!plaintext) return plaintext;
    
    // Generate a fresh random 16-byte IV for every encryption call
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGO, getKey(), iv);
    
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a ciphertext string back to plaintext.
 * @param {string} ciphertext Format: "iv:authTag:encryptedHex"
 * @returns {string}
 */
export function decrypt(ciphertext) {
    if (!ciphertext) return ciphertext;
    
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format. Expected iv:tag:data');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    
    const decipher = createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    
    // If the auth tag verification fails, decipher.final() will throw an error
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * Helper to generate a new 32-byte hex key.
 * Used by the CLI generation script.
 */
export function generateEncryptionKey() {
    return randomBytes(32).toString('hex');
}
