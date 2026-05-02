import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be hashed via bcrypt
    role: { type: String, enum: ['Admin', 'DevOps Manager', 'Finance Manager', 'Team Lead', 'Viewer'], default: 'Viewer' },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
export default mongoose.model('User', userSchema);
