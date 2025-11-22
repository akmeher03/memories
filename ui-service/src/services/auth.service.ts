import apiClient from './api.config'
import type { 
  SignUpRequest, 
  SignInRequest, 
  AuthResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  User,
  ApiError 
} from '../models/auth.types'

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

class AuthService {
  /**
   * Sign up a new user
   * @param userData - User registration data
   * @returns Promise with authentication response
   */
  async signUp(userData: SignUpRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', userData)
      
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Sign in an existing user
   * @param credentials - User login credentials
   * @returns Promise with authentication response
   */
  async signIn(credentials: SignInRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
      
      // Store token if signin is successful
      if (response.data.success && response.data.data?.accessToken) {
        this.storeAuthTokens(
          response.data.data.accessToken,
          response.data.data.refreshToken,
        )
      }
      
      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      await apiClient.post('/auth/logout', { refreshToken })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      this.clearAuthTokens()
    }
  }

  /**
   * Refresh the authentication token
   * @returns Promise with new authentication response
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken
      })

      if (response.data.success && response.data.data?.accessToken) {
        this.storeAuthTokens(
          response.data.data.accessToken,
          response.data.data.refreshToken
        )
      }

      return response.data
    } catch (error: any) {
      this.clearAuthTokens()
      throw this.handleError(error)
    }
  }

  /**
   * Verify if user is authenticated
   * @returns boolean indicating authentication status
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken')
    return !!token
  }

  /**
   * Get current auth token
   * @returns auth token or null
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  }

  /**
   * Get current user data from token/storage
   * @returns user data or null
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (error) {
        return null
      }
    }
    return null
  }

  /**
   * Get user profile by ID
   * @param userId - User ID to fetch
   * @returns Promise with user data
   */
  async getUserProfile(): Promise<UpdateProfileResponse> {
    try {
      const response = await apiClient.get<UpdateProfileResponse>(
        `/user/me`
      )

      // Update stored user data if successful
      if (response.data.success && response.data.data) {
        this.storeUserData(response.data.data)
      }

      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Update user profile
   * @param userData - User data to update
   * @returns Promise with update response
   */
  async updateProfile(userData: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    try {
      const response = await apiClient.put<UpdateProfileResponse>(
        `/user/${userData.userId}`,
        userData
      )

      // Update stored user data if successful
      if (response.data.success && response.data.data) {
        this.storeUserData(response.data.data)
      }

      return response.data
    } catch (error: any) {
      throw this.handleError(error)
    }
  }

  /**
   * Store authentication tokens
   * @param token - Access token
   * @param refreshToken - Refresh token (optional)
   */
  private storeAuthTokens(token: string, refreshToken?: string, userId?: string): void {
    localStorage.setItem('authToken', token)
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    if (userId) {
      localStorage.setItem('userId', userId)
    }
  }

  /**
   * Store user data
   * @param user - User data to store
   */
  private storeUserData(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user))
  }

  /**
   * Clear authentication tokens
   */
  private clearAuthTokens(): void {
    localStorage.removeItem('authToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('userId')
  }

  /**
   * Handle API errors
   * @param error - Error object from axios
   * @returns Formatted error object
   */
  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error
      return {
        success: false,
        message: error.response.data?.message || 'An error occurred',
        error: error.response.data?.error || error.message,
        statusCode: error.response.status
      }
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        message: 'Network error - Unable to reach server',
        error: 'Network error'
      }
    } else {
      // Error setting up request
      return {
        success: false,
        message: 'An unexpected error occurred',
        error: error.message
      }
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
export default authService
