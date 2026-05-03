import mongoose from 'mongoose';

/**
 * Team — cost attribution unit within an Org.
 * Each Org gets one default "Platform" team created at signup.
 * Additional teams can be added by Admins in Settings.
 */
const teamSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Org',
            required: [true, 'Team must belong to an organisation.'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Team name is required.'],
            trim: true,
            maxlength: [80, 'Team name cannot exceed 80 characters.'],
        },
        monthlyBudget: {
            type: Number,
            default: 0, // INR
        },
        currency: {
            type: String,
            default: 'INR',
        },
        description: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        // Cloud resource IDs assigned to this team (populated via Accounts page)
        servers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Resource',
            },
        ],
        // Flexible tagging: env:production, squad:payments, etc.
        tags: [
            {
                key: { type: String, required: true },
                value: { type: String, required: true },
            },
        ],
        isDefault: {
            // The first team created for an org — cannot be deleted
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Compound indexes for all typical query patterns
teamSchema.index({ orgId: 1, name: 1 }, { unique: true });
teamSchema.index({ orgId: 1, isDefault: 1 });

export default mongoose.model('Team', teamSchema);
