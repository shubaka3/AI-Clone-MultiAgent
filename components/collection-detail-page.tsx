"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, Upload, FileText, Trash2, Eye, Download, Filter, BookOpenText, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
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

interface TemporaryData {
    data: { [key: string]: string };
    timestamp: number;
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
  const extractFileInputRef = useRef<HTMLInputElement>(null) // Thêm ref mới
  const [showExtractModal, setShowExtractModal] = useState(false)
  const [numPagesToExtract, setNumPagesToExtract] = useState(1) // Mặc định là 1
  const [filesToExtract, setFilesToExtract] = useState<FileList | null>(null)
  const [extractedData, setExtractedData] = useState<{ [key: string]: string } | null>(null)
  const [showExtractedContentModal, setShowExtractedContentModal] = useState(false)
  const [temporaryData, setTemporaryData] = useState<TemporaryData | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0);

  const clearTemporaryData = useCallback(() => {
    setTemporaryData(null);
    setRemainingTime(0);
  }, []);

  const clearExpiredData = useCallback(() => {
      if (temporaryData) {
          const now = Date.now();
          const expireTime = temporaryData.timestamp + 5 * 60 * 1000; // 5 phút
          if (now >= expireTime) {
              clearTemporaryData();
              toast({
                  title: "Temporary Data Expired",
                  description: "The extracted data has been automatically cleared.",
              });
          }
      }
  }, [temporaryData, clearTemporaryData]);


  const [customPrefix, setCustomPrefix] = useState("");
  const [chunkSize, setChunkSize] = useState("0");
  const [maxTokens, setMaxTokens] = useState("256");
  const [xlsxRowLimit, setXlsxRowLimit] = useState("50");

  
  useEffect(() => {
    loadDocuments()
  }, [collectionId])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, statusFilter])


  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (temporaryData) {
        const calculateRemaining = () => {
            const now = Date.now();
            const expireTime = temporaryData.timestamp + 5 * 60 * 1000;
            const remaining = Math.max(0, expireTime - now);
            setRemainingTime(Math.ceil(remaining / 1000));
            if (remaining <= 0) {
                clearExpiredData();
                if (interval) clearInterval(interval);
            }
        };
        calculateRemaining();
        interval = setInterval(calculateRemaining, 1000);
    } else if (interval) {
        clearInterval(interval);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [temporaryData, clearExpiredData]);


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

// Cập nhật hàm để xử lý nhiều tệp
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const fileList = Array.from(files);

    try {
      setIsUploading(true);
      setUploadProgress(0); // Có thể cần thay đổi logic nếu muốn hiển thị tiến trình tổng thể

      logger.info("Uploading multiple documents", {
        count: fileList.length,
        collection_id: collectionId,
      });

      // Gọi hàm superUploadDocuments với các tham số tương ứng
      const uploadRequest = {
        files: fileList,
        ai_id: aiId,
        collection_id: collectionId,
        user_id: aiService.getUserId(),
        custom_prefix: undefined, // Thay đổi từ null sang undefined
        chunk_size: undefined,    // Thay đổi từ null sang undefined
        max_tokens: undefined,    // Thay đổi từ null sang undefined
        xlsx_row_limit: undefined, // Thay đổi từ null sang undefined
      };
      
      await aiService.superUploadDocuments(uploadRequest);

      // Sau khi tải lên hoàn tất, tải lại danh sách tài liệu
      await loadDocuments();

      logger.info("All documents uploaded successfully");
      toast({
        title: "Success",
        description: `${fileList.length} document(s) uploaded successfully`,
      });
    } catch (error) {
      logger.error("Failed to upload documents", { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: "Error",
        description: "Failed to upload documents",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  // upload kèm xử lý extract 
  // const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = event.target.files;
  //   if (!files || files.length === 0) {
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = "";
  //     }
  //     return;
  //   }
    
  //   // Lưu danh sách files vào state để sử dụng sau
  //   setFilesToExtract(files);
  //   // Hiển thị modal để người dùng xác nhận hoặc tùy chỉnh
  //   setShowExtractModal(true);
  // };
  
  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        setFilesToExtract(files);
    }
  };

  // Hàm xử lý upload và trích xuất nội dung
  // const handleExtractAndUpload = async () => {
  //   if (!filesToExtract || filesToExtract.length === 0) return;

  //   try {
  //       setIsUploading(true);
  //       setUploadProgress(0);

  //       const formData = new FormData();
  //       Array.from(filesToExtract).forEach(file => {
  //           formData.append('files', file);
  //       });
  //       formData.append('num', numPagesToExtract.toString());

  //       const response = await fetch("http://127.0.0.1:3030/api/extract-first-pages", {
  //           method: 'POST',
  //           body: formData,
  //       });

  //       if (!response.ok) {
  //           throw new Error('Network response was not ok');
  //       }

  //       const data = await response.json();
  //       setExtractedData(data);
  //       setTemporaryData({ data, timestamp: Date.now() }); // Lưu tạm thời
  //       setShowExtractModal(false); // Đóng modal sau khi gửi
  //       setShowExtractedContentModal(true);

  //       logger.info("Documents extracted successfully", { count: filesToExtract.length });
  //       toast({
  //           title: "Success",
  //           description: `${filesToExtract.length} document(s) extracted successfully`,
  //       });

  //   } catch (error) {
  //       logger.error("Failed to extract documents", { error: error instanceof Error ? error.message : String(error) });
  //       toast({
  //           title: "Error",
  //           description: "Failed to extract documents",
  //           variant: "destructive",
  //       });
  //   } finally {
  //       setIsUploading(false);
  //       setUploadProgress(0);
  //       setFilesToExtract(null);
  //   }
  // };
  const handleExtractAndUpload = async () => {
      if (!filesToExtract || filesToExtract.length === 0) return;

      try {
        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        Array.from(filesToExtract).forEach(file => {
            formData.append('files', file);
        });
        // Đảm bảo rằng numPagesToExtract có giá trị
        formData.append('num', numPagesToExtract.toString());

        const response = await fetch("http://127.0.0.1:3030/api/extract-first-pages", {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setExtractedData(data);
        setTemporaryData({ data, timestamp: Date.now() });
        setShowExtractModal(false);
        setShowExtractedContentModal(true);
        
        // LOGIC MỚI - GỌI HÀM SUPER_UPLOAD
        const filesToUpload = Array.from(filesToExtract);
        const uploadRequest = {
            files: filesToUpload,
            ai_id: aiId,
            collection_id: collectionId,
            user_id: aiService.getUserId(),
            custom_prefix: undefined,
            chunk_size: undefined,
            max_tokens: undefined,
            xlsx_row_limit: undefined,
        };
        
        await aiService.superUploadDocuments(uploadRequest);

        // Sau khi tải lên hoàn tất, cập nhật lại danh sách documents
        await loadDocuments();

        logger.info("Documents extracted and uploaded successfully", { count: filesToExtract.length });
        toast({
            title: "Success",
            description: `${filesToExtract.length} document(s) extracted and uploaded successfully`,
        });

      } catch (error) {
          logger.error("Failed to extract or upload documents", { error: error instanceof Error ? error.message : String(error) });
          toast({
              title: "Error",
              description: "Failed to process documents",
              variant: "destructive",
          });
      } finally {
          setIsUploading(false);
          setUploadProgress(0);
          setFilesToExtract(null);
      }
  };

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

  const handleDownloadDocument = (doc: Document) => {
    // Simulate download
    const blob = new Blob([doc.content || "Document content"], { type: doc.type })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement("a")
    a.href = url
    a.download = doc.name
    a.click()
    URL.revokeObjectURL(url)

    logger.info("Document downloaded", { id: doc.id, name: doc.name })
    toast({
      title: "Success",
      description: `Document "${doc.name}" downloaded`,
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusColor = (status?: string) => {
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
            
            <Button
                onClick={() => setShowExtractModal(true)}
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700"
            >
                <BookOpenText className="h-4 w-4 mr-2" />
                Extract Text
            </Button>
            <input
                ref={extractFileInputRef}
                type="file"
                onChange={handleFileSelection}
                className="hidden"
                accept=".pdf,.docx,.pptx"
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
                  {/* <div>{formatFileSize(document.size)}</div> */}
                  <div>{document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : 'Unknown date'}</div>
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
                    {/* <div className="text-slate-600">{formatFileSize(selectedDocument.size)}</div> */}
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
                    <div className="text-slate-600">{selectedDocument.uploaded_at ? new Date(selectedDocument.uploaded_at).toLocaleDateString() : 'Unknown date'}</div>
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
        
        {/* Modal để nhập số trang trích xuất */}
        <Dialog open={showExtractModal} onOpenChange={setShowExtractModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Extract Text from Documents</DialogTitle>
                    <DialogDescription>
                        Select documents and choose the number of pages/sections to extract.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label htmlFor="num-pages" className="block text-sm font-medium text-gray-700 mb-1">
                            Number of Pages to Extract
                        </label>
                        <Input
                            id="num-pages"
                            type="number"
                            min="1"
                            value={numPagesToExtract}
                            onChange={(e) => setNumPagesToExtract(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                    <Button
                        onClick={() => extractFileInputRef.current?.click()}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Select Files for Extraction
                    </Button>
                </div>
                {filesToExtract && (
                    <DialogFooter className="mt-4">
                        <div className="flex-1 text-sm text-gray-500 mr-4">
                            Đã chọn {filesToExtract.length} file.
                        </div>
                        <Button
                            onClick={handleExtractAndUpload}
                            disabled={isUploading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isUploading ? "Extracting..." : "Start Extraction"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>

        {/* Modal hiển thị nội dung trích xuất */}
        {(extractedData || temporaryData) && (
            <Dialog open={showExtractedContentModal} onOpenChange={setShowExtractedContentModal}>
                <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Extracted Content & AI Prompt</DialogTitle>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Cột Nội dung trích xuất */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg">Extracted Content:</h4>
                            <div className="bg-slate-50 p-4 rounded-lg max-h-[60vh] overflow-y-auto space-y-4">
                                {Object.entries(temporaryData?.data || extractedData!).map(([fileName, content], index) => (
                                    <div key={fileName} className="p-4 border rounded-md border-gray-200">
                                        <h5 className="font-medium text-base mb-1">
                                            {index + 1}. **{fileName}**
                                        </h5>
                                        <pre className="whitespace-pre-wrap text-sm text-slate-800">
                                            {content}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cột Prompt AI */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg">AI Prompt:</h4>
                            <div className="bg-slate-50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-sm text-slate-800">
                                    {`You are a ${collectionName} AI.
You always respond in a friendly, natural, and human-like way, like a supportive classroom teacher. Never use robotic phrasing, meta comments (e.g., “as an AI”), or references to “context,” “user,” or “assistant.”

Inputs you will receive:

User text: the student’s question or message.

RAG data: retrieved knowledge from the ${collectionName} (Lessons 1–35).

Your role:

Use the RAG data as the main source of truth for your answers.

If the student asks about something outside the ${collectionName} curriculum, politely guide them back by saying you can only help with the listed topics.

Give explanations that are clear, concise, and easy to understand.

Use examples, analogies, or simple comparisons when helpful.

If the student seems confused, explain again in a simpler way.

Encourage curiosity and make learning enjoyable.

${collectionName} Road Map - Learning Path:
T is Topic & G is Gramma
${Object.entries(temporaryData?.data || extractedData!).map(([fileName, content], index) => 
    `${index + 1} - ${content.substring(0, 100).replace(/\n/g, ' ')}...`).join('\n')
}

this is RAG data you receive
{context}
and this is user's text 
{question}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={clearTemporaryData}>
                            <X className="h-4 w-4 mr-2" />
                            Clear Data
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )}
      </div>

      {/* Button hiển thị dữ liệu tạm thời */}
      {temporaryData && (
          <div className="fixed bottom-6 right-6 z-50">
              <Button
                  onClick={() => setShowExtractedContentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-16 w-16 shadow-lg flex-col items-center justify-center p-2"
              >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs mt-1 leading-none">View Data</span>
                  <span className="text-xs mt-1 leading-none flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {remainingTime}s
                  </span>
              </Button>
          </div>
      )}
    </div>
  )
}