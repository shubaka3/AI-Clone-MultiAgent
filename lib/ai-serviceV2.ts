import { logger } from "./logger"
import { API_CONFIG, API_ENDPOINTS } from "./api-config"
import { authService } from "./auth-service"

export interface CreateAiRequest {
  user_id: string
  name: string
  provider: string
  api_key: string
  embedding_model_name: string
  chat_model_name: string
  embedding_dim: number
  tool: string | null
  ai_domain:string | null
  prompt: string // Optional field for custom prompt
}

export interface AiAgent {
  id: string
  name: string
  provider: string
  chat_model_name: string
  embedding_model_name: string
  embedding_dim: number
  created_at: string
  tool: string | null
  ai_domain:string | null
  prompt: string // Custom prompt for the AI agent
}

export interface AiCollection {
  ai_id: string;
  ai_name: string;
  collection_id: string | null;
  collection_name: string | null;
  created_at: string;
  created_by: string;
  model_id: string;
  user_id: string;
  // Add new fields from the backend
  collection_prompt: string | null;
  start_text: string | null;
}


class AiService {
  private baseUrl = API_CONFIG.BASE_URL

  private getUserId(): string {
    const user = authService.getCurrentUser()
    return user?.id || ""
  }

  private getAuthHeaders(): Record<string, string> {
    const token = authService.getAccessToken()
    return token ? { "Authorization": `Bearer ${token}` } : {}
  }

  async createAi(data: CreateAiRequest): Promise<any> {
    try {
      logger.info("Creating AI agent via API", { name: data.name, provider: data.provider })

      const userId = this.getUserId()
      if (!userId) {
        throw new Error("User not authenticated")
      }

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CREATE_AI}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          ...data,
          user_id: userId,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error("API error response", { status: response.status, error: errorText })
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const result = await response.json()
      logger.info("AI agent created successfully", { ai_id: result.ai_id })
      return result
    } catch (error) {
      logger.error("Failed to create AI agent", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async listAIs(): Promise<AiAgent[]> {
    try {
      logger.info("Fetching all AIs", { user_id: this.getUserId() })

      // Since there's no specific endpoint to list all AIs, we'll use a mock approach for now
      // You can implement this endpoint in your backend if needed
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.LIST_AIS}?user_id=${this.getUserId()}`)

      if (!response.ok) {
        // If the endpoint doesn't exist, return empty array for now
        logger.warn("List AIs endpoint not found, returning empty array")
        return []
      }

      const result = await response.json()
      logger.info("AIs fetched successfully", { count: result.length })
      return result || []
    } catch (error) {
      logger.error("Failed to fetch AIs", { error: error instanceof Error ? error.message : String(error) })
      // Return empty array if endpoint doesn't exist
      return []
    }
  }

  async getAiDetails(aiId: string): Promise<AiAgent> {
    try {
      const userId = this.getUserId()
      logger.info("Fetching AI details", { ai_id: aiId, user_id: userId })

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.GET_AI_DETAILS(aiId)}?user_id=${userId}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.info("AI details fetched successfully", { ai_id: aiId })
      return result
    } catch (error) {
      logger.error("Failed to fetch AI details", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async deleteAi(aiId: string): Promise<void> {
    try {
      const userId = this.getUserId()
      logger.info("Deleting AI agent", { ai_id: aiId, user_id: userId })

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.DELETE_AI(aiId)}?user_id=${userId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      logger.info("AI agent deleted successfully", { ai_id: aiId })
    } catch (error) {
      logger.error("Failed to delete AI agent", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }
  async editAi(aiId: string, data: Partial<{
    api_key: string
    chat_model_name: string
    embedding_dim: number
    embedding_model_name: string
    name: string
    provider: string
    tool: string | null
    ai_domain:string | null
    prompt: string | null // Optional field for custom prompt
  }>): Promise<void> {
    try {
      const userId = this.getUserId()
      logger.info("Editing AI agent", { ai_id: aiId, user_id: userId, data })

      // Chỉ gửi các trường user nhập
      const body: Record<string, any> = {}
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") body[key] = value
      })

      const response = await fetch(`${this.baseUrl}/ai/${aiId}?user_id=${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      logger.info("AI agent edited successfully", { ai_id: aiId })
    } catch (error) {
      logger.error("Failed to edit AI agent", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }


  async createCollection(aiId: string, name: string): Promise<any> {
    try {
      logger.info("Creating collection", { ai_id: aiId, name })

      const userId = this.getUserId()
      if (!userId) {
        throw new Error("User not authenticated")
      }

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CREATE_COLLECTION}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          ai_id: aiId,
          user_id: userId,
          name,
          milvus_collection_name: `col_${aiId}_${Date.now()}`,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.info("Collection created successfully", { collection_id: result.collection_id })
      return result
    } catch (error) {
      logger.error("Failed to create collection", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async getAiCollections(aiId: string): Promise<any[]> {
    try {
      logger.info("Fetching AI collections", { ai_id: aiId })

      const userId = this.getUserId()
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.LIST_AI_COLLECTIONS(aiId)}?user_id=${userId}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.info("AI collections fetched successfully", { ai_id: aiId, count: result.collections?.length })
      return result.collections || []
    } catch (error) {
      logger.error("Failed to fetch AI collections", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async deleteCollection(collectionId: string): Promise<void> {
    try {
      logger.info("Deleting collection", { collection_id: collectionId })

      const userId = this.getUserId()
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.DELETE_COLLECTION(collectionId)}?user_id=${userId}`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      logger.info("Collection deleted successfully", { collection_id: collectionId })
    } catch (error) {
      logger.error("Failed to delete collection", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async uploadDocument(file: File, aiId: string, collectionId: string): Promise<void> {
    try {
      logger.info("Uploading document", { filename: file.name, ai_id: aiId, collection_id: collectionId })

      const userId = this.getUserId()
      if (!userId) {
        throw new Error("User not authenticated")
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("ai_id", aiId)
      formData.append("collection_id", collectionId)
      formData.append("user_id", userId)

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.UPLOAD_DOCUMENT}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      logger.info("Document uploaded successfully", { filename: file.name })
    } catch (error) {
      logger.error("Failed to upload document", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async getCollectionDocuments(collectionId: string): Promise<string[]> {
    try {
      logger.info("Fetching collection documents", { collection_id: collectionId })

      const userId = this.getUserId()
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.GET_COLLECTION_DOCUMENTS(collectionId)}?user_id=${userId}`,
        {
          headers: this.getAuthHeaders(),
        }
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
      logger.error("Failed to fetch collection documents", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async deleteDocument(collectionId: string, filename: string): Promise<void> {
    try {
      logger.info("Deleting document", { collection_id: collectionId, filename })

      const userId = this.getUserId()
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.DELETE_DOCUMENT(collectionId, filename)}?user_id=${userId}`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      logger.info("Document deleted successfully", { collection_id: collectionId, filename })
    } catch (error) {
      logger.error("Failed to delete document", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async getDocuments(aiId?: string, collectionId?: string, sourceFilename?: string): Promise<any[]> {
    try {
      logger.info("Fetching documents", { ai_id: aiId, collection_id: collectionId, source_filename: sourceFilename })

      const userId = this.getUserId()
      let url = `${this.baseUrl}${API_ENDPOINTS.GET_DOCUMENTS}?user_id=${userId}`
      
      if (aiId) {
        url += `&ai_id=${aiId}`
      }
      if (collectionId) {
        url += `&collection_id=${collectionId}`
      }
      if (sourceFilename) {
        url += `&source_filename=${encodeURIComponent(sourceFilename)}`
      }

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.info("Documents fetched successfully", { count: result.documents?.length })
      return result.documents || []
    } catch (error) {
      logger.error("Failed to fetch documents", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async chatCompletion(messages: any[], aiId: string, collectionId: string, stream = false): Promise<any> {
    try {
      logger.info("Sending chat completion request", { ai_id: aiId, collection_id: collectionId, stream })

      const userId = this.getUserId()
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CHAT_COMPLETION}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          messages,
          ai_id: aiId,
          user_id: userId,
          collection_id: collectionId,
          stream,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.info("Chat completion successful", { ai_id: aiId })
      return result
    } catch (error) {
      logger.error("Failed to get chat completion", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  // Validate file type and size
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024 // 10MB
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

    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 10MB" }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: "File type not supported. Please upload PDF, DOC, TXT, or image files." }
    }

    return { valid: true }
  }

  // tracking grid view dashboard get document
  async getAiCollectionsForUser(): Promise<AiCollection[]> {
    try {
      const userId = this.getUserId()
      if (!userId) {
        logger.warn("User not authenticated, cannot fetch AI collections.")
        return []
      }
      logger.info("Fetching AI collections for user", { user_id: userId })

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.LIST_USER_AI_COLLECTIONS}?user_id=${userId}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      logger.info("AI collections for user fetched successfully", { count: result.length })
      return result || []
    } catch (error) {
      logger.error("Failed to fetch AI collections for user", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }
  
    // New method to edit collection details
  async editCollection(collectionId: string, data: { new_name?: string; collection_prompt?: string | null; start_text?: string | null }): Promise<void> {
    try {
      logger.info("Editing collection details", { collection_id: collectionId, data })

      const userId = this.getUserId()
      if (!userId) {
        throw new Error("User not authenticated")
      }

      const body = {
        collection_id: collectionId,
        ...data,
      }

      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.EDIT_COLLECTION}`, {
        method: "PUT", // Assuming PUT method for update
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error("API error response", { status: response.status, error: errorText })
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      logger.info("Collection edited successfully", { collection_id: collectionId })
    } catch (error) {
      logger.error("Failed to edit collection", { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async getCollectionByName(name: string): Promise<AiCollection | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.GET_COLLECTION_BY_NAME(name)}`,
        { headers: this.getAuthHeaders() }
      )
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const result = await response.json()
      logger.info("Collection fetched by name successfully", { name, collection_id: result.id })
      return {
        ai_id: result.ai_id,
        ai_name: "", // nếu backend chưa trả về
        collection_id: result.id,
        collection_name: result.name,
        created_at: result.created_at,
        created_by: "", // nếu backend chưa trả về
        model_id: result.milvus_collection_name,
        user_id: "", // nếu backend chưa trả về
        collection_prompt: result.collection_prompt,
        start_text: result.start_text,
      }
    } catch (error) {
      logger.error("Failed to fetch collection by name", { name, error })
      return null
    }
  }
  

}

export const aiService = new AiService()
