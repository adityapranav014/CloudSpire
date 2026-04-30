import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, LayoutGrid, GripVertical, RotateCcw, X } from 'lucide-react'
import { WIDGET_REGISTRY, WIDGET_CATEGORIES } from './WidgetRegistry'
import {
  Sheet,
  SheetContent,
  SheetClose,
} from '../ui/sheet'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip'

export default function WidgetGalleryPanel({ open, onClose, activeWidgetIds, onAdd, onRemove, onReset, onDragStart }) {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = activeCategory === 'All'
    ? WIDGET_REGISTRY
    : WIDGET_REGISTRY.filter(w => w.category === activeCategory)

  const activeCount = activeWidgetIds.size
  const totalCount  = WIDGET_REGISTRY.length

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        showCloseButton={false}
        className="w-[420px] sm:w-[500px] p-0 border-l flex flex-col gap-0"
        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-default)' }}
      >
        {/* ── Header */}
        <div
          className="shrink-0 h-14 px-5 flex items-center justify-between border-b"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-primary-subtle)', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              <LayoutGrid size={14} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
                Widget Library
              </p>
              <p className="text-[11px] mt-0.5 leading-none" style={{ color: 'var(--text-muted)' }}>
                {activeCount} of {totalCount} active
              </p>
            </div>
          </div>
          <TooltipProvider delay={400}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SheetClose
                  className="p-1.5 rounded-lg transition-colors hover:bg-black/[0.06]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </SheetClose>
              </TooltipTrigger>
              <TooltipContent side="left">Close panel</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* ── Category chips */}
        <div
          className="shrink-0 py-3 border-b"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex flex-wrap gap-2 px-5">
          {WIDGET_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all"
              style={
                activeCategory === cat
                  ? { 
                      background: 'var(--accent-primary)',
                      color: '#fff',
                      boxShadow: '0 1px 2px rgba(59,130,246,0.4)',
                      border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)'
                    }
                  : { 
                      background: 'var(--bg-elevated)', 
                      color: 'var(--text-secondary)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)',
                      border: '1px solid var(--border-subtle)'
                    }
              }
            >
              {cat}
            </button>
          ))}
          </div>
        </div>

        {/* ── Widget list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {filtered.map(widget => {
            const isActive = activeWidgetIds.has(widget.id)
            const Icon = widget.icon
            return (
              <motion.div
                key={widget.id}
                layout
                draggable={!isActive}
                onDragStart={() => !isActive && onDragStart(widget)}
                className="flex items-center gap-3 p-3 rounded-xl select-none transition-colors"
                style={{
                  background: isActive
                    ? `color-mix(in srgb, ${widget.color} 6%, var(--bg-elevated))`
                    : 'linear-gradient(180deg, var(--bg-surface), var(--bg-card))',
                  border: isActive
                    ? `1px solid color-mix(in srgb, ${widget.color} 30%, transparent)`
                    : '1px solid var(--border-subtle)',
                  boxShadow: isActive 
                    ? 'inset 0 1px 3px rgba(0,0,0,0.02)' 
                    : '0 2px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
                  cursor: isActive ? 'default' : 'grab',
                }}
                whileHover={!isActive ? { y: -1 } : {}}
                whileTap={!isActive ? { scale: 0.98 } : {}}
              >
                <GripVertical size={13} className="shrink-0" style={{ color: 'var(--text-muted)' }} />

                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${widget.color} 14%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${widget.color} 22%, transparent)`,
                  }}
                >
                  <Icon size={14} style={{ color: widget.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-none mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {widget.name}
                  </p>
                  <p className="text-[11px] leading-tight truncate" style={{ color: 'var(--text-muted)' }}>
                    {widget.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <TooltipProvider delay={400}>
                  {isActive ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={() => onRemove(widget.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ 
                            background: 'linear-gradient(180deg, color-mix(in srgb, var(--accent-rose) 6%, white), color-mix(in srgb, var(--accent-rose) 12%, transparent))', 
                            color: 'var(--accent-rose)',
                            border: '1px solid color-mix(in srgb, var(--accent-rose) 20%, transparent)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.7)'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Remove from dashboard</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onMouseDown={e => e.stopPropagation()}
                          onClick={() => onAdd(widget)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ 
                            background: 'linear-gradient(180deg, color-mix(in srgb, var(--accent-primary) 6%, white), var(--accent-primary-subtle))', 
                            color: 'var(--accent-primary)',
                            border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.7)'
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Add to dashboard</TooltipContent>
                    </Tooltip>
                  )}
                  </TooltipProvider>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ── Footer */}
        <div
          className="shrink-0 border-t px-5 py-4 space-y-3"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
        >
          <TooltipProvider delay={400}>
            <Tooltip>
              <TooltipTrigger
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border text-xs font-semibold transition-colors hover:bg-[--bg-hover]"
                style={{ 
                  borderColor: 'var(--border-default)', 
                  color: 'var(--text-secondary)',
                  background: 'linear-gradient(180deg, var(--bg-surface), var(--bg-elevated))',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.7)'
                }}
              >
                <RotateCcw size={12} />
                Reset to Default Layout
              </TooltipTrigger>
              <TooltipContent side="top">Restore the original widget positions and sizes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SheetContent>
    </Sheet>
  )
}
