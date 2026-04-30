import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

/** @type {React.Context} Toast context for global notifications */
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-depth-3 text-sm min-w-[280px]"
              style={{
                background: 'var(--bg-surface)',
                borderColor: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#F43F5E' : '#3B82F6',
                color: 'var(--text-primary)',
              }}
            >
              {toast.type === 'success' && <CheckCircle size={16} className="text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <XCircle size={16} className="text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info size={16} className="text-blue-400 shrink-0" />}
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
