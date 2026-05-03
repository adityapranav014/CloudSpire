import { z } from 'zod';
import ChatSession from '../models/ChatSession.js';
import { streamChatCompletion, generateSessionTitle, AVAILABLE_MODELS, DEFAULT_MODEL } from '../services/openRouterService.js';
import { buildCloudContextPrompt } from '../services/cloudContextService.js';
import { catchAsync } from '../middleware/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

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
    if (!requested) return DEFAULT_MODEL;
    if (!VALID_MODEL_IDS.includes(requested)) {
        throw new AppError(`Unsupported model: ${requested}`, 400, 'INVALID_MODEL');
    }
    return requested;
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** GET /chat/models — list available models */
export const listModels = catchAsync(async (_req, res) => {
    console.log('[CHAT] GET /models');
    console.log('[CHAT] listModels success — count:', AVAILABLE_MODELS.length);
    res.status(200).json({ success: true, data: AVAILABLE_MODELS });
});

/** GET /chat/context — build and return cloud context system prompt */
export const getCloudContext = catchAsync(async (req, res) => {
    console.log('[CHAT] GET /context — User:', req.user);
    const systemPrompt = await buildCloudContextPrompt(req.user);
    console.log('[CHAT] getCloudContext success — prompt length:', systemPrompt?.length || 0);
    res.status(200).json({ success: true, data: { systemPrompt } });
});

/** GET /chat/sessions — list sessions for the current user */
export const listSessions = catchAsync(async (req, res) => {
    console.log('[CHAT] GET /sessions — User:', req.user);
    const sessions = await ChatSession.find({ user: req.user.id })
        .select('-messages')
        .sort({ isPinned: -1, lastMessageAt: -1 })
        .limit(100)
        .lean();

    console.log('[CHAT] listSessions success — count:', sessions.length);
    res.status(200).json({ success: true, data: sessions });
});

/** POST /chat/sessions — create a new session */
export const createSession = catchAsync(async (req, res) => {
    console.log('[CHAT] POST /sessions — User:', req.user, 'Body:', req.body);
    const body = validate(createSessionSchema, req.body);
    const model = resolveModel(body.model);

    const session = await ChatSession.create({
        user: req.user.id,
        title: body.title || 'New Chat',
        model,
        systemPrompt: body.systemPrompt ?? null,
    });

    console.log('[CHAT] createSession success — sessionId:', session._id);
    res.status(201).json({ success: true, data: session });
});

/** GET /chat/sessions/:id — get a single session with messages */
export const getSession = catchAsync(async (req, res) => {
    console.log('[CHAT] GET /sessions/:id — Params:', req.params, 'User:', req.user);
    const session = await ChatSession.findOne({
        _id: req.params.id,
        user: req.user.id,
    }).lean();

    if (!session) {
        console.log('[CHAT] getSession error: Session not found — id:', req.params.id);
        throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');
    }

    console.log('[CHAT] getSession success — sessionId:', session._id, 'messages:', session.messages?.length);
    res.status(200).json({ success: true, data: session });
});

/** PATCH /chat/sessions/:id/title — rename a session */
export const updateSessionTitle = catchAsync(async (req, res) => {
    console.log('[CHAT] PATCH /sessions/:id/title — Params:', req.params, 'Body:', req.body, 'User:', req.user);
    const { title } = validate(updateTitleSchema, req.body);

    const session = await ChatSession.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { title },
        { new: true, select: '-messages' }
    );

    if (!session) {
        console.log('[CHAT] updateSessionTitle error: Session not found — id:', req.params.id);
        throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');
    }

    console.log('[CHAT] updateSessionTitle success — sessionId:', session._id, 'newTitle:', title);
    res.status(200).json({ success: true, data: session });
});

/** PATCH /chat/sessions/:id/pin — toggle pin */
export const togglePinSession = catchAsync(async (req, res) => {
    console.log('[CHAT] PATCH /sessions/:id/pin — Params:', req.params, 'User:', req.user);
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
        console.log('[CHAT] togglePinSession error: Session not found — id:', req.params.id);
        throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');
    }

    session.isPinned = !session.isPinned;
    await session.save();

    console.log('[CHAT] togglePinSession success — sessionId:', session._id, 'isPinned:', session.isPinned);
    res.status(200).json({ success: true, data: { isPinned: session.isPinned } });
});

/** DELETE /chat/sessions/:id — delete a session */
export const deleteSession = catchAsync(async (req, res) => {
    console.log('[CHAT] DELETE /sessions/:id — Params:', req.params, 'User:', req.user);
    const result = await ChatSession.deleteOne({ _id: req.params.id, user: req.user.id });
    if (result.deletedCount === 0) {
        console.log('[CHAT] deleteSession error: Session not found — id:', req.params.id);
        throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');
    }

    console.log('[CHAT] deleteSession success — id:', req.params.id);
    res.status(204).send();
});

/** DELETE /chat/sessions — clear all sessions for user */
export const clearAllSessions = catchAsync(async (req, res) => {
    console.log('[CHAT] DELETE /sessions (all) — User:', req.user);
    await ChatSession.deleteMany({ user: req.user.id });
    console.log('[CHAT] clearAllSessions success');
    res.status(204).send();
});

/**
 * POST /chat/sessions/:id/messages
 * Streams the assistant reply back via Server-Sent Events.
 */
export const sendMessage = catchAsync(async (req, res) => {
    console.log('[CHAT] POST /sessions/:id/messages — Params:', req.params, 'Body:', { content: req.body.content?.substring(0, 100), model: req.body.model }, 'User:', req.user);

    const { content, model: modelOverride } = validate(sendMessageSchema, req.body);

    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) {
        console.log('[CHAT] sendMessage error: Session not found — id:', req.params.id);
        throw new AppError('Chat session not found.', 404, 'SESSION_NOT_FOUND');
    }

    const model = resolveModel(modelOverride || session.model);
    console.log('[CHAT] sendMessage — using model:', model, 'sessionId:', session._id);

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
        console.error('[CHAT] sendMessage streaming error:', err.message);
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
    console.log('[CHAT] sendMessage success — sessionId:', session._id, 'assistantContentLength:', assistantContent.length, 'model:', model);
    sendEvent('done', {
        messageId: savedAssistant._id,
        model,
        finishReason: completionResult.finishReason,
        usage: completionResult.usage,
        sessionTitle: generatedTitle,
    });

    res.end();
});

// ── Simple chat endpoint ─────────────────────────────────────────────────────

const CLOUD_MOCK_RESPONSES = [
    'Based on your current usage patterns, I recommend reviewing your EC2 instance sizing — rightsizing alone could save 15-25% on compute costs.',
    'Your S3 storage costs have been trending upward. Consider implementing lifecycle policies to move infrequently accessed data to S3 Glacier.',
    'I notice you have several idle resources across your cloud accounts. Shutting down unused dev/staging environments during off-hours could reduce costs by $200-400/month.',
    'For your current workload, Reserved Instances would offer significant savings over On-Demand pricing — typically 30-60% depending on the commitment term.',
    'Your cloud spend is well within budget this month. The top cost driver is compute services. I recommend setting up anomaly alerts to catch unexpected spikes early.',
    'Cost optimization tip: Enable auto-scaling for your application tier. This ensures you only pay for the capacity you actually need during off-peak hours.',
];

function getMockReply(userMessage) {
    const msg = userMessage.toLowerCase();
    if (msg.includes('cost') || msg.includes('spend') || msg.includes('bill') || msg.includes('pricing')) {
        return 'Your current month-to-date cloud spend is tracking within budget. The primary cost drivers are compute (EC2/VMs) and storage (S3/Blob). Consider reviewing reserved instance coverage to reduce on-demand costs by up to 40%.';
    }
    if (msg.includes('optimize') || msg.includes('save') || msg.includes('reduce') || msg.includes('saving')) {
        return 'Here are your top optimization opportunities: 1) Rightsize 3 over-provisioned EC2 instances (est. $180/mo savings), 2) Delete 5 orphaned EBS volumes ($45/mo), 3) Switch to Reserved Instances for stable workloads ($320/mo). Total potential savings: ~$545/month.';
    }
    if (msg.includes('alert') || msg.includes('anomaly') || msg.includes('spike')) {
        return 'You currently have 2 open anomaly alerts: a 35% spike in Lambda invocations (detected today) and an unusual increase in data transfer costs from us-east-1. I recommend investigating the Lambda spike first — it may indicate a retry loop in your application.';
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        return 'Hello! I\'m CloudSpire AI, your cloud cost optimization assistant. I can help you analyze spending, find savings opportunities, and understand anomalies across AWS, Azure, and GCP. What would you like to explore?';
    }
    if (msg.includes('help')) {
        return 'I can help you with: 📊 Cost analysis and breakdowns, 💰 Savings recommendations, 🔔 Anomaly explanations, ☁️ Multi-cloud comparisons (AWS, Azure, GCP), 📈 Spending trends and forecasts. Just ask me anything about your cloud infrastructure costs!';
    }
    // Random response for general queries
    return CLOUD_MOCK_RESPONSES[Math.floor(Math.random() * CLOUD_MOCK_RESPONSES.length)];
}

/**
 * POST /api/chat  (simple, non-streaming)
 *
 * Accepts: { message: "user text" }
 * Returns: { reply: "AI response here" }
 *
 * Tries OpenRouter first; falls back to intelligent mock responses
 * if the API key is missing or the call fails.
 */
export const quickChat = catchAsync(async (req, res, next) => {
    console.log('[CHAT] POST /api/chat — Body:', req.body, 'User:', req.user);

    const { message } = req.body;

    // ── Input validation ─────────────────────────────────────────────────────
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        console.log('[CHAT] quickChat error: Empty or missing message');
        return next(new AppError('Message is required and cannot be empty.', 400, 'MISSING_MESSAGE'));
    }

    if (message.length > 32000) {
        console.log('[CHAT] quickChat error: Message too long —', message.length, 'chars');
        return next(new AppError('Message is too long. Maximum 32,000 characters.', 400, 'MESSAGE_TOO_LONG'));
    }

    const trimmedMessage = message.trim();

    // ── Try OpenRouter (real AI) ─────────────────────────────────────────────
    if (env.openRouterApiKey && env.openRouterApiKey !== 'sk-or-xxxx') {
        try {
            console.log('[CHAT] quickChat — calling OpenRouter with model:', DEFAULT_MODEL);

            const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
            const payload = {
                model: DEFAULT_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are CloudSpire AI, an expert FinOps and cloud cost optimization assistant. Be concise, data-driven, and actionable. Keep responses under 3 paragraphs.',
                    },
                    { role: 'user', content: trimmedMessage },
                ],
                max_tokens: 500,
                temperature: 0.7,
            };

            const apiRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${env.openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': env.serverUrl,
                    'X-Title': 'CloudSpire',
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(15_000),
            });

            if (apiRes.ok) {
                const json = await apiRes.json();
                const reply = json.choices?.[0]?.message?.content?.trim();

                if (reply && reply.length > 0) {
                    console.log('[CHAT] quickChat success (OpenRouter) — reply length:', reply.length);
                    return res.status(200).json({ reply });
                }
            }

            console.log('[CHAT] quickChat — OpenRouter returned empty/error, falling back to mock');
        } catch (err) {
            console.error('[CHAT] quickChat — OpenRouter call failed:', err.message, '— falling back to mock');
        }
    }

    // ── Fallback: intelligent mock responses ─────────────────────────────────
    const reply = getMockReply(trimmedMessage);
    console.log('[CHAT] quickChat success (mock) — reply length:', reply.length);

    res.status(200).json({ reply });
});
