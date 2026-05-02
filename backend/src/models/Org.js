import mongoose from 'mongoose';

/**
 * Org — top-level multi-tenant boundary.
 * Every resource (Team, User, CostRecord, Alert, etc.) is scoped by orgId.
 * An Org is created automatically when the first user signs up (the Admin/owner).
 */
const orgSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Organisation name is required.'],
            trim: true,
            maxlength: [120, 'Organisation name cannot exceed 120 characters.'],
        },
        slug: {
            // URL-safe identifier derived from name — used for future white-label routes
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        plan: {
            type: String,
            enum: ['starter', 'pro', 'business', 'enterprise'],
            default: 'starter',
        },
        ownerId: {
            // The user who created the org — always has super_admin role
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        monthlyBudget: {
            type: Number,
            default: 0, // INR — 0 means no budget configured yet
        },
        currency: {
            type: String,
            default: 'INR',
        },
        settings: {
            alertEmail: { type: String, default: null },
            slackWebhook: { type: String, default: null },
            telegramChatId: { type: String, default: null },
            telegramBotToken: { type: String, default: null },
            timezone: { type: String, default: 'Asia/Kolkata' },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Auto-generate slug from name before validation
orgSchema.pre('validate', function (next) {
    if (this.isNew && this.name && !this.slug) {
        this.slug =
            this.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 60) +
            '-' +
            Date.now().toString(36); // suffix for uniqueness
    }
    next();
});

// Indexes
orgSchema.index({ slug: 1 }, { unique: true });
orgSchema.index({ ownerId: 1 });

export default mongoose.model('Org', orgSchema);
