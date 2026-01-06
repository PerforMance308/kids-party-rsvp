'use client'

import { useToastStore, Toast } from '@/lib/toast'
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast, onClose: () => void }) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const icons = {
    success: CheckCircleIcon,
    error: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  }

  const Icon = icons[toast.type]

  return (
    <div className={`p-4 border rounded-lg shadow-lg ${styles[toast.type]} animate-in slide-in-from-right duration-300`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{toast.title}</h4>
            {toast.message && (
              <p className="text-sm mt-1 opacity-90">{toast.message}</p>
            )}
            
            {toast.actions && (
              <div className="mt-3 flex gap-2">
                {toast.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      action.action()
                      onClose()
                    }}
                    className="text-sm font-medium underline hover:no-underline focus:outline-none focus:no-underline"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 opacity-70 hover:opacity-100 focus:outline-none focus:opacity-100"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}