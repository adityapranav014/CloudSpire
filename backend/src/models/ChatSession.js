import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        model: {
            type: String,
            default: null,
        },
        tokens: {
            prompt: { type: Number, default: 0 },
            completion: { type: Number, default: 0 },
        },
        finishReason: {
            type: String,
            default: null,
        },
    },
    { _id: true, timestamps: true }
);

const chatSessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            default: 'New Chat',
            maxlength: 200,
            trim: true,
        },
        model: {
            type: String,
            default: 'openai/gpt-4o-mini',
        },
        systemPrompt: {
            type: String,
            default: null,
        },
        messages: [messageSchema],
        messageCount: {
            type: Number,
            default: 0,
        },
        totalTokens: {
            type: Number,
            default: 0,
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        lastMessageAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Keep counters in sync
chatSessionSchema.pre('save', function (next) {
    this.messageCount = this.messages.filter((m) => m.role !== 'system').length;
    this.totalTokens = this.messages.reduce(
        (acc, m) => acc + (m.tokens?.prompt || 0) + (m.tokens?.completion || 0),
        0
    );
    if (this.messages.length > 0) {
        this.lastMessageAt = this.messages[this.messages.length - 1].createdAt || new Date();
    }
    next();
});

// Index for fast user-scoped queries sorted by latest activity
chatSessionSchema.index({ user: 1, lastMessageAt: -1 });

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
export default ChatSession;
