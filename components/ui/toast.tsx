"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  onDismiss?: (id: string) => void
  className?: string
}

const Toast = React.forwardRef<
  HTMLDivElement,
  ToastProps
>(({ id, title, description, variant = 'default', onDismiss, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        variant === 'default' && "border bg-background text-foreground",
        variant === 'destructive' && "destructive border-destructive bg-destructive text-destructive-foreground",
        className
      )}
      {...props}
    >
      <div className="flex-1">
        {title && (
          <div className="text-sm font-semibold">{title}</div>
        )}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(id)}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
})
Toast.displayName = "Toast"

export { Toast } 