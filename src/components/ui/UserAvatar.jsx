import { useState } from 'react'

const FALLBACK_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E', '#06B6D4']

function nameToColor(name = '') {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const SIZE = {
  xs: { cls: 'w-6 h-6',   text: 'text-[9px]'  },
  sm: { cls: 'w-7 h-7',   text: 'text-[10px]' },
  md: { cls: 'w-8 h-8',   text: 'text-xs'     },
  lg: { cls: 'w-10 h-10', text: 'text-sm'     },
  xl: { cls: 'w-16 h-16', text: 'text-xl'     },
}

/**
 * UserAvatar — displays a person's photo with lazy loading.
 * Falls back to an initials circle (deterministic color from name) if the
 * image URL is missing or fails to load.
 *
 * Props:
 *   user     — object with { name, avatar } — typically a user from mockUsers.js
 *   size     — 'xs' | 'sm' | 'md' | 'lg' | 'xl'   (default 'md')
 *   rounded  — 'full' | 'xl'                         (default 'full')
 *   className — extra Tailwind classes
 */
export default function UserAvatar({ user, size = 'md', rounded = 'full', className = '', style }) {
  const [imgFailed, setImgFailed] = useState(false)

  if (!user) return null

  const { cls, text } = SIZE[size] ?? SIZE.md
  const roundedCls = rounded === 'xl' ? 'rounded-xl' : 'rounded-full'
  const base = `shrink-0 ${cls} ${roundedCls} ${className}`

  if (user.avatar && !imgFailed) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        loading="lazy"
        onError={() => setImgFailed(true)}
        className={`${base} object-cover`}
        style={style}
      />
    )
  }

  return (
    <div
      className={`${base} flex items-center justify-center font-bold text-white ${text}`}
      style={{ background: nameToColor(user.name), ...style }}
    >
      {getInitials(user.name)}
    </div>
  )
}
