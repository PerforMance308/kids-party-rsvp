'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }
  
  return (
    <div className={`animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 ${sizes[size]} ${className}`} />
  )
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({ 
  isLoading, 
  loadingText, 
  children, 
  disabled,
  className = '',
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <span className="flex items-center">
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText || 'Loading...'}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

export function SkeletonLoader({ lines = 3, className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`h-4 bg-neutral-200 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  className?: string
  label?: string
}

export function ProgressBar({ progress, className = '', label }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-sm text-neutral-600 mb-1">
          <span>{label}</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

interface LoadingPageProps {
  message?: string
  className?: string
}

export function LoadingPage({ message = 'Loading...', className = '' }: LoadingPageProps) {
  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-neutral-600">{message}</p>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="text-neutral-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-neutral-900 mb-2">{title}</h3>
      {description && (
        <p className="text-neutral-600 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}