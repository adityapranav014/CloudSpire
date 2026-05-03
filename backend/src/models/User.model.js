import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 12; // PRD spec: salt rounds 12

/**
 * User — platform identity. Always scoped by orgId + teamId.
 *
 * Role hierarchy (most → least privileged):
 *   super_admin → finops_manager → cloud_engineer → team_lead → finance_analyst → read_only
 *
 * Maps to PRD roles:
 *   super_admin     = Admin
 *   finops_manager  = DevOps Manager
 *   finance_analyst = Finance Manager
 *   team_lead       = Team Lead
 *   read_only       = Viewer
 */
const userSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Org',
            required: [true, 'User must belong to an organisation.'],
            index: true,
        },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            required: [true, 'User must belong to a team.'],
        },
        name: {
            type: String,
            required: [true, 'Name is required.'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters.'],
        },
        email: {
            type: String,
            required: [true, 'Email is required.'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required.'],
            minlength: [8, 'Password must be at least 8 characters.'],
            select: false, // Never returned in queries unless explicitly requested
        },
        role: {
            type: String,
            enum: ['super_admin', 'finops_manager', 'cloud_engineer', 'team_lead', 'finance_analyst', 'read_only'],
            default: 'read_only',
        },
        isActive: {
            type: Boolean,
            default: true,
            // Soft-delete only — never hard-delete users (PRD constraint)
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        // Used for onboarding completion gate
        onboardingCompleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
// email is already unique (index auto-created). Add compound org queries.
userSchema.index({ orgId: 1 });
userSchema.index({ orgId: 1, role: 1 });
userSchema.index({ orgId: 1, teamId: 1 });

// ── Password hashing ──────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ── Instance methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Returns a safe user object without sensitive fields.
 * Called explicitly — do NOT add to toJSON to avoid accidental stripping
 * in contexts where we need all fields internally.
 */
userSchema.methods.toPublic = function () {
    return {
        id: this._id,
        orgId: this.orgId,
        teamId: this.teamId,
        name: this.name,
        email: this.email,
        role: this.role,
        isActive: this.isActive,
        onboardingCompleted: this.onboardingCompleted,
        lastLogin: this.lastLogin,
        createdAt: this.createdAt,
    };
};

export default mongoose.model('User', userSchema);
