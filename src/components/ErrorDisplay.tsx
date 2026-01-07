'use client'

import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '@/contexts/LanguageContext'

interface ErrorDisplayProps {
  error: string | string[]
  type?: 'error' | 'warning' | 'info' | 'success'
  onRetry?: () => void
  suggestions?: string[]
  className?: string
  dismissible?: boolean
  onDismiss?: () => void
}

export function ErrorDisplay({ 
  error, 
  type = 'error', 
  onRetry, 
  suggestions = [], 
  className = '',
  dismissible = false,
  onDismiss
}: ErrorDisplayProps) {
  const errorMessages = Array.isArray(error) ? error : [error]
  
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    success: 'bg-green-50 border-green-200 text-green-700'
  }

  const icons = {
    error: ExclamationTriangleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
    success: CheckCircleIcon
  }

  const Icon = icons[type]

  const titles = {
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    success: 'Success'
  }

  return (
    <div className={`p-4 border rounded-lg ${styles[type]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {titles[type]}
          </h3>
          <div className="mt-2 text-sm">
            {errorMessages.length === 1 ? (
              <p>{errorMessages[0]}</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {errorMessages.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
          
          {suggestions.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium">Try these solutions:</h4>
              <ul className="mt-1 text-sm list-decimal pl-5 space-y-1">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-4 flex gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm font-medium hover:underline focus:outline-none focus:underline"
              >
                Try Again
              </button>
            )}
            {dismissible && onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-sm font-medium hover:underline focus:outline-none focus:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
        
        {dismissible && onDismiss && (
          <div className="ml-4">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Pre-configured error components for common scenarios
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      error="Unable to connect to the server"
      suggestions={[
        "Check your internet connection",
        "Try refreshing the page",
        "Contact support if the problem persists"
      ]}
      onRetry={onRetry}
    />
  )
}

export function ValidationError({ errors }: { errors: string[] }) {
  return (
    <ErrorDisplay
      error={errors}
      suggestions={[
        "Please check all required fields are filled",
        "Ensure field formats are correct",
        "Try refreshing the form if errors persist"
      ]}
    />
  )
}

export function AuthenticationError() {
  return (
    <ErrorDisplay
      error="You need to be signed in to perform this action"
      suggestions={[
        "Sign in to your existing account",
        "Create a new account if you don't have one",
        "Contact support if you're having trouble accessing your account"
      ]}
    />
  )
}

export function LoadingError({ onRetry, resource }: { onRetry?: () => void, resource?: string }) {
  return (
    <ErrorDisplay
      error={`Failed to load ${resource || 'data'}`}
      suggestions={[
        "Check your internet connection",
        "Try refreshing the page",
        "Contact support if the error continues"
      ]}
      onRetry={onRetry}
    />
  )
}