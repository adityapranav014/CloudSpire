import { z } from 'zod';
import ChatSession from '../models/ChatSession.js';
import { streamChatCompletion, generateSessionTitle, AVAILABLE_MODELS } from '../services/openRouterService.js';
import { buildCloudContextPrompt } from '../services/cloudContextService.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const VALID_MODEL_IDS = AVAILABLE_MODELS.map((m) => m.id);

// ── Validators ────────────────────────────────────────────────────────────────

const createSessionSchema = z.object({
    title: z.string().max(200).optional(),
    model: z.string().optional(),
    systemPrompt: z.string().max(100000).optional().nullable(),
});

const sendMessageSchema = z.object({
    content: z.string().min(1).max(32000),
    model: z.string().optional(), // allow per-message model override
});

const updateTitleSchema = z.object({
    title: z.string().min(1).max(200),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function validate(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const issues = result.error?.issues || result.error?.errors || [];
        const message = issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') || 'Validation failed';
        throw new AppError(message, 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

function resolveModel(requested) {
    if (!requested) return 'openai/gpt-4o-mini';
    if (!VALID_MODEL_IDS.includes(requested)) {
        throw new AppError(`Unsupported model: ${requested}`, 400, 'INVALID_MODEL');
    }
    return requested;
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** GET /chat/models — list available models */
export const listModels = catchAsync(async (_req, res) => {
    res.status(200).json({ success: true, data: AVAILABLE_MODELS });
});

/** GET /chat/context — build and return cloud context system prompt */
export const getCloudContext = catchAsync(async (req, res) => {
    const systemPrompt = await buildCloudContextPrompt(req.user);
    res.status(200).json({ success: true, data: { systemPrompt } });
});

/** GET /chat/sessions — list sessions for the current user */
export const listSessions = catchAsync(async (req, res) => {
    const sessions = await ChatSession.find({ user: req.user._id })
        .select('-messages')
        .sort({ isPinned: -1, lastMessageAt: -1 })
        .limit(100)
        .lean();

    res.status(200).json({ success: true, data: sessions });
});

/** POST /chat/sessions — create a new session */
export const createSession = catchAsync(async (req, res) => {
    const body = validate(createSessionSchema, req.body);
    const model = resolveModel(body.model);

    const session = await ChatSession.create({
        user: req.user._id,
        title: body.title || 'New Chat',
        model,
        systemPrompt: body.systemPrompt ?? null,
    });

    res.status(201).json({ success: true, data: session });
});

/** GET /chat/sessions/:id — get a single session with messages */
export const getSession = catchAsync(async (req, res) => {
    const session = await ChatSession.findOne({
        _id: req.params.id,
        user: req.user._id,
    }).lean();

    if (!session) throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');

    res.status(200).json({ success: true, data: session });
});

/** PATCH /chat/sessions/:id/title — rename a session */
export const updateSessionTitle = catchAsync(async (req, res) => {
    const { title } = validate(updateTitleSchema, req.body);

    const session = await ChatSession.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { title },
        { new: true, select: '-messages' }
    );

    if (!session) throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');

    res.status(200).json({ success: true, data: session });
});

/** PATCH /chat/sessions/:id/pin — toggle pin */
export const togglePinSession = catchAsync(async (req, res) => {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');

    session.isPinned = !session.isPinned;
    await session.save();

    res.status(200).json({ success: true, data: { isPinned: session.isPinned } });
});

/** DELETE /chat/sessions/:id — delete a session */
export const deleteSession = catchAsync(async (req, res) => {
    const result = await ChatSession.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');

    res.status(204).send();
});

/** DELETE /chat/sessions — clear all sessions for user */
export const clearAllSessions = catchAsync(async (req, res) => {
    await ChatSession.deleteMany({ user: req.user._id });
    res.status(204).send();
});

/**
 * POST /chat/sessions/:id/messages
 * Streams the assistant reply back via Server-Sent Events.
 */
export const sendMessage = catchAsync(async (req, res) => {
    const { content, model: modelOverride } = validate(sendMessageSchema, req.body);

    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');

    const model = resolveModel(modelOverride || session.model);

    // Persist the user message immediately
    session.messages.push({ role: 'user', content });
    // Auto-generate title on the first real message
    const isFirstMessage = session.messages.filter((m) => m.role === 'user').length === 1;

    // Build history for the LLM (plain role/content objects)
    const history = session.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

    // ── SSE setup ────────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
    res.flushHeaders();

    const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Abort the OpenRouter stream if the HTTP client disconnects mid-response
    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    let assistantContent = '';
    let completionResult = null;

    try {
        completionResult = await streamChatCompletion(
            history,
            model,
            (chunk) => {
                assistantContent += chunk;
                sendEvent('chunk', { text: chunk });
            },
            session.systemPrompt,
            abortController.signal
        );
    } catch (err) {
        logger.error({ err }, 'OpenRouter streaming error');
        sendEvent('error', { message: err.message || 'Streaming failed.' });
        res.end();
        return;
    }

    // Persist the assistant message
    session.messages.push({
        role: 'assistant',
        content: assistantContent,
        model,
        finishReason: completionResult.finishReason,
        tokens: {
            prompt: completionResult.usage.prompt_tokens || 0,
            completion: completionResult.usage.completion_tokens || 0,
        },
    });

    // Auto-title: await it so the title is ready before we send the done event
    let generatedTitle = null;
    if (isFirstMessage) {
        try {
            generatedTitle = await generateSessionTitle(content);
            session.title = generatedTitle;
        } catch { /* non-critical — keep default title */ }
    }

    await session.save();

    const savedAssistant = session.messages[session.messages.length - 1];
    sendEvent('done', {
        messageId: savedAssistant._id,
        model,
        finishReason: completionResult.finishReason,
        usage: completionResult.usage,
        sessionTitle: generatedTitle,
    });

    res.end();
});
