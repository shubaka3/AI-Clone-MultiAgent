"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { logger } from "@/lib/logger"

interface UpdateAiModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  initialData?: Partial<{
    name: string
    provider: string
    api_key: string
    embedding_model_name: string
    chat_model_name: string
    embedding_dim: string | number
    tool: string
    ai_domain: string
  }>
}

export function UpdateAiModal({ isOpen, onClose, onSubmit, initialData }: UpdateAiModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    api_key: "",
    embedding_model_name: "",
    chat_model_name: "",
    embedding_dim: "",
    tool: "",
    ai_domain: "",
  })

  // Reset form mỗi khi mở modal edit agent mới
  useEffect(() => {
    setFormData({
      name: initialData?.name || "",
      provider: initialData?.provider || "",
      api_key: initialData?.api_key || "",
      embedding_model_name: initialData?.embedding_model_name || "",
      chat_model_name: initialData?.chat_model_name || "",
      embedding_dim: initialData?.embedding_dim?.toString() || "",
      tool: initialData?.tool || "",
      ai_domain: initialData?.ai_domain || "",
    })
  }, [initialData, isOpen])

  const handleProviderChange = (provider: string) => {
    logger.info("Provider selected", { provider })

    let defaults = {}
    switch (provider) {
      case "openai":
        defaults = {
          embedding_model_name: "text-embedding-3-large",
          chat_model_name: "gpt-3.5-turbo",
          embedding_dim: "1536",
        }
        break
      case "anthropic":
        defaults = {
          embedding_model_name: "text-embedding-3-large",
          chat_model_name: "claude-3-sonnet",
          embedding_dim: "3072",
        }
        break
      case "google":
        defaults = {
          embedding_model_name: "text-embedding-004",
          chat_model_name: "gemini-pro",
          embedding_dim: "768",
        }
        break
      case "custom":
        defaults = {
          api_key: "custom_apikey",
          embedding_model_name: "custom-embedding",
          chat_model_name: "custom-chat",
          embedding_dim: "512",
        }
        break
    }

    setFormData((prev) => ({ ...prev, provider, ...defaults }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dataToSend: Record<string, any> = {}
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== "") dataToSend[key] = value
    })
    logger.info("Updating AI agent", dataToSend)
    onSubmit(dataToSend)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit AI Agent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">AI Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter AI name"
            />
          </div>

          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select value={formData.provider} onValueChange={handleProviderChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.provider !== "custom" && (
            <div>
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData((prev) => ({ ...prev, api_key: e.target.value }))}
                placeholder="Enter API key"
              />
            </div>
          )}

          {formData.provider !== "custom" && (
            <div>
              <Label htmlFor="embedding_model">Embedding Model</Label>
              <Input
                id="embedding_model"
                value={formData.embedding_model_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, embedding_model_name: e.target.value }))}
                placeholder="Embedding model name"
              />
            </div>
          )}

          <div>
            <Label htmlFor="chat_model">Chat Model</Label>
            <Input
              id="chat_model"
              value={formData.chat_model_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, chat_model_name: e.target.value }))}
              placeholder="Chat model name"
            />
          </div>

          {formData.provider !== "custom" && (
            <div>
              <Label htmlFor="embedding_dim">Embedding Dimension</Label>
              <Input
                id="embedding_dim"
                type="number"
                value={formData.embedding_dim}
                onChange={(e) => setFormData((prev) => ({ ...prev, embedding_dim: e.target.value }))}
                placeholder="Embedding dimension"
              />
            </div>
          )}

          {formData.provider === "custom" && (
            <>
              <div>
                <Label htmlFor="tool">Tool</Label>
                <Select
                  value={formData.tool || ""}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, tool: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proxy-n8n">proxy-n8n</SelectItem>
                    <SelectItem value="proxy-ai">proxy-ai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nếu tool = proxy-ai thì hiển thị API Key */}
              {formData.tool === "proxy-ai" && (
                <div>
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key || ""} // Luôn có string
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, api_key: e.target.value }))
                    }
                    placeholder="Enter API key"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="ai_domain">
                  {formData.tool === "proxy-ai" ? "Assistants ID" : "AI Domain"}
                </Label>
                <Input
                  id="ai_domain"
                  value={formData.ai_domain || ""} // Luôn có string
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ai_domain: e.target.value }))
                  }
                  placeholder={
                    formData.tool === "proxy-ai"
                      ? "Enter Assistants ID"
                      : "Enter domain"
                  }
                  required
                />
              </div>
            </>
          )}


          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
