import { useEffect, useState } from 'react'
import Icon from '../../components/Icon'

export interface AHToast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface Props {
  toasts: AHToast[]
  onDismiss: (id: string) => void
}

function toastIcon(type: AHToast['type']) {
  return type === 'success' ? 'bi-check-circle-fill'
       : type === 'error'   ? 'bi-x-circle-fill'
       : 'bi-info-circle-fill'
}
function toastColor(type: AHToast['type']) {
  return type === 'success' ? '#007560' : type === 'error' ? '#ef4444' : '#3b82f6'
}

function ToastItem({ toast, onDismiss }: { toast: AHToast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const col = toastColor(toast.type)
  return (
    <div className="ah-toast-item" style={{ borderLeft: `4px solid ${col}` }}>
      <span style={{ color: col, flexShrink: 0, fontSize: 16 }}>
        <Icon name={toastIcon(toast.type)} />
      </span>
      <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button className="ah-toast-close" onClick={onDismiss} aria-label="Dismiss">
        <Icon name="bi-x" />
      </button>
    </div>
  )
}

export default function NotificationToast({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null
  return (
    <div className="ah-toast-stack" role="status" aria-live="polite">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

// Hook for convenient toast management
export function useToast() {
  const [toasts, setToasts] = useState<AHToast[]>([])
  function show(type: AHToast['type'], message: string) {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts(prev => [...prev, { id, type, message }])
  }
  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }
  return {
    toasts,
    dismiss,
    showSuccess: (m: string) => show('success', m),
    showError:   (m: string) => show('error', m),
    showInfo:    (m: string) => show('info', m),
  }
}
