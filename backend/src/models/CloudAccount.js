import mongoose from 'mongoose';
import { decrypt } from '../services/encryptionService.js';

const cloudAccountSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: [true, 'Name is required'] 
        },
        provider: { 
            type: String, 
            enum: ['aws', 'gcp', 'azure'], 
            default: 'aws' 
        },
        credentials: { 
            type: Object, 
            required: [true, 'Credentials are required'] 
        },
        team: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Team', 
            required: false   // Optional — teamId may be null in demo mode
        },
        addedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: [true, 'addedBy is required'] 
        },
        isActive: { 
            type: Boolean, 
            default: true 
        },
        // We keep orgId for data isolation across tenants
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Org',
            required: true
        }
    },
    { timestamps: true }
);

cloudAccountSchema.methods.getDecryptedCredentials = function () {
    const decrypted = {};
    if (!this.credentials) return decrypted;
    for (const [key, value] of Object.entries(this.credentials)) {
        if (value) {
            try {
                decrypted[key] = decrypt(value);
            } catch (err) {
                decrypted[key] = value; // fallback
            }
        }
    }
    return decrypted;
};

export default mongoose.model('CloudAccount', cloudAccountSchema);
