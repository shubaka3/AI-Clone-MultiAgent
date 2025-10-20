"use client"

import { Bot, FileText, Settings, Activity, LayoutGrid } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

const menuItems = [
  {
    id: "ai-manage",
    title: "AI Manage",
    icon: Bot,
    description: "Manage your AI agents",
  },
  {
    id: "ai-collections",
    title: "Modle Id Manager",
    icon: LayoutGrid,
    description: "View your AI collections",
  }, // thêm layout grid ơr trên
  {
    id: "logs",
    title: "System Logs",
    icon: FileText,
    description: "View system logs",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "Application settings",
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: Activity,
    description: "Usage analytics",
  },
]

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold text-slate-700 mb-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPage === item.id}
                    className="w-full justify-start hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                  >
                    <button
                      onClick={() => onPageChange(item.id)}
                      className="flex items-center gap-3 w-full p-3 rounded-lg"
                    >
                      <item.icon className="h-5 w-5" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-slate-500">{item.description}</span>
                      </div>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
