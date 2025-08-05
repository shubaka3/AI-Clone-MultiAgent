import { logger } from "./logger"
import { API_CONFIG, API_ENDPOINTS } from "./api-config"

export interface Document {
  id: string
  name: string
  size: number
  type: string
  uploaded_at: string
  status: "processing" | "completed" | "failed"
  content?: string
}

export interface UploadDocumentRequest {
  files: FileList
  collectionId: string
  aiId: string
}

class DocumentService {
  private baseUrl = API_CONFIG.BASE_URL
  private userId = API_CONFIG.USER_ID

  async uploadDocuments(request: UploadDocumentRequest): Promise<Document[]> {
    try {
      logger.info("Uploading documents", {
        count: request.files.length,
        collection_id: request.collectionId,
        ai_id: request.aiId,
      })

      const uploadPromises = Array.from(request.files).map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("ai_id", request.aiId)
        formData.append("collection_id", request.collectionId)
        formData.append("user_id", this.userId)

        const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.UPLOAD_DOCUMENT}`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        return {
          id: result.document_id || Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString(),
          status: "processing" as const,
        }
      })

      const documents = await Promise.all(uploadPromises)
      logger.info("Documents uploaded successfully", { count: documents.length })
      return documents
    } catch (error) {
      logger.error("Failed to upload documents", { error: error.message })
      throw error
    }
  }

  async getCollectionDocuments(collectionId: string): Promise<string[]> {
    try {
      logger.info("Fetching collection documents", { collection_id: collectionId })

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.GET_COLLECTION_DOCUMENTS(collectionId)}?user_id=${this.userId}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.info("Collection documents fetched successfully", {
        collection_id: collectionId,
        count: result.sources?.length,
      })
      return result.sources || []
    } catch (error) {
      logger.error("Failed to fetch collection documents", { error: error.message })
      throw error
    }
  }

  async deleteDocument(collectionId: string, filename: string): Promise<void> {
    try {
      logger.info("Deleting document", { collection_id: collectionId, filename })

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.DELETE_DOCUMENT(collectionId, filename)}?user_id=${this.userId}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      logger.info("Document deleted successfully", { collection_id: collectionId, filename })
    } catch (error) {
      logger.error("Failed to delete document", { error: error.message })
      throw error
    }
  }

  async getDocumentContent(collectionId: string, filename: string): Promise<string> {
    try {
      logger.info("Fetching document content", { collection_id: collectionId, filename })

      // This would be a custom endpoint to get document content
      const response = await fetch(
        `${this.baseUrl}/collections/${collectionId}/documents/${filename}/content?user_id=${this.userId}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const content = await response.text()
      logger.info("Document content fetched successfully", { collection_id: collectionId, filename })
      return content
    } catch (error) {
      logger.error("Failed to fetch document content", { error: error.message })
      throw error
    }
  }

  // Validate multiple files
  validateFiles(files: FileList): { valid: boolean; errors: string[] } {
    const maxSize = 10 * 1024 * 1024 // 10MB per file
    const maxTotalSize = 100 * 1024 * 1024 // 100MB total
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
      "image/webp",
    ]

    const errors: string[] = []
    let totalSize = 0

    Array.from(files).forEach((file, index) => {
      // Check individual file size
      if (file.size > maxSize) {
        errors.push(`File ${index + 1} (${file.name}) is too large. Maximum size is 10MB.`)
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1} (${file.name}) has unsupported type: ${file.type}`)
      }

      totalSize += file.size
    })

    // Check total size
    if (totalSize > maxTotalSize) {
      errors.push(`Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds 100MB limit.`)
    }

    // Check file count
    if (files.length > 20) {
      errors.push("Maximum 20 files can be uploaded at once.")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export const documentService = new DocumentService()
