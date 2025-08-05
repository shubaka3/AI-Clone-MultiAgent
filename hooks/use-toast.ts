import { useState, useCallback } from 'react'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

let toastCount = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastCount}`
    const newToast: ToastProps = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant || 'default',
      duration: options.duration || 5000,
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, newToast.duration)

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    toasts,
    toast,
    dismiss,
  }
}

// Global toast instance
let globalToast: ReturnType<typeof useToast> | null = null

export function getToast() {
  if (!globalToast) {
    // Create a simple implementation for global use
    const toast = (options: ToastOptions) => {
      const id = `toast-${++toastCount}`
      console.log('Toast:', options.title || options.description)
      return id
    }
    return { toast }
  }
  return globalToast
}

export function setGlobalToast(toastInstance: ReturnType<typeof useToast>) {
  globalToast = toastInstance
}

// Export a simple toast function for immediate use
export const toast = (options: ToastOptions) => {
  const toastInstance = getToast()
  return toastInstance.toast(options)
} 