"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Upload, FileText, Trash2, Eye, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
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

interface Document {
  id: string
  name: string
  size?: number
  type?: string
  uploaded_at?: string
  status?: "processing" | "completed" | "failed"
  content?: string
  metadata?: {
    page: number
    source: string
    total_pages: number
  }
  text?: string
}

interface CollectionDetailPageProps {
  collectionId: string
  collectionName: string
  aiId: string
}

export function CollectionDetailPage({ collectionId, collectionName, aiId }: CollectionDetailPageProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDocuments()
  }, [collectionId])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, statusFilter])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      logger.info("Loading documents for collection", { collection_id: collectionId })

      // Get document sources from the collection
      const sources = await aiService.getCollectionDocuments(collectionId)
      
      // Convert sources to Document format
      const documents: Document[] = sources.map((source, index) => ({
        id: index.toString(),
        name: source,
        status: "completed" as const,
        uploaded_at: new Date().toISOString(),
      }))

      setDocuments(documents)
      logger.info("Documents loaded successfully", { count: documents.length })
    } catch (error) {
      logger.error("Failed to load documents", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    if (searchTerm) {
      filtered = filtered.filter((doc) => doc.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((doc) => doc.status === statusFilter)
    }

    setFilteredDocuments(filtered)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      logger.info("Uploading multiple documents", {
        count: files.length,
        collection_id: collectionId,
      })

      const uploadPromises = Array.from(files).map(async (file, index) => {
        try {
          await aiService.uploadDocument(file, aiId, collectionId)
          
          return {
            id: Date.now().toString() + index,
            name: file.name,
            size: file.size,
            type: file.type,
            uploaded_at: new Date().toISOString(),
            status: "completed" as const,
          }
        } catch (error) {
          logger.error("Failed to upload file", { filename: file.name, error })
          return {
            id: Date.now().toString() + index,
            name: file.name,
            size: file.size,
            type: file.type,
            uploaded_at: new Date().toISOString(),
            status: "failed" as const,
          }
        }
      })

      const uploadedDocuments = await Promise.all(uploadPromises)
      setDocuments((prev) => [...prev, ...uploadedDocuments])

      logger.info("Documents uploaded successfully", { count: files.length })
      toast({
        title: "Success",
        description: `${files.length} document(s) uploaded successfully`,
      })
    } catch (error) {
      logger.error("Failed to upload documents", { error: error.message })
      toast({
        title: "Error",
        description: "Failed to upload documents",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const document = documents.find((d) => d.id === documentId)
      logger.info("Deleting document", { id: documentId, name: document?.name })

      if (document) {
        await aiService.deleteDocument(collectionId, document.name)
        
        // Reload documents to get the updated list
        await loadDocuments()
      }

      logger.info("Document deleted successfully", { id: documentId })
      toast({
        title: "Success",
        description: "Document deleted successfully",
      })
    } catch (error) {
      logger.error("Failed to delete document", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const handleViewDocument = async (document: Document) => {
    try {
      logger.info("Loading document details", { document_name: document.name })
      
      // Get document details from API
      const documents = await aiService.getDocuments(aiId, collectionId, document.name)
      
      if (documents && documents.length > 0) {
        // Use the first document's data
        const docData = documents[0]
        setSelectedDocument({
          ...document,
          text: docData.text,
          metadata: docData.metadata,
        })
      } else {
        toast({
          title: "Error",
          description: "No document data found",
          variant: "destructive",
        })
      }
    } catch (error) {
      logger.error("Failed to load document details", { error: error instanceof Error ? error.message : String(error) })
      toast({
        title: "Error",
        description: "Failed to load document details",
        variant: "destructive",
      })
    }
  }

  const handleDownloadDocument = (document: Document) => {
    // Simulate download
    const blob = new Blob([document.content || "Document content"], { type: document.type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = document.name
    a.click()
    URL.revokeObjectURL(url)

    logger.info("Document downloaded", { id: document.id, name: document.name })
    toast({
      title: "Success",
      description: `Document "${document.name}" downloaded`,
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getFileIcon = (type?: string) => {
    if (!type) return "📁"
    if (type.startsWith("image/")) return "🖼️"
    if (type.includes("pdf")) return "📄"
    if (type.includes("word") || type.includes("document")) return "📝"
    if (type.includes("text")) return "📃"
    return "📁"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => window.close()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Collection: {collectionName}</h1>
              <p className="text-slate-600 mt-1">Manage documents and content</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload Documents"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.bmp,.webp"
              multiple
            />
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Uploading documents...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{getFileIcon(document.type)}</div>
                  <Badge className={getStatusColor(document.status)}>{document.status}</Badge>
                </div>

                <h3 className="font-medium text-sm mb-2 truncate" title={document.name}>
                  {document.name}
                </h3>

                <div className="text-xs text-slate-500 mb-4 space-y-1">
                  <div>{formatFileSize(document.size)}</div>
                  <div>{new Date(document.uploaded_at).toLocaleDateString()}</div>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewDocument(document)}
                    className="h-8 w-8 p-0"
                    disabled={document.status !== "completed"}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadDocument(document)}
                    className="h-8 w-8 p-0"
                    disabled={document.status !== "completed"}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{document.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteDocument(document.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-slate-500">No documents found</p>
              <p className="text-sm text-slate-400">Upload your first document to get started</p>
            </CardContent>
          </Card>
        )}

        {/* Document Detail Modal */}
        {selectedDocument && (
          <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getFileIcon(selectedDocument.type)}</span>
                  {selectedDocument.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Size:</span>
                    <div className="text-slate-600">{formatFileSize(selectedDocument.size)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Type:</span>
                    <div className="text-slate-600">{selectedDocument.type}</div>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className={getStatusColor(selectedDocument.status)}>{selectedDocument.status}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Uploaded:</span>
                    <div className="text-slate-600">{new Date(selectedDocument.uploaded_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {selectedDocument.metadata && (
                  <div>
                    <h4 className="font-medium mb-2">Document Metadata:</h4>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Page:</span>
                          <div className="text-slate-600">{selectedDocument.metadata.page}</div>
                        </div>
                        <div>
                          <span className="font-medium">Total Pages:</span>
                          <div className="text-slate-600">{selectedDocument.metadata.total_pages}</div>
                        </div>
                        <div>
                          <span className="font-medium">Source:</span>
                          <div className="text-slate-600">{selectedDocument.metadata.source}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDocument.text && (
                  <div>
                    <h4 className="font-medium mb-2">Document Content:</h4>
                    <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{selectedDocument.text}</pre>
                    </div>
                  </div>
                )}

                {!selectedDocument.text && selectedDocument.content && (
                  <div>
                    <h4 className="font-medium mb-2">Content Preview:</h4>
                    <div className="bg-slate-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{selectedDocument.content}</pre>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => handleDownloadDocument(selectedDocument)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={() => setSelectedDocument(null)}>Close</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
