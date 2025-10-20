import { authService } from "./auth-service"

// Cấu hình API - bạn chỉ cần thay đổi BASE_URL
export const API_CONFIG = {
  BASE_URL: "https://vmentor-service.emg.edu.vn/api", // Backend API running on port 3030
  get USER_ID() {
    const user = authService.getCurrentUser()
    return user?.id || "user_001" // Default user ID for admin account
  },
}

// Các endpoint API
export const API_ENDPOINTS = {
  // User Authentication
  CREATE_USER: "/users",
  LOGIN: "/login",
  GET_USER: "/users",

  // AI Management
  CREATE_AI: "/ai",
  LIST_AIS: "/ai", // GET all AIs for user
  GET_AI_DETAILS: (aiId: string) => `/ai/${aiId}`,
  DELETE_AI: (aiId: string) => `/ai/${aiId}`,
  UPDATE_AI: (aiId: string) => `/ai/${aiId}`,

  // Collection Management
  CREATE_COLLECTION: "/collections",
  GET_COLLECTION_DETAILS: (collectionId: string) => `/collections/${collectionId}`,
  LIST_AI_COLLECTIONS: (aiId: string) => `/ai/${aiId}/collections`,
  DELETE_COLLECTION: (collectionId: string) => `/collections/${collectionId}`,
  EDIT_COLLECTION: "/collections/edit",
  GET_COLLECTION_BY_NAME: (name: string) => `/collections/by-name/${encodeURIComponent(name)}`,


  // tracking grid view dashboard get document
  LIST_USER_AI_COLLECTIONS: "/ai_collections",

  
  // Document Management
  SUPER_UPLOAD_DOCUMENTS: "/documents/super-upload-multiple",
  UPLOAD_DOCUMENT: "/documents/upload",
  GET_COLLECTION_DOCUMENTS: (collectionId: string) => `/collections/${collectionId}/sources`,
  DELETE_DOCUMENT: (collectionId: string, filename: string) => `/collections/${collectionId}/sources/${filename}`,
  GET_ALL_DOCUMENTS: "/documents",
  GET_DOCUMENTS: "/documents",

     // Thêm endpoint mới cho việc trích xuất nội dung
  EXTRACT_PAGES: "https://vmentor-service.emg.edu.vn/api/extract-first-pages",

  // Chat
  CHAT_COMPLETION: "/chat/completions",
}
