// Authentication request models
export interface SignUpRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface SignInRequest {
  email: string
  password: string
}

export interface UpdateProfileRequest {
  userId: string
  firstName?: string
  lastName?: string
  email?: string
  password?: string
}

// Authentication response models
export interface AuthResponse {
  success: boolean
  message: string
  data?: {
      accessToken?: string
      refreshToken?: string
    }
  error?: string
}

export interface UpdateProfileResponse {
  success: boolean
  message: string
  data?: User
  error?: string
}

export interface User {
  userId: string
  email: string
  firstName: string
  lastName: string
  createdAt?: string
  updatedAt?: string
}

// Error response model
export interface ApiError {
  success: false
  message: string
  error: string
  statusCode?: number
}