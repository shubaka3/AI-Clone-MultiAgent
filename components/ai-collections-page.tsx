// ai-collections-page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { aiService, type AiCollection } from "@/lib/ai-service"
import { logger } from "@/lib/logger"
import { toast } from "@/hooks/use-toast"
import { Search, Pencil, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditCollectionModal } from "@/components/edit-collection-modal"
import { authService } from "@/lib/auth-service"

export function AiCollectionsPage() {
  const [collections, setCollections] = useState<AiCollection[]>([])
  const [filteredCollections, setFilteredCollections] = useState<AiCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAi, setSelectedAi] = useState("all")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentCollectionToEdit, setCurrentCollectionToEdit] = useState<AiCollection | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")

  useEffect(() => {
    const user = authService.getCurrentUser()
    setUserEmail(user?.email || "")
    loadCollections()
  }, [])

  useEffect(() => {
    let filtered = collections
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.ai_name.toLowerCase().includes(lowercasedTerm) ||
          item.collection_name?.toLowerCase().includes(lowercasedTerm) ||
          item.ai_id.toLowerCase().includes(lowercasedTerm)
      )
    }
    if (selectedAi !== "all") {
      filtered = filtered.filter((item) => item.ai_id === selectedAi)
    }
    setFilteredCollections(filtered)
  }, [searchTerm, selectedAi, collections])

  const loadCollections = async () => {
    try {
      setLoading(true)
      logger.info("Loading AI collections for user", { action: "load_collections" })
      const data = await aiService.getAiCollectionsForUser()
      setCollections(data)
    } catch (error) {
      logger.error("Failed to load AI collections", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: "Failed to load AI collections",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditCollection = (collection: AiCollection) => {
    setCurrentCollectionToEdit(collection)
    setIsEditModalOpen(true)
  }

  const handleUpdateCollectionSubmit = async (data: { new_name?: string; collection_prompt?: string | null; start_text?: string | null }) => {
    if (!currentCollectionToEdit || !currentCollectionToEdit.collection_id) {
      toast({
        title: "Error",
        description: "No collection selected for editing.",
        variant: "destructive",
      })
      return
    }

    try {
      await aiService.editCollection(currentCollectionToEdit.collection_id, {
        new_name: data.new_name,
        collection_prompt: data.collection_prompt,
        start_text: data.start_text,
      })
      toast({
        title: "Success",
        description: "Collection updated successfully.",
      })
      setIsEditModalOpen(false)
      setCurrentCollectionToEdit(null)
      loadCollections()
    } catch (error) {
      logger.error("Failed to update collection", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: `Failed to update collection: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    }
  }

  const uniqueAis = useMemo(() => {
    const aiMap = new Map<string, string>()
    collections.forEach((item) => {
      if (!aiMap.has(item.ai_id)) {
        aiMap.set(item.ai_id, item.ai_name)
      }
    })
    return Array.from(aiMap, ([id, name]) => ({ id, name }))
  }, [collections])

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
          <h2 className="text-3xl font-bold text-slate-800">AI Collections</h2>
          <p className="text-slate-600 mt-1">View and filter your AI and their associated collections</p>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by AI name, collection name, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <Select value={selectedAi} onValueChange={setSelectedAi}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by AI" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All AIs</SelectItem>
              {uniqueAis.map((ai) => (
                <SelectItem key={ai.id} value={ai.id}>
                  {ai.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCollections.map((item) => {
          // const scriptCode = `<script src="https://your-cdn.com/embed.js" data-ai="${item.ai_id}" data-collection="${item.collection_id}" data-user="${userEmail}"></script>`
          const scriptCode = `<script src="https://vmentor.emg.edu.vn/ui/embed.js?encryption_api=${item.ai_id}&encryption_secret=${item.collection_id}&email=${userEmail}"></script>`
          return (
            <Card key={item.model_id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg truncate" title={item.ai_name}>{item.ai_name}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditCollection(item)
                  }}
                  className="h-8 w-8 p-0 hover:bg-blue-100"
                >
                  <Pencil className="h-4 w-4 text-green-600" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">Collection</p>
                  {item.collection_name ? (
                    <Badge variant="default">{item.collection_name}</Badge>
                  ) : (
                    <Badge variant="secondary">No Collection</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Created At</p>
                  <p className="text-sm text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Model ID</p>
                  <p className="text-xs text-slate-500 font-mono break-all">{item.model_id}</p>
                </div>

                {/* Embed Script Section */}
                <div>
                  <p className="text-sm font-medium text-slate-600">Embed Script</p>
                  <div
                    className="relative bg-slate-900 text-green-400 text-xs font-mono p-2 rounded-md group"
                  >
                    <code className="block whitespace-pre-wrap break-all">{scriptCode}</code>
                    <Copy
                      className="absolute top-2 right-2 h-4 w-4 opacity-70 cursor-pointer group-hover:opacity-100"
                      onClick={() => {
                        navigator.clipboard.writeText(scriptCode)
                        toast({
                          title: "Copied!",
                          description: "Embed script copied to clipboard",
                        })
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>${item.collection_name || "AI Embed Preview"}</title>
                  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
                </head>
                <body class="bg-light">
                  <div class="container py-5">
                    <div class="card shadow-lg">
                      <div class="card-header bg-primary text-white">
                        <h2 class="mb-0">${item.ai_name}</h2>
                        <small>${userEmail}</small>
                      </div>
                      <div class="card-body">
                        <h5 class="card-title">Collection Info</h5>
                        <ul class="list-group mb-3">
                          <li class="list-group-item"><strong>Collection:</strong> ${item.collection_name || "No Collection"}</li>
                          <li class="list-group-item"><strong>Created At:</strong> ${new Date(item.created_at).toLocaleString()}</li>
                          <li class="list-group-item"><strong>Model ID:</strong> <code>${item.model_id}</code></li>
                        </ul>
                        
                        <h5 class="card-title">Embed Script</h5>
                        <pre class="bg-dark text-success p-2 rounded"><code>&lt;script src="https://vmentor.emg.edu.vn/ui/embed.js?encryption_api=${item.ai_id}&encryption_secret=${item.collection_id}&email=${userEmail}"&gt;&lt;/script&gt;</code></pre>
                      </div>
                    </div>

                    <div class="mt-5 text-center">
                      <h4 class="mb-3">Live Chat Preview</h4>
                      <div class="border rounded p-3 bg-white">
                        <script src="https://vmentor.emg.edu.vn/ui/embed.js?encryption_api=${item.ai_id}&encryption_secret=${item.collection_id}&email=${userEmail}"></script>
                      </div>
                    </div>
                  </div>
                </body>
                </html>`

                    const blob = new Blob([htmlContent], { type: "text/html" })
                    const url = URL.createObjectURL(blob)
                    window.open(url, "_blank")
                  }}
                >
                  Preview
                </Button>
                </div>
                                

                {item.collection_prompt && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">Collection Prompt</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.collection_prompt}</p>
                  </div>
                )}
                {item.start_text && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">Start Text</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.start_text}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCollections.length === 0 && !loading && (
        <div className="text-center py-16 text-slate-500 bg-white rounded-lg shadow-sm">
          <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold">No Collections Found</h3>
          <p className="mt-2">Your search and filter criteria did not match any collections.</p>
        </div>
      )}

      {currentCollectionToEdit && (
        <EditCollectionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setCurrentCollectionToEdit(null)
          }}
          onSubmit={handleUpdateCollectionSubmit}
          initialData={currentCollectionToEdit as {
            collection_id: string
            collection_name: string | null
            collection_prompt: string | null
            start_text: string | null
          }}
        />
      )}
    </div>
  )
}
