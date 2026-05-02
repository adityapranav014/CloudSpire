import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MessageSquare, Plus, Trash2, Pin, PinOff, Send, Square,
    ChevronDown, Bot, Copy, Check, Loader2,
    Sparkles, MoreHorizontal, Edit2, X, AlertCircle,
    TrendingDown, BarChart2, Zap, HelpCircle, Menu,
} from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:4000/api/v1'
const STORAGE_KEY = 'cloudspire_token'

const api = axios.create({ baseURL: API_BASE })
api.interceptors.request.use((cfg) => {
    const token = localStorage.getItem(STORAGE_KEY)
    if (token) cfg.headers.Authorization = `Bearer ${token}`
    return cfg
})

// ── Markdown-lite renderer ──────────────────────────────────────────────────
function renderMarkdown(text) {
    const parts = []
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
        }
        parts.push({ type: 'code', lang: match[1] || 'text', content: match[2].trim() })
        lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(lastIndex) })
    }
    return parts
}

function renderInline(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline hover:text-blue-600">$1</a>')
}

function renderTextBlock(content) {
    const lines = content.split('\n')
    const elements = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]
        if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-sm font-semibold mt-5 mb-1.5" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: renderInline(line.slice(4)) }} />)
        } else if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-[15px] font-semibold mt-6 mb-2" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: renderInline(line.slice(3)) }} />)
        } else if (line.startsWith('# ')) {
            elements.push(<h1 key={i} className="text-base font-bold mt-6 mb-2" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />)
        } else if (/^[-*]\s/.test(line)) {
            const items = []
            while (i < lines.length && /^[-*]\s/.test(lines[i])) {
                items.push(lines[i].slice(2))
                i++
            }
            elements.push(
                <ul key={`ul-${i}`} className="my-3 space-y-1.5 text-sm pl-1" style={{ color: 'var(--text-primary)' }}>
                    {items.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--text-muted)' }} />
                            <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
                        </li>
                    ))}
                </ul>
            )
            continue
        } else if (/^\d+\.\s/.test(line)) {
            const items = []
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\d+\.\s/, ''))
                i++
            }
            elements.push(
                <ol key={`ol-${i}`} className="my-3 space-y-1.5 text-sm pl-1" style={{ color: 'var(--text-primary)' }}>
                    {items.map((item, idx) => (
                        <li key={idx} className="flex gap-2">
                            <span className="flex-shrink-0 text-[11px] font-semibold tabular-nums mt-0.5" style={{ color: 'var(--text-muted)', minWidth: '16px' }}>{idx + 1}.</span>
                            <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
                        </li>
                    ))}
                </ol>
            )
            continue
        } else if (line.startsWith('> ')) {
            elements.push(
                <blockquote key={i} className="border-l-2 pl-4 my-3 text-sm italic" style={{ borderColor: 'var(--accent-primary)', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />
            )
        } else if (line.startsWith('|') && line.trim().endsWith('|')) {
            // ── Markdown table ──────────────────────────────────────────────
            const tableLines = []
            while (i < lines.length && lines[i].startsWith('|') && lines[i].trim().endsWith('|')) {
                tableLines.push(lines[i])
                i++
            }
            // Parse header, skip separator, collect body rows
            const parseRow = (row) =>
                row.split('|').slice(1, -1).map((cell) => cell.trim())
            const headerRow = parseRow(tableLines[0])
            const isSep = (row) => /^[\s|:\-]+$/.test(row)
            const bodyRows = tableLines.slice(1).filter((r) => !isSep(r)).map(parseRow)
            elements.push(
                <div key={`tbl-${i}`} className="my-4 overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-subtle)' }}>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr style={{ background: 'var(--bg-elevated)' }}>
                                {headerRow.map((h, ci) => (
                                    <th key={ci} className="px-4 py-2.5 text-left text-xs font-semibold tracking-wide whitespace-nowrap" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }} dangerouslySetInnerHTML={{ __html: renderInline(h) }} />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {bodyRows.map((row, ri) => (
                                <tr key={ri} className="transition-colors" style={{ background: ri % 2 === 1 ? 'var(--bg-surface)' : 'transparent' }}>
                                    {row.map((cell, ci) => (
                                        <td key={ci} className="px-4 py-2.5 text-sm" style={{ color: 'var(--text-primary)', borderBottom: ri < bodyRows.length - 1 ? '1px solid var(--border-subtle)' : 'none' }} dangerouslySetInnerHTML={{ __html: renderInline(cell) }} />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
            continue
        } else if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
            elements.push(<hr key={i} className="my-4" style={{ borderColor: 'var(--border-subtle)' }} />)
        } else if (line.trim() === '') {
            elements.push(<div key={i} className="h-3" />)
        } else {
            elements.push(
                <p key={i} className="text-sm leading-[1.75]" style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
            )
        }
        i++
    }
    return elements
}

// ── CodeBlock ────────────────────────────────────────────────────────────────
function CodeBlock({ lang, content }) {
    const [copied, setCopied] = useState(false)
    const copy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <div className="my-3 rounded-xl overflow-hidden text-xs" style={{ border: '1px solid #30363d', background: '#0d1117' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
                <span className="font-mono" style={{ color: '#8b949e' }}>{lang || 'code'}</span>
                <button onClick={copy} className="flex items-center gap-1.5 text-xs transition-all" style={{ color: copied ? '#3FB950' : '#8b949e' }}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'copied' : 'copy'}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed" style={{ color: '#e6edf3', margin: 0 }}>
                <code>{content}</code>
            </pre>
        </div>
    )
}

// ── MessageBubble ────────────────────────────────────────────────────────────
function MessageBubble({ message, isStreaming = false }) {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === 'user'

    const copy = () => {
        navigator.clipboard.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const parts = renderMarkdown(message.content)

    if (isUser) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex justify-end"
            >
                <div
                    className="max-w-[70%] px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                        background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                        color: '#fff',
                        boxShadow: '0 2px 12px rgba(59,130,246,0.25)',
                    }}
                >
                    {message.content}
                </div>
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="group flex gap-3 items-start"
        >
            {/* Bot avatar */}
            <div
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 relative"
                style={{
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                }}
            >
                <Bot size={13} style={{ color: '#fff' }} />
                {isStreaming && (
                    <span
                        className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full"
                        style={{ background: '#10B981', border: '1.5px solid var(--bg-base)' }}
                    />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="text-sm leading-[1.75]" style={{ color: 'var(--text-primary)' }}>
                    {parts.map((part, idx) =>
                        part.type === 'code'
                            ? <CodeBlock key={idx} lang={part.lang} content={part.content} />
                            : <div key={idx}>{renderTextBlock(part.content)}</div>
                    )}
                    {isStreaming && (
                        <span
                            className="inline-block w-1.5 h-[1em] ml-0.5 rounded-sm animate-pulse align-middle"
                            style={{ background: 'var(--accent-primary)' }}
                        />
                    )}
                </div>

                {/* Actions row */}
                {!isStreaming && (
                    <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                            onClick={copy}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-all"
                            style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-subtle)',
                                color: copied ? '#10B981' : 'var(--text-muted)',
                            }}
                        >
                            {copied ? <Check size={10} /> : <Copy size={10} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        {message.model && (
                            <span
                                className="text-[11px] px-2 py-1 rounded-md"
                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
                            >
                                {message.model.split('/').pop()}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ── ModelSelector ─────────────────────────────────────────────────────────────
// Bug fixes applied:
//   1. Dropdown opens downward (top-full mt-2) so it is not clipped by overflow-hidden on parent
//   2. Click-outside handler added — was completely missing before
const PROVIDER_COLORS = {
    OpenAI: '#10A37F',
    Anthropic: '#D4845A',
    Google: '#4285F4',
    Meta: '#0866FF',
    DeepSeek: '#7C3AED',
    Mistral: '#FF6B35',
    Qwen: '#E74C3C',
}

function ModelSelector({ models, selected, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const current = models.find((m) => m.id === selected)

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all duration-200"
                style={{
                    borderColor: open ? 'var(--accent-primary)' : 'var(--border-default)',
                    background: open ? 'var(--accent-primary-subtle)' : 'var(--bg-elevated)',
                    color: open ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    boxShadow: open ? '0 0 0 3px rgba(59,130,246,0.12)' : '0 1px 2px rgba(0,0,0,0.05)',
                }}
            >
                <Sparkles size={11} style={{ color: open ? 'var(--accent-primary)' : 'var(--accent-violet)' }} />
                <span className="font-medium max-w-[150px] truncate">
                    {current?.name ?? selected?.split('/').pop() ?? 'Select Model'}
                </span>
                <ChevronDown
                    size={10}
                    style={{
                        transition: 'transform 0.2s ease',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute top-full mt-2 right-0 w-72 rounded-2xl border overflow-hidden"
                        style={{
                            background: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            boxShadow: '0 20px 60px -10px rgba(0,0,0,0.14), 0 8px 24px -6px rgba(0,0,0,0.08)',
                            zIndex: 9999,
                        }}
                    >
                        <div
                            className="px-4 py-3 border-b flex items-center justify-between"
                            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles size={12} style={{ color: 'var(--accent-violet)' }} />
                                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>AI Model</p>
                            </div>
                            <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-violet)' }}
                            >
                                {models.length} available
                            </span>
                        </div>

                        <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
                            {['OpenAI', 'Anthropic', 'Google', 'Meta', 'DeepSeek', 'Mistral', 'Qwen'].map((provider) => {
                                const providerModels = models.filter((m) => m.provider === provider)
                                if (!providerModels.length) return null
                                const color = PROVIDER_COLORS[provider] || '#6B7280'
                                return (
                                    <div key={provider}>
                                        <div
                                            className="flex items-center gap-2 px-4 py-1.5"
                                            style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}
                                        >
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                {provider}
                                            </span>
                                        </div>
                                        {providerModels.map((m) => {
                                            const isSelected = m.id === selected
                                            return (
                                                <button
                                                    key={m.id}
                                                    onClick={() => { onChange(m.id); setOpen(false) }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                                                    style={{
                                                        background: isSelected ? `${color}14` : 'transparent',
                                                        color: isSelected ? color : 'var(--text-secondary)',
                                                        transition: 'background 0.12s',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected) e.currentTarget.style.background = 'var(--bg-elevated)'
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = isSelected ? `${color}14` : 'transparent'
                                                    }}
                                                >
                                                    <span className="text-sm flex-1">{m.name}</span>
                                                    {isSelected && (
                                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ── SessionItem ──────────────────────────────────────────────────────────────
function SessionItem({ session, isActive, onSelect, onDelete, onPin, onRename }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [editing, setEditing] = useState(false)
    const [title, setTitle] = useState(session.title)
    const menuRef = useRef(null)

    useEffect(() => {
        const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleRename = () => {
        if (title.trim() && title !== session.title) onRename(session._id, title.trim())
        setEditing(false)
        setMenuOpen(false)
    }

    return (
        <div
            className="group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150"
            onClick={() => !editing && onSelect(session._id)}
            style={{ background: isActive ? 'var(--accent-primary-subtle)' : 'transparent' }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)' }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
        >
            {session.isPinned && <Pin size={9} className="flex-shrink-0" style={{ color: 'var(--accent-amber)' }} />}

            {editing ? (
                <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename()
                        if (e.key === 'Escape') { setTitle(session.title); setEditing(false) }
                    }}
                    className="flex-1 min-w-0 bg-transparent text-[13px] outline-none border-b"
                    style={{ borderColor: 'var(--accent-primary)', color: 'var(--text-primary)' }}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span
                    className="flex-1 min-w-0 truncate text-[13px]"
                    style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: isActive ? 500 : 400 }}
                >
                    {session.title}
                </span>
            )}

            {/* Message count — hidden when menu is hovered */}
            {session.messageCount > 0 && !editing && (
                <span
                    className="text-[11px] flex-shrink-0 tabular-nums group-hover:opacity-0 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                >
                    {session.messageCount}
                </span>
            )}

            {/* Context menu trigger — appears on hover in place of count */}
            <div
                ref={menuRef}
                className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                    style={{ color: menuOpen ? 'var(--text-primary)' : 'var(--text-muted)', background: menuOpen ? 'var(--bg-elevated)' : 'transparent' }}
                >
                    <MoreHorizontal size={13} />
                </button>
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-full mt-1 w-36 rounded-xl border overflow-hidden py-1"
                            style={{
                                background: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                zIndex: 50,
                            }}
                        >
                            <button
                                onClick={() => { setEditing(true); setMenuOpen(false) }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                            >
                                <Edit2 size={11} /> Rename
                            </button>
                            <button
                                onClick={() => { onPin(session._id); setMenuOpen(false) }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                            >
                                {session.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                                {session.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <div className="my-1 border-t" style={{ borderColor: 'var(--border-subtle)' }} />
                            <button
                                onClick={() => { onDelete(session._id); setMenuOpen(false) }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                                style={{ color: 'var(--accent-rose)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                            >
                                <Trash2 size={11} /> Delete
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

// ── Suggestion prompt cards ──────────────────────────────────────────────────
const SUGGESTIONS = [
    { icon: TrendingDown, label: 'Top cost drivers', prompt: 'What are my biggest cost drivers this month?', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    { icon: BarChart2, label: 'Spending analysis', prompt: 'Analyze my EC2 spending and suggest optimizations.', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
    { icon: Zap, label: 'Quick wins', prompt: 'What are the quickest ways to reduce my cloud costs right now?', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
    { icon: HelpCircle, label: 'FinOps basics', prompt: 'Explain FinOps and how to get started.', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
]

// ── Main Chat Page ───────────────────────────────────────────────────────────
export default function Chat() {
    const [sessions, setSessions] = useState([])
    const [activeSessionId, setActiveSessionId] = useState(null)
    const [messages, setMessages] = useState([])
    const [models, setModels] = useState([])
    const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini')
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [streamingContent, setStreamingContent] = useState('')
    const [error, setError] = useState(null)
    const [loadingSession, setLoadingSession] = useState(false)
    const [panelOpen, setPanelOpen] = useState(false)

    // Cloud context system prompt — fetched once, silently injected into every new session
    const cloudContextRef = useRef(null)

    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const abortRef = useRef(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => { scrollToBottom() }, [messages, streamingContent, scrollToBottom])

    useEffect(() => {
        api.get('/chat/models').then((r) => setModels(r.data.data)).catch(() => { })
        fetchSessions()
        // Pre-fetch cloud context in the background — no loading state shown to user
        api.get('/chat/context')
            .then((r) => { cloudContextRef.current = r.data.data.systemPrompt })
            .catch(() => { /* non-critical — AI works without it */ })
        // Focus input on initial page load (no session selected = new chat state)
        setTimeout(() => inputRef.current?.focus(), 100)
    }, [])

    const fetchSessions = async () => {
        try {
            const r = await api.get('/chat/sessions')
            setSessions(r.data.data)
        } catch { /* silent */ }
    }

    const loadSession = async (id) => {
        setLoadingSession(true)
        setError(null)
        try {
            const r = await api.get(`/chat/sessions/${id}`)
            const session = r.data.data
            setActiveSessionId(id)
            setMessages(session.messages.filter((m) => m.role !== 'system'))
            setSelectedModel(session.model || 'openai/gpt-4o-mini')
            setTimeout(() => inputRef.current?.focus(), 50)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load session.')
        } finally {
            setLoadingSession(false)
        }
    }

    const createSession = async () => {
        try {
            const r = await api.post('/chat/sessions', {
                model: selectedModel,
                systemPrompt: cloudContextRef.current || null,
            })
            const session = r.data.data
            setSessions((prev) => [session, ...prev])
            setActiveSessionId(session._id)
            setMessages([])
            setError(null)
            inputRef.current?.focus()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create session.')
        }
    }

    const deleteSession = async (id) => {
        try {
            await api.delete(`/chat/sessions/${id}`)
            setSessions((prev) => prev.filter((s) => s._id !== id))
            if (activeSessionId === id) { setActiveSessionId(null); setMessages([]) }
        } catch { /* silent */ }
    }

    const pinSession = async (id) => {
        try {
            const r = await api.patch(`/chat/sessions/${id}/pin`)
            setSessions((prev) => prev.map((s) => s._id === id ? { ...s, isPinned: r.data.data.isPinned } : s))
        } catch { /* silent */ }
    }

    const renameSession = async (id, title) => {
        try {
            await api.patch(`/chat/sessions/${id}/title`, { title })
            setSessions((prev) => prev.map((s) => s._id === id ? { ...s, title } : s))
        } catch { /* silent */ }
    }

    const sendMessage = async () => {
        if (!input.trim() || isStreaming) return
        setError(null)

        let sessionId = activeSessionId
        if (!sessionId) {
            try {
                const r = await api.post('/chat/sessions', {
                    model: selectedModel,
                    systemPrompt: cloudContextRef.current || null,
                })
                const session = r.data.data
                setSessions((prev) => [session, ...prev])
                setActiveSessionId(session._id)
                sessionId = session._id
                setMessages([])
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to create session.')
                return
            }
        }

        const userMessage = { role: 'user', content: input.trim(), _id: Date.now().toString() }
        setMessages((prev) => [...prev, userMessage])
        setInput('')
        setIsStreaming(true)
        setStreamingContent('')

        const controller = new AbortController()
        abortRef.current = controller

        try {
            const response = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem(STORAGE_KEY)}`,
                },
                body: JSON.stringify({ content: userMessage.content, model: selectedModel }),
                signal: controller.signal,
            })

            if (!response.ok) {
                const body = await response.json().catch(() => ({}))
                throw new Error(body.error || `Request failed: ${response.status}`)
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let accumulated = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    const trimmed = line.trim()
                    if (!trimmed.startsWith('data:')) continue
                    const raw = trimmed.slice(5).trim()
                    let parsed
                    try { parsed = JSON.parse(raw) } catch { continue }

                    if (parsed.text !== undefined) {
                        accumulated += parsed.text
                        setStreamingContent(accumulated)
                    } else if (parsed.message) {
                        throw new Error(parsed.message)
                    } else if (parsed.messageId) {
                        const assistantMessage = {
                            _id: parsed.messageId,
                            role: 'assistant',
                            content: accumulated,
                            model: parsed.model || selectedModel,
                        }
                        setMessages((prev) => [...prev, assistantMessage])
                        setStreamingContent('')
                        // If the backend generated a new title, apply it immediately
                        if (parsed.sessionTitle) {
                            setSessions((prev) => prev.map((s) =>
                                s._id === sessionId ? { ...s, title: parsed.sessionTitle } : s
                            ))
                        }
                        fetchSessions()
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                if (streamingContent) {
                    setMessages((prev) => [...prev, {
                        _id: Date.now().toString(),
                        role: 'assistant',
                        content: streamingContent + ' _(stopped)_',
                        model: selectedModel,
                    }])
                }
                setStreamingContent('')
            } else {
                setError(err.message || 'Something went wrong.')
                setMessages((prev) => prev.filter((m) => m._id !== userMessage._id))
            }
        } finally {
            setIsStreaming(false)
            abortRef.current = null
        }
    }

    const stopStreaming = () => { abortRef.current?.abort() }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const pinnedSessions = sessions.filter((s) => s.isPinned)
    const unpinnedSessions = sessions.filter((s) => !s.isPinned)
    const activeSession = sessions.find((s) => s._id === activeSessionId)

    // ── Shared sidebar content (used by both desktop panel and mobile drawer) ──
    const SidebarContent = ({ onSelect }) => (
        <>
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 h-[52px] border-b flex-shrink-0"
                style={{ borderColor: 'var(--border-subtle)' }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Chats</span>
                    {sessions.length > 0 && (
                        <span
                            className="text-[11px] tabular-nums"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {sessions.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => { createSession(); onSelect?.() }}
                    title="New chat"
                    className="flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-lg transition-all"
                    style={{ color: 'var(--text-muted)', background: 'transparent' }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-elevated)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-muted)'
                    }}
                >
                    <Plus size={13} />
                    New
                </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto py-3 px-2">
                {sessions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                            style={{ background: 'var(--bg-elevated)' }}
                        >
                            <MessageSquare size={18} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>No conversations</p>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            Start a new chat to get FinOps insights
                        </p>
                    </div>
                )}

                {pinnedSessions.length > 0 && (
                    <div className="mb-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider px-3 pt-1 pb-1.5" style={{ color: 'var(--text-muted)' }}>
                            Pinned
                        </p>
                        <div className="space-y-0.5">
                            {pinnedSessions.map((s) => (
                                <SessionItem
                                    key={s._id} session={s} isActive={s._id === activeSessionId}
                                    onSelect={(id) => { loadSession(id); onSelect?.() }}
                                    onDelete={deleteSession} onPin={pinSession} onRename={renameSession}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {unpinnedSessions.length > 0 && (
                    <div>
                        {pinnedSessions.length > 0 && (
                            <>
                                <div className="mx-3 my-2 border-t" style={{ borderColor: 'var(--border-subtle)' }} />
                                <p className="text-[10px] font-semibold uppercase tracking-wider px-3 pb-1.5" style={{ color: 'var(--text-muted)' }}>
                                    Recent
                                </p>
                            </>
                        )}
                        <div className="space-y-0.5">
                            {unpinnedSessions.map((s) => (
                                <SessionItem
                                    key={s._id} session={s} isActive={s._id === activeSessionId}
                                    onSelect={(id) => { loadSession(id); onSelect?.() }}
                                    onDelete={deleteSession} onPin={pinSession} onRename={renameSession}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {sessions.length > 0 && (
                <div className="p-3 border-t flex-shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                        onClick={() => {
                            if (window.confirm('Delete all chat sessions?')) {
                                api.delete('/chat/sessions').then(() => {
                                    setSessions([])
                                    setActiveSessionId(null)
                                    setMessages([])
                                    onSelect?.()
                                }).catch(() => { })
                            }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors"
                        style={{ color: 'var(--accent-rose)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.06)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                        <Trash2 size={11} /> Clear all chats
                    </button>
                </div>
            )}
        </>
    )

    return (
        <div className="flex flex-1 overflow-hidden" style={{ background: 'var(--bg-base)' }}>

            {/* ── Desktop persistent sidebar ── */}
            <aside
                className="hidden lg:flex flex-col border-r flex-shrink-0"
                style={{
                    width: '260px',
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                }}
            >
                <SidebarContent />
            </aside>

            {/* ── Main chat column ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Topbar */}
                <div
                    className="flex items-center gap-3 px-5 border-b flex-shrink-0"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', height: '52px' }}
                >
                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setPanelOpen(true)}
                        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    >
                        <Menu size={16} />
                    </button>

                    {/* Session info */}
                    <div className="flex-1 min-w-0">
                        {activeSession ? (
                            <div>
                                <p className="text-sm font-semibold truncate leading-none" style={{ color: 'var(--text-primary)' }}>
                                    {activeSession.title}
                                </p>
                                <p className="text-[10px] mt-0.5 leading-none tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                    {activeSession.messageCount ?? 0} messages
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 1px 4px rgba(99,102,241,0.3)' }}
                                >
                                    <Bot size={10} style={{ color: '#fff' }} />
                                </div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>CloudSpire AI</p>
                            </div>
                        )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={createSession}
                            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--accent-primary)'
                                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                                e.currentTarget.style.color = '#fff'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--bg-elevated)'
                                e.currentTarget.style.borderColor = 'var(--border-default)'
                                e.currentTarget.style.color = 'var(--text-secondary)'
                            }}
                        >
                            <Plus size={12} /> New chat
                        </button>
                        <ModelSelector models={models} selected={selectedModel} onChange={setSelectedModel} />
                    </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
                    <div className="max-w-2xl mx-auto px-6 py-10">

                        {loadingSession && (
                            <div className="flex justify-center py-20">
                                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                            </div>
                        )}

                        {/* Empty state */}
                        {!loadingSession && messages.length === 0 && !isStreaming && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="flex flex-col items-center text-center"
                                style={{ paddingTop: '72px', paddingBottom: '40px' }}
                            >
                                <div className="relative mb-8">
                                    <div
                                        className="w-24 h-24 rounded-3xl flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 55%, #A78BFA 100%)',
                                            boxShadow: '0 12px 48px rgba(99,102,241,0.4), 0 0 0 1px rgba(99,102,241,0.1)',
                                        }}
                                    >
                                        <Bot size={36} style={{ color: '#fff' }} />
                                    </div>
                                    <div
                                        className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: '2.5px solid var(--bg-base)' }}
                                    >
                                        <Sparkles size={12} style={{ color: '#fff' }} />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                    CloudSpire AI
                                </h2>
                                <p className="text-sm mb-10 max-w-md leading-relaxed" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
                                    Your expert FinOps assistant. Ask about cloud spending, cost optimization, reserved instances, or anything cloud finance.
                                </p>

                                <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                                    {SUGGESTIONS.map(({ icon: Icon, label, prompt, color, bg }) => (
                                        <button
                                            key={label}
                                            onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                                            className="flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200"
                                            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = color
                                                e.currentTarget.style.background = bg
                                                e.currentTarget.style.boxShadow = `0 4px 20px ${color}22`
                                                e.currentTarget.style.transform = 'translateY(-1px)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                                                e.currentTarget.style.background = 'var(--bg-surface)'
                                                e.currentTarget.style.boxShadow = 'none'
                                                e.currentTarget.style.transform = 'translateY(0)'
                                            }}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                                style={{ background: bg, border: `1px solid ${color}28` }}
                                            >
                                                <Icon size={15} style={{ color }} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
                                                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{prompt}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Message list */}
                        {!loadingSession && (
                            <div className="space-y-8">
                                {messages.map((msg) => (
                                    <MessageBubble key={msg._id} message={msg} />
                                ))}

                                {isStreaming && streamingContent && (
                                    <MessageBubble message={{ role: 'assistant', content: streamingContent }} isStreaming />
                                )}

                                {isStreaming && !streamingContent && (
                                    <div className="flex gap-3 items-center">
                                        <div
                                            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}
                                        >
                                            <Bot size={13} style={{ color: '#fff' }} />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[0, 1, 2].map((i) => (
                                                <span
                                                    key={i}
                                                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                                                    style={{ background: 'var(--text-muted)', animationDelay: `${i * 160}ms` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                                        style={{ background: 'rgba(244,63,94,0.05)', borderColor: 'rgba(244,63,94,0.2)', color: 'var(--accent-rose)' }}
                                    >
                                        <AlertCircle size={15} />
                                        <span className="flex-1 text-sm">{error}</span>
                                        <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100 transition-opacity">
                                            <X size={14} />
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input area */}
                <div
                    className="flex-shrink-0 px-6 pb-5 pt-3"
                    style={{ background: 'var(--bg-base)' }}
                >
                    <div className="max-w-2xl mx-auto">
                        <div
                            className="flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all duration-200"
                            style={{
                                borderColor: 'var(--border-default)',
                                background: 'var(--bg-surface)',
                                boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                            }}
                            onFocusCapture={(e) => {
                                e.currentTarget.style.borderColor = 'var(--accent-primary)'
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1), 0 2px 16px rgba(0,0,0,0.07)'
                            }}
                            onBlurCapture={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                    e.currentTarget.style.borderColor = 'var(--border-default)'
                                    e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)'
                                }
                            }}
                        >
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value)
                                    e.target.style.height = 'auto'
                                    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px'
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about cloud costs, optimization, or anything FinOps…"
                                rows={1}
                                disabled={isStreaming && !streamingContent}
                                className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed disabled:opacity-50"
                                style={{ color: 'var(--text-primary)', maxHeight: '180px', fontFamily: 'inherit', paddingTop: '2px', overflowY: 'hidden' }}
                            />
                            {isStreaming ? (
                                <button
                                    onClick={stopStreaming}
                                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                                    style={{ background: 'var(--accent-rose)', color: '#fff', boxShadow: '0 2px 8px rgba(244,63,94,0.35)' }}
                                    title="Stop generating"
                                >
                                    <Square size={13} fill="currentColor" />
                                </button>
                            ) : (
                                <button
                                    onClick={sendMessage}
                                    disabled={!input.trim()}
                                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={
                                        input.trim()
                                            ? { background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', boxShadow: '0 2px 10px rgba(99,102,241,0.4)' }
                                            : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }
                                    }
                                    title="Send (Enter)"
                                >
                                    <Send size={13} />
                                </button>
                            )}
                        </div>
                        <p className="text-center text-[11px] mt-2.5" style={{ color: 'var(--text-muted)' }}>
                            Press <kbd className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded text-[10px] font-mono" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>Shift+Enter</kbd> for new line
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Mobile slide-over drawer ── */}
            <AnimatePresence>
                {panelOpen && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className="fixed inset-0 z-[60] lg:hidden"
                            style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(2px)' }}
                            onClick={() => setPanelOpen(false)}
                        />
                        <motion.div
                            key="drawer"
                            initial={{ x: -280, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -280, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 36, mass: 0.8 }}
                            className="fixed left-0 top-0 bottom-0 z-[61] flex flex-col lg:hidden"
                            style={{
                                width: '280px',
                                background: 'var(--bg-surface)',
                                borderRight: '1px solid var(--border-subtle)',
                                boxShadow: '8px 0 48px rgba(0,0,0,0.16)',
                            }}
                        >
                            <div className="flex items-center justify-end px-3 pt-3 pb-1 flex-shrink-0">
                                <button
                                    onClick={() => setPanelOpen(false)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <SidebarContent onSelect={() => setPanelOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
