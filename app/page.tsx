"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AiManagePage } from "@/components/ai-manage-page"
import { LogsPage } from "@/components/logs-page"
import { LoginPage } from "@/components/login-page"
import { UserMenu } from "@/components/user-menu"
import { authService } from "@/lib/auth-service"
import { logger } from "@/lib/logger"

interface User {
  id: string
  email: string
  full_name: string
}

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("ai-manage")
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      logger.info("User restored from session", { userId: currentUser.id })
    }
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = (userData: User) => {
    setUser(userData)
    logger.info("User logged in", { userId: userData.id })
  }

  const handleLogout = () => {
    authService.logout()
    setUser(null)
    logger.info("User logged out")
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "ai-manage":
        return <AiManagePage />
      case "logs":
        return <LogsPage />
      default:
        return <AiManagePage />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Agent Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Welcome, {user.full_name || user.email}</span>
              <UserMenu username={user.full_name || user.email} onLogout={handleLogout} />
            </div>
          </div>
          <div className="flex-1 p-6">{renderCurrentPage()}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
