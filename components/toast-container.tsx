"use client"

import { useToast } from "@/hooks/use-toast"
import { Toast } from "@/components/ui/toast"
import { useEffect } from "react"

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  // Set up global toast instance
  useEffect(() => {
    const { setGlobalToast } = require("@/hooks/use-toast")
    setGlobalToast({ toasts, toast: () => {}, dismiss })
  }, [toasts, dismiss])

  return (
    <div className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onDismiss={dismiss}
        />
      ))}
    </div>
  )
} 