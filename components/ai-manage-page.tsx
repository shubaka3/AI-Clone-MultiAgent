"use client"

import { useState, useEffect } from "react"
import { Plus, Settings, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateAiModal } from "@/components/create-ai-modal"
import { ConfigAiModal } from "@/components/config-ai-modal"
import { UpdateAiModal } from "@/components/update-ai-modal"
import { logger } from "@/lib/logger"
import { toast } from "@/hooks/use-toast"
import { aiService } from "@/lib/ai-service"
import { authService, type User } from "@/lib/auth-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AiAgent {
  id: string
  name: string
  provider: string
  chat_model_name: string
  embedding_model_name: string
  embedding_dim: number
  created_at?: string
  status?: "active" | "inactive"
  user_id?: string
  tool?: string 
  ai_domain?: string 
}

export function AiManagePage() {
  const [agents, setAgents] = useState<AiAgent[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [configAgent, setConfigAgent] = useState<AiAgent | null>(null)
  const [editAgent, setEditAgent] = useState<AiAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string>("")
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      logger.info("Loading AI agents", { action: "load_agents" })

      const user = await authService.getUserWithAIs()
      if (user && user.ai_models) {
        setAgents(user.ai_models)
        setUserEmail(user.email || "")
        setUserId(user.id || "")
        logger.info("AI agents loaded from API", { count: user.ai_models.length })
        console.log("Loaded agents2:", user.email)
        console.log("Loaded agents3:", user.ai_models)
        console.log("Loaded agents4:", user.id)
      } else {
        setAgents([])
        logger.info("No AI agents found")
      }
    } catch (error) {
      logger.error("Failed to load AI agents", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: "Failed to load AI agents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAgent = async (agentData: any) => {
    try {
      logger.info("Creating new AI agent", { name: agentData.name, provider: agentData.provider })

      const result = await aiService.createAi({
        user_id: "",
        name: agentData.name,
        provider: agentData.provider,
        api_key: agentData.api_key,
        embedding_model_name: agentData.embedding_model_name || "text-embedding-3-large",
        chat_model_name: agentData.chat_model_name || "gpt-3.5-turbo",
        embedding_dim: agentData.embedding_dim || 1536,
        tool: agentData.tool || null,
        ai_domain: agentData.ai_domain || null,
      })

      const newAgent: AiAgent = {
        id: result.ai_id,
        name: result.name,
        provider: agentData.provider,
        chat_model_name: agentData.chat_model_name || "gpt-3.5-turbo",
        embedding_model_name: agentData.embedding_model_name || "text-embedding-3-large",
        embedding_dim: agentData.embedding_dim || 1536,
        created_at: new Date().toISOString(),
        tool: agentData.tool || null,
        ai_domain: agentData.ai_domain || null,
      }

      await loadAgents()
      setIsCreateModalOpen(false)

      logger.info("AI agent created successfully", { id: newAgent.id, name: newAgent.name })
      toast({
        title: "Success",
        description: `AI agent "${agentData.name}" created successfully`,
      })
    } catch (error) {
      logger.error("Failed to create AI agent", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: "Failed to create AI agent",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const agent = agents.find((a) => a.id === agentId)
      logger.info("Deleting AI agent", { id: agentId, name: agent?.name })

      await aiService.deleteAi(agentId)
      await loadAgents()
      setConfigAgent(null)

      logger.info("AI agent deleted successfully", { id: agentId })
      toast({
        title: "Success",
        description: "AI agent deleted successfully",
      })
    } catch (error) {
      logger.error("Failed to delete AI agent", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: "Failed to delete AI agent",
        variant: "destructive",
      })
    }
  }

  const toggleAgentStatus = async (agentId: string) => {
    try {
      const agent = agents.find((a) => a.id === agentId)
      const newStatus = agent?.status === "active" ? "inactive" : "active"

      logger.info("Toggling AI agent status", { id: agentId, from: agent?.status, to: newStatus })

      setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status: newStatus } : a)))

      logger.info("AI agent status updated", { id: agentId, status: newStatus })
      toast({
        title: "Success",
        description: `AI agent ${newStatus === "active" ? "activated" : "deactivated"}`,
      })
    } catch (error) {
      logger.error("Failed to toggle AI agent status", { error: error instanceof Error ? error.message : String(error) })
    }
  }

  const handleEditAgent = async (data: any) => {
    if (!editAgent) return
    try {
      await aiService.editAi(editAgent.id, data)
      await loadAgents()
      setEditAgent(null)
      toast({
        title: "Success",
        description: "AI agent updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update AI agent",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">AI Agents</h2>
          <p className="text-slate-600 mt-1">Manage your AI agents and their configurations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadAgents}
            variant="outline"
            className="bg-white hover:bg-gray-50"
          >
            Refresh
          </Button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create AI
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0 shadow-md bg-white/80 backdrop-blur-sm rounded-lg"
            onClick={() => setConfigAgent(agent)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-slate-800 truncate mb-2">{agent.name}</h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        {agent.provider}
                      </Badge>
                    </div>

                    <div className="h-12 overflow-hidden">
                      <div className="animate-scroll">
                        <p className="text-sm text-slate-600 whitespace-nowrap">
                          Model: {agent.chat_model_name}
                        </p>
                        <p className="text-sm text-slate-600 whitespace-nowrap">
                          Embedding: {agent.embedding_model_name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditAgent(agent)
                    }}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <Pencil className="h-4 w-4 text-green-600" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfigAgent(agent)
                    }}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <Settings className="h-4 w-4 text-blue-600" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa AI Agent</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa AI Agent "{agent.name}"? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs text-slate-500 space-y-1">
                  <div className="font-mono">{agent.provider}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateAiModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAgent}
      />

      {configAgent && (
        <ConfigAiModal
          userEmail={userEmail}
          userId={userId}   
          agent={configAgent}
          isOpen={!!configAgent}
          onClose={() => setConfigAgent(null)}
          onUpdate={(updatedAgent) => {
            setAgents((prev) => prev.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)))
            setConfigAgent(null)
          }}
        />
      )}

  <UpdateAiModal
    isOpen={!!editAgent}
    onClose={() => setEditAgent(null)}
    onSubmit={handleEditAgent}
    initialData={editAgent || undefined}
  />

    </div>
  )
}
