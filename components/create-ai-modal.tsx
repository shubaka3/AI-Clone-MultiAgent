"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { logger } from "@/lib/logger"

interface CreateAiModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export function CreateAiModal({ isOpen, onClose, onSubmit }: CreateAiModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    api_key: "",
    embedding_model_name: "",
    chat_model_name: "",
    embedding_dim: "",
  })

  const handleProviderChange = (provider: string) => {
    logger.info("Provider selected", { provider })

    let defaults = {}
    switch (provider) {
      case "openai":
        defaults = {
          embedding_model_name: "text-embedding-ada-002",
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
    logger.info("Creating AI agent", { name: formData.name, provider: formData.provider })
    onSubmit(formData)
    setFormData({
      name: "",
      provider: "",
      api_key: "",
      embedding_model_name: "",
      chat_model_name: "",
      embedding_dim: "",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New AI Agent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">AI Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter AI name"
              required
            />
          </div>

          <div>
            <Label htmlFor="provider">Provider</Label>
            <Select value={formData.provider} onValueChange={handleProviderChange} required>
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

          <div>
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData((prev) => ({ ...prev, api_key: e.target.value }))}
              placeholder="Enter API key"
              required
            />
          </div>

          <div>
            <Label htmlFor="embedding_model">Embedding Model</Label>
            <Input
              id="embedding_model"
              value={formData.embedding_model_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, embedding_model_name: e.target.value }))}
              placeholder="Embedding model name"
              required
            />
          </div>

          <div>
            <Label htmlFor="chat_model">Chat Model</Label>
            <Input
              id="chat_model"
              value={formData.chat_model_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, chat_model_name: e.target.value }))}
              placeholder="Chat model name"
              required
            />
          </div>

          <div>
            <Label htmlFor="embedding_dim">Embedding Dimension</Label>
            <Input
              id="embedding_dim"
              type="number"
              value={formData.embedding_dim}
              onChange={(e) => setFormData((prev) => ({ ...prev, embedding_dim: e.target.value }))}
              placeholder="Embedding dimension"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create AI
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
