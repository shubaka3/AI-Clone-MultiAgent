"use client"

import { useEffect } from "react"

// Component để fix modal overlay issues
export function ModalOverlayFix() {
  useEffect(() => {
    // Prevent body scroll when modal is open
    const handleModalOpen = () => {
      document.body.style.overflow = "hidden"
    }

    const handleModalClose = () => {
      document.body.style.overflow = "unset"
    }

    // Listen for modal events
    const modals = document.querySelectorAll('[role="dialog"]')

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-state") {
          const target = mutation.target as HTMLElement
          if (target.getAttribute("data-state") === "open") {
            handleModalOpen()
          } else {
            handleModalClose()
          }
        }
      })
    })

    modals.forEach((modal) => {
      observer.observe(modal, { attributes: true })
    })

    return () => {
      observer.disconnect()
      document.body.style.overflow = "unset"
    }
  }, [])

  return null
}
