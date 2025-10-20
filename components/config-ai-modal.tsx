"use client"

import { useMemo } from "react"
// useMemo để theo dõi agent.tool để tính toán lại script khi agent.tool thay đổi
import { useState, useEffect } from "react"
import { Plus, Eye, Trash2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { logger } from "@/lib/logger"
import { toast } from "@/hooks/use-toast"
import { aiService } from "@/lib/ai-service"
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

interface Collection {
  id: string
  name: string
  milvus_collection_name: string
  created_at: string
  document_count?: number
}

interface ConfigAiModalProps {
  agent: any
  isOpen: boolean
  onClose: () => void
  onUpdate: (agent: any) => void
  userEmail: string
  userId?: string 
}

export function ConfigAiModal({ agent, isOpen, onClose, onUpdate, userEmail, userId }: ConfigAiModalProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [newCollectionName, setNewCollectionName] = useState("")
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)
  const [selectedCollectionForScript, setSelectedCollectionForScript] = useState("")
  const [generatedScript, setGeneratedScript] = useState("")
  const [scriptCopied, setScriptCopied] = useState(false)
  const [showEmbeddingWarning, setShowEmbeddingWarning] = useState(true)
  const [generatedModel, setGeneratedModel] = useState("") // thêm state để lưu model string sau khi tạotạo
  const isProxyTool = useMemo(() => {
    return agent?.tool === "proxy-n8n" || agent?.tool === "proxy-ai"
  }, [agent?.tool])
  console.log("Agent received in modal:", agent)
  console.log("agent.tool:", agent?.tool)
  console.log("isProxyTool:", isProxyTool)
  console.log("Received userId in ConfigAiModal:", userId)

  


  useEffect(() => {
    if (isOpen) {
      loadCollections()
    }
  }, [isOpen, agent.id])

  const loadCollections = async () => {
    try {
      logger.info("Loading collections for AI", { ai_id: agent.id })
      const collections = await aiService.getAiCollections(agent.id)
      setCollections(collections)
      logger.info("Collections loaded", { count: collections.length })
    } catch (error) {
      logger.error("Failed to load collections", { error: error instanceof Error ? error.message : String(error) })
    }
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return

    try {
      setIsCreatingCollection(true)
      logger.info("Creating new collection", { name: newCollectionName, ai_id: agent.id })

      const result = await aiService.createCollection(agent.id, newCollectionName)
      
      // Reload collections to get the updated list
      await loadCollections()
      setNewCollectionName("")

      logger.info("Collection created successfully", { id: result.collection_id, name: result.name })
      toast({
        title: "Success",
        description: `Collection "${newCollectionName}" created successfully`,
      })
    } catch (error) {
      logger.error("Failed to create collection", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive",
      })
    } finally {
      setIsCreatingCollection(false)
    }
  }

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      const collection = collections.find((c) => c.id === collectionId)
      logger.info("Deleting collection", { id: collectionId, name: collection?.name })

      await aiService.deleteCollection(collectionId)
      
      // Reload collections to get the updated list
      await loadCollections()

      logger.info("Collection deleted successfully", { id: collectionId })
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      })
    } catch (error) {
      logger.error("Failed to delete collection", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      })
    }
  }

  // const generateScript = () => {
  //   if (!selectedCollectionForScript) return

  //   // Get current domain for the embed script
  //   const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  //   // const script = `<script src="${currentDomain}/embed.js?ai_id=${agent.id}&collection_id=${selectedCollectionForScript}&user_id=\${user_id}"></script>`
  //   const script = `<script src="https://vmentor.emg.edu.vn/ui/embed.js?encryption_api=${agent.id}&encryption_secret=${selectedCollectionForScript}&email=${userEmail}"></script>`
  //   setGeneratedScript(script)
  //   logger.info("Script generated", { ai_id: agent.id, collection_id: selectedCollectionForScript })
  // }
  const generateScript = () => {
    if (!isProxyTool && !selectedCollectionForScript) return
  
    const currentDomain = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const collectionId = selectedCollectionForScript || "null" // thêm collection id 

    const script = isProxyTool
      ? `<script src="https://vmentor.emg.edu.vn/ui/embed.js?encryption_api=${agent.id}&encryption_secret=6g2ga-4495-851-8s22-a8a33&email=${userEmail}"></script>`
      : `<script src="https://vmentor.emg.edu.vn/ui/embed.js?encryption_api=${agent.id}&encryption_secret=${selectedCollectionForScript}&email=${userEmail}"></script>`
  
    const modelStr = `${agent.id}&${collectionId}&${userId || "null"}` // dùng collection id ở đây 

    setGeneratedScript(script)
    setGeneratedModel(modelStr)

    logger.info("Script generated", {
      ai_id: agent.id,
      collection_id: isProxyTool ? null : selectedCollectionForScript
    })
  }
  
  const [modelCopied, setModelCopied] = useState(false)
  const modelString = `${agent.id}&${selectedCollectionForScript}&${userId}`

  const copyModelString = async () => {
    try {
      await navigator.clipboard.writeText(modelString)
      setModelCopied(true)
      setTimeout(() => setModelCopied(false), 2000)
      toast({
        title: "Success",
        description: "Model string copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy model string",
        variant: "destructive",
      })
    }
  }



  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript)
      setScriptCopied(true)
      setTimeout(() => setScriptCopied(false), 2000)
      toast({
        title: "Success",
        description: "Script copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy script",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Configure AI Agent: {agent.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Collections Section */}
            {!isProxyTool && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Collections</h3>

              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateCollection()}
                />
                <Button
                  onClick={handleCreateCollection}
                  disabled={isCreatingCollection || !newCollectionName.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collections.map((collection) => (
                  <Card key={collection.id} className="hover:shadow-md transition-shadow rounded-lg">
                    <CardHeader className="pb-2 px-4 pt-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium">{collection.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Navigate to collection detail page
                              window.open(
                                `/collection/${collection.id}?name=${encodeURIComponent(collection.name)}&ai_id=${agent.id}`,
                                "_blank",
                              )
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xác nhận xóa Collection</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa collection "{collection.name}"? Tất cả tài liệu trong
                                  collection này sẽ bị xóa.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCollection(collection.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="text-xs">
                          {/* {collection.document_count || 0} docs */}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(collection.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            )}
            {/* Script Generation Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Generate Embed Script</h3>

              <div className="space-y-4">
              {!isProxyTool && (
                <div>
                  <Label>Select Collection</Label>
                  <Select value={selectedCollectionForScript} onValueChange={setSelectedCollectionForScript}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
                <Button
                  onClick={generateScript}
                  disabled={!isProxyTool && !selectedCollectionForScript}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Generate Script
                </Button>

                {generatedScript && (
                  <div className="space-y-2">
                    <div className="relative">
                      <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{generatedScript}</code>
                      </pre>
                      <Button size="sm" variant="ghost" onClick={copyScript} className="absolute top-2 right-2">
                        {scriptCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {generatedModel && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Model ID</h3>
                  <div className="relative">
                    <pre className="bg-slate-100 p-4 rounded-lg text-sm overflow-x-auto select-all">
                      <code>{generatedModel}</code>
                    </pre>
                    <Button size="sm" variant="ghost" onClick={copyModelString} className="absolute top-2 right-2">
                      {modelCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
