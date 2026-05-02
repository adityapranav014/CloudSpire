import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

/** Available models — only verified working OpenRouter endpoints */
export const AVAILABLE_MODELS = [
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', contextWindow: 128000 },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', contextWindow: 128000 },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', contextWindow: 1000000 },
    { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', provider: 'Google', contextWindow: 1000000 },
];

/** Default model used when none is specified */
export const DEFAULT_MODEL = 'openai/gpt-4o-mini';

// ── Fallback system prompt (used only when cloud context injection fails) ─────
const FALLBACK_SYSTEM_PROMPT = `You are CloudSpire AI, an expert FinOps and cloud cost optimization assistant embedded inside the CloudSpire platform.
You help engineering and finance teams understand, analyze, and reduce cloud infrastructure costs across AWS, Azure, and GCP.
Be concise, data-driven, and actionable. Format responses with clear markdown structure. Lead with numbers and specific resource names.`;

// ── Per-model configuration ───────────────────────────────────────────────────
/**
 * Returns tuned temperature and max_tokens for a given model.
 * Reasoning/analytical models run at lower temperature for higher accuracy.
 * Output cap: min(16k, contextWindow/4) — generous without being wasteful.
 */
function getModelConfig(modelId) {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    const contextWindow = model?.contextWindow ?? 128000;

    // Reasoning models benefit from lower temperature for FinOps analysis
    const lowTempModels = new Set([
        'deepseek/deepseek-r1',
        'google/gemini-2.5-pro-preview',
        'anthropic/claude-3.5-sonnet',
    ]);
    const temperature = lowTempModels.has(modelId) ? 0.3 : 0.7;

    // Never request more output tokens than 16k, and never more than 1/4 the context window
    const max_tokens = Math.min(16384, Math.floor(contextWindow / 4));

    return { temperature, max_tokens, contextWindow };
}

// ── Token estimation ─────────────────────────────────────────────────────────
/** Rough estimate: ~4 chars per token (sufficient for budget calculations) */
function estimateTokens(text) {
    return Math.ceil((text || '').length / 4);
}

function estimateMessagesTokens(messages) {
    return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}

// ── Token-aware history trimming ─────────────────────────────────────────────
/**
 * Trim conversation history to fit within the model's context window.
 * System messages are always kept. Oldest turns are dropped first.
 * `reserveForOutput` tokens are reserved for the assistant's reply.
 */
function trimHistoryToTokenBudget(messages, contextWindow, reserveForOutput) {
    const SAFETY_MARGIN = 512;
    const budget = contextWindow - reserveForOutput - SAFETY_MARGIN;

    const system = messages.filter((m) => m.role === 'system');
    const conversational = messages.filter((m) => m.role !== 'system');

    const sysTokens = estimateMessagesTokens(system);
    let remaining = budget - sysTokens;

    if (remaining <= 0) {
        // Extremely large system prompt — hard-truncate to fit at least 2 turns
        const truncatedSystem = system.map((m) => ({
            ...m,
            content: m.content.slice(0, Math.max(budget * 4, 1000)),
        }));
        return [...truncatedSystem, ...conversational.slice(-2)];
    }

    // Walk newest → oldest, keeping messages that fit the budget
    const kept = [];
    for (let i = conversational.length - 1; i >= 0; i--) {
        const cost = estimateTokens(conversational[i].content) + 4;
        if (remaining - cost >= 0) {
            kept.unshift(conversational[i]);
            remaining -= cost;
        } else {
            break;
        }
    }

    return [...system, ...kept];
}

// ── Abort signal combiner ────────────────────────────────────────────────────
/** Combines multiple abort signals into one (safe for Node 18+) */
function combineSignals(signals) {
    const controller = new AbortController();
    for (const signal of signals) {
        if (!signal) continue;
        if (signal.aborted) {
            controller.abort(signal.reason);
            break;
        }
        signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }
    return controller.signal;
}

// ── Retry logic ──────────────────────────────────────────────────────────────
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Fetch with exponential backoff on transient HTTP errors.
 * Respects the Retry-After header on 429 responses.
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, options);
            if (!res.ok && RETRYABLE_STATUS.has(res.status) && attempt < maxRetries) {
                const retryAfterHeader = res.headers.get('Retry-After');
                const delay = retryAfterHeader
                    ? parseInt(retryAfterHeader, 10) * 1000
                    : Math.min(1000 * 2 ** attempt + Math.random() * 400, 30000);

                logger.warn({ status: res.status, attempt, delay }, 'OpenRouter transient error — retrying');
                await new Promise((r) => setTimeout(r, delay));
                continue;
            }
            return res;
        } catch (err) {
            lastError = err;
            if (attempt < maxRetries && err.name !== 'AbortError') {
                const delay = Math.min(1000 * 2 ** attempt + Math.random() * 400, 30000);
                logger.warn({ err: err.message, attempt, delay }, 'OpenRouter fetch error — retrying');
                await new Promise((r) => setTimeout(r, delay));
            } else {
                throw err;
            }
        }
    }
    throw lastError || new Error('All retries exhausted');
}

// ── Headers ───────────────────────────────────────────────────────────────────
function getHeaders() {
    const key = env.openRouterApiKey;
    if (!key) {
        throw new AppError('OpenRouter API key is not configured.', 503, 'OPENROUTER_NOT_CONFIGURED');
    }
    return {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.serverUrl,
        'X-Title': 'CloudSpire',
    };
}

// ── Streaming completion ──────────────────────────────────────────────────────
/**
 * Stream a chat completion from OpenRouter via SSE.
 * Calls `onChunk(text)` for each token. Pass `clientSignal` to abort when the
 * HTTP client disconnects — the function returns partial content gracefully.
 *
 * @param {{ role: string, content: string }[]} messages
 * @param {string} model
 * @param {(chunk: string) => void} onChunk
 * @param {string | null} systemPrompt
 * @param {AbortSignal | null} clientSignal
 * @returns {Promise<{ content: string, model: string, finishReason: string, usage: object }>}
 */
export async function streamChatCompletion(messages, model, onChunk, systemPrompt = null, clientSignal = null) {
    if (!env.openRouterApiKey) {
        throw new AppError('OpenRouter API key is not configured.', 503, 'OPENROUTER_NOT_CONFIGURED');
    }

    const { temperature, max_tokens, contextWindow } = getModelConfig(model);

    const sysMsg = { role: 'system', content: systemPrompt || FALLBACK_SYSTEM_PROMPT };
    const trimmedMessages = trimHistoryToTokenBudget([sysMsg, ...messages], contextWindow, max_tokens);

    const payload = {
        model,
        messages: trimmedMessages,
        stream: true,
        temperature,
        max_tokens,
        stream_options: { include_usage: true }, // request real token counts in the final chunk
    };

    // Combine a 120s hard timeout with the optional client disconnect signal
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 120_000);
    const signal = combineSignals([timeoutController.signal, clientSignal]);

    let response;
    try {
        // Do not retry streaming requests — mid-retry would duplicate content
        response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
            signal,
        });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new AppError(
            `OpenRouter error ${response.status}: ${body || response.statusText}`,
            response.status >= 500 ? 502 : 400,
            'OPENROUTER_ERROR'
        );
    }

    let fullContent = '';
    let finishReason = null;
    let usageData = null;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === ':' || !trimmed.startsWith('data: ')) continue;

                const data = trimmed.slice(6);
                if (data === '[DONE]') continue;

                let parsed;
                try { parsed = JSON.parse(data); } catch { continue; }

                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                    fullContent += delta;
                    onChunk(delta);
                }

                const reason = parsed.choices?.[0]?.finish_reason;
                if (reason) finishReason = reason;

                // usage arrives in the final chunk when stream_options.include_usage is set
                if (parsed.usage) usageData = parsed.usage;
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            logger.info({ contentLength: fullContent.length }, 'Stream aborted — returning partial content');
            return {
                content: fullContent,
                model,
                finishReason: 'aborted',
                usage: usageData || { prompt_tokens: 0, completion_tokens: 0 },
            };
        }
        throw err;
    } finally {
        reader.cancel().catch(() => { });
    }

    return {
        content: fullContent,
        model,
        finishReason: finishReason || 'stop',
        usage: usageData || { prompt_tokens: 0, completion_tokens: 0 },
    };
}

// ── Title generation ──────────────────────────────────────────────────────────
/**
 * Generate a short session title from the first user message.
 * Uses a cheap model with retry logic. Always returns a non-empty string.
 */
export async function generateSessionTitle(userMessage) {
    if (!env.openRouterApiKey) return 'New Chat';

    const payload = {
        model: 'openai/gpt-4o-mini',
        messages: [
            {
                role: 'user',
                content: `Generate a short, descriptive title (max 6 words, no quotes) for a chat that starts with this message:\n\n"${userMessage.slice(0, 300)}"`,
            },
        ],
        max_tokens: 20,
        temperature: 0.5,
    };

    try {
        const res = await fetchWithRetry(
            `${OPENROUTER_BASE}/chat/completions`,
            {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(15_000),
            },
            2 // up to 2 retries
        );
        if (!res.ok) return 'New Chat';
        const json = await res.json();
        return json.choices?.[0]?.message?.content?.trim() || 'New Chat';
    } catch {
        return 'New Chat';
    }
}
