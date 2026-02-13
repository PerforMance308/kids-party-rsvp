import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  actions?: Array<{
    label: string
    action: () => void
  }>
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

function generateToastId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID()
  }
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = generateToastId()
    const newToast = { ...toast, id }
    
    set({ toasts: [...get().toasts, newToast] })
    
    // Auto-remove after duration
    const duration = toast.duration || 5000
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
  },
  
  removeToast: (id) => {
    set({ toasts: get().toasts.filter(toast => toast.id !== id) })
  },
  
  clearToasts: () => {
    set({ toasts: [] })
  }
}))

// Helper functions
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => 
    useToastStore.getState().addToast({ type: 'success', title, message, ...options }),
  
  error: (title: string, message?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'error', title, message, duration: 0, ...options }),
  
  warning: (title: string, message?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'warning', title, message, ...options }),
  
  info: (title: string, message?: string, options?: Partial<Toast>) =>
    useToastStore.getState().addToast({ type: 'info', title, message, ...options })
}
