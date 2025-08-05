import { logger } from "./logger"
import { API_CONFIG, API_ENDPOINTS } from "./api-config"

export interface LoginResponse {
  success: boolean
  user?: User
  access_token?: string
  message?: string
}

export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
  ai_models?: AiAgent[]
}

export interface AiAgent {
  id: string
  name: string
  provider: string
  chat_model_name: string
  embedding_model_name: string
  embedding_dim: number
}

export interface CreateUserRequest {
  email: string
  password: string
  full_name: string
}

export interface LoginRequest {
  email: string
  password: string
}

class AuthService {
  private readonly STORAGE_KEY = "ai_dashboard_user"
  private readonly TOKEN_KEY = "ai_dashboard_token"

  async createUser(userData: CreateUserRequest): Promise<LoginResponse> {
    try {
      logger.info("Creating user account", { email: userData.email })

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CREATE_USER}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error("User creation failed", { status: response.status, error: errorText })
        return {
          success: false,
          message: `Failed to create account: ${errorText}`,
        }
      }

      const result = await response.json()
      logger.info("User created successfully", { userId: result.id })

      // Auto-login after successful registration
      return this.login({ email: userData.email, password: userData.password })
    } catch (error) {
      logger.error("User creation error", { error: error instanceof Error ? error.message : String(error) })
      return {
        success: false,
        message: "An error occurred during account creation",
      }
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      logger.info("Login attempt", { email: credentials.email })

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.LOGIN}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error("Login failed", { status: response.status, error: errorText })
        return {
          success: false,
          message: "Invalid email or password",
        }
      }

      const result = await response.json()
      
      // Save user data and token
      const userData = {
        ...result.user,
        access_token: result.access_token,
      }
      
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData))
      sessionStorage.setItem(this.TOKEN_KEY, result.access_token)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData)) // For persistent login
      localStorage.setItem(this.TOKEN_KEY, result.access_token)

      logger.info("Login successful", { userId: result.user.id, email: result.user.email })

      return {
        success: true,
        user: result.user,
        access_token: result.access_token,
      }
    } catch (error) {
      logger.error("Login error", { error: error instanceof Error ? error.message : String(error) })
      return {
        success: false,
        message: "An error occurred during login",
      }
    }
  }

  async getUserWithAIs(): Promise<User | null> {
    try {
      const currentUser = this.getCurrentUser()
      if (!currentUser) return null

      const token = this.getAccessToken()
      if (!token) return null

      logger.info("Fetching user with AIs", { userId: currentUser.id })

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_USER}?email=${currentUser.email}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        logger.error("Failed to fetch user data", { status: response.status })
        return currentUser // Return cached user data if API fails
      }

      const result = await response.json()
      
      // Update stored user data with AI models
      const updatedUserData = {
        ...currentUser,
        ai_models: result.ai_models || [],
      }
      
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUserData))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUserData))

      logger.info("User data updated with AIs", { aiCount: result.ai_models?.length || 0 })
      return updatedUserData
    } catch (error) {
      logger.error("Error fetching user with AIs", { error: error instanceof Error ? error.message : String(error) })
      return this.getCurrentUser() // Return cached data if API fails
    }
  }

  logout(): void {
    sessionStorage.removeItem(this.STORAGE_KEY)
    sessionStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.TOKEN_KEY)
    logger.info("User logged out")
  }

  getCurrentUser(): User | null {
    try {
      // Try session storage first, then local storage
      const sessionData = sessionStorage.getItem(this.STORAGE_KEY)
      const localData = localStorage.getItem(this.STORAGE_KEY)

      const userData = sessionData || localData

      if (userData) {
        const user = JSON.parse(userData)
        // Re-save to session storage if it came from local storage
        if (!sessionData && localData) {
          sessionStorage.setItem(this.STORAGE_KEY, userData)
          sessionStorage.setItem(this.TOKEN_KEY, localStorage.getItem(this.TOKEN_KEY) || "")
        }
        return user
      }
      return null
    } catch (error) {
      logger.error("Error getting current user", { error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }

  getAccessToken(): string | null {
    const sessionToken = sessionStorage.getItem(this.TOKEN_KEY)
    const localToken = localStorage.getItem(this.TOKEN_KEY)
    return sessionToken || localToken
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.getAccessToken() !== null
  }
}

export const authService = new AuthService()
