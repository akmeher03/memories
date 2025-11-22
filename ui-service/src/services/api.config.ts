import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// ============================================
// API CONFIGURATION
// ============================================
// This file sets up a centralized Axios instance for making HTTP requests
// It handles authentication, token refresh, and error handling automatically

// API Configuration - Base URL and timeout settings
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080' // Backend server URL
const API_TIMEOUT = 30000 // 30 seconds - How long to wait for a response before timing out

// ============================================
// TOKEN REFRESH STATE MANAGEMENT
// ============================================
// These variables manage the token refresh process to avoid multiple simultaneous refresh attempts

// Flag: Indicates if we're currently refreshing the token
// Prevents multiple API calls from triggering multiple refresh requests at the same time
let isRefreshing = false

// Queue: Stores all API requests that failed while token was being refreshed
// Once token is refreshed, all these queued requests will be retried automatically
let failedQueue: Array<{
  resolve: (value?: any) => void  // Function to call when token refresh succeeds
  reject: (reason?: any) => void   // Function to call when token refresh fails
}> = []

// Function: Process all queued requests after token refresh completes
// Parameters:
//   - error: If token refresh failed, this will contain the error
//   - token: If token refresh succeeded, this will contain the new token
const processQueue = (error: any, token: string | null = null) => {
  // Loop through all queued requests
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)  // If refresh failed, reject all queued requests
    } else {
      prom.resolve(token)  // If refresh succeeded, resolve with new token
    }
  })
  
  failedQueue = []  // Clear the queue after processing
}

// ============================================
// CREATE AXIOS INSTANCE
// ============================================
// This is our HTTP client that will be used throughout the app
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,        // All requests will be prefixed with this URL
  timeout: API_TIMEOUT,          // Requests will fail if they take longer than 30 seconds
  headers: {
    'Content-Type': 'application/json',  // Tell server we're sending JSON data
  },
})

// ============================================
// REQUEST INTERCEPTOR
// ============================================
// This runs BEFORE every API request is sent
// Purpose: Automatically attach the authentication token to every request

apiClient.interceptors.request.use(
  (config) => {
    // Get the auth token from browser's localStorage
    const token = localStorage.getItem('authToken')
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`  // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    
    return config  // Send the request with updated headers
  },
  (error) => {
    // If there's an error setting up the request, reject it
    return Promise.reject(error)
  }
)

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
// This runs AFTER every API response is received
// Purpose: Handle errors globally, especially token expiration and refresh

apiClient.interceptors.response.use(
  (response) => {
    // If response is successful (2xx status code), just return it
    return response
  },
  async (error: AxiosError) => {
    // Get the original request configuration so we can retry it later
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    if (error.response) {
      // Server responded with an error status code (4xx, 5xx)
      const status = error.response.status
      
      // ==========================================
      // CASE 1: 401 UNAUTHORIZED
      // ==========================================
      // This means the token is completely invalid (tampered, malformed, etc.)
      if (status === 401) {
        console.error('401 Unauthorized - Invalid token, logging out')
        
        // Clear all authentication data from localStorage
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('currentUser')
        localStorage.removeItem('userId')
        
        // Redirect user to sign in page
        window.location.href = '/signin'
      } 
      
      // ==========================================
      // CASE 2: 403 FORBIDDEN (TOKEN EXPIRED)
      // ==========================================
      // This means the token is valid but expired
      // We'll try to refresh it using the refresh token
      else if (status === 403 && !originalRequest._retry) {
        console.log('403 Forbidden - Token expired, attempting to refresh')
        
        // Step 1: Get the refresh token from localStorage
        const refreshToken = localStorage.getItem('refreshToken')
        
        // Step 1a: If no refresh token exists, logout immediately
        if (!refreshToken) {
          console.error('No refresh token available - logging out')
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('currentUser')
          localStorage.removeItem('userId')
          window.location.href = '/signin'
          return Promise.reject(error)
        }
        
        // Step 2: Check if we're already refreshing the token
        if (isRefreshing) {
          console.log('Already refreshing token, queueing this request')
          
          // Queue this request to be retried after refresh completes
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })  // Add to queue
          }).then(token => {
            // When token refresh succeeds, update this request's token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)  // Retry the original request
          }).catch(err => {
            return Promise.reject(err)  // If refresh failed, reject this request
          })
        }

        // Step 3: Start the token refresh process
        originalRequest._retry = true  // Mark this request as "already retried" to prevent infinite loops
        isRefreshing = true  // Set flag to prevent other requests from starting a new refresh

        try {
          console.log('Calling /auth/refresh endpoint...')
          
          // Step 4: Call the refresh endpoint
          // Note: We use raw axios, not apiClient, to avoid interceptor loops
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken  // Send the refresh token to get new tokens
          })

          // Step 5: Check if refresh was successful
          if (response.data.success && response.data.data?.accessToken) {
            const newAccessToken = response.data.data.accessToken
            const newRefreshToken = response.data.data.refreshToken
            
            console.log('Token refreshed successfully!')
            
            // Step 6: Store the new tokens in localStorage
            localStorage.setItem('authToken', newAccessToken)
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken)
            }
            
            // Step 7: Update the original request with the new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
            }
            
            // Step 8: Process all queued requests with the new token
            processQueue(null, newAccessToken)
            
            // Step 9: Retry the original request with the new token
            return apiClient(originalRequest)
          } else {
            // If response doesn't have the expected format, treat as failure
            throw new Error('Token refresh failed - invalid response')
          }
        } catch (refreshError) {
          // Step 10: Token refresh failed (refresh token expired or invalid)
          console.error('✗ Token refresh failed:', refreshError)
          
          // Reject all queued requests
          processQueue(refreshError, null)
          
          // Clear all authentication data
          localStorage.removeItem('authToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('currentUser')
          localStorage.removeItem('userId')
          
          // Redirect to sign in page
          window.location.href = '/signin'
          
          return Promise.reject(refreshError)
        } finally {
          // Step 11: Reset the refreshing flag
          isRefreshing = false
        }
      } 
      
      // ==========================================
      // CASE 3: 500 SERVER ERROR
      // ==========================================
      else if (status === 500) {
        console.error('500 Server Error - Something went wrong on the server')
      }
    } 
    
    // ==========================================
    // NETWORK ERRORS
    // ==========================================
    else if (error.request) {
      // Request was sent but no response received (network issues, server down, etc.)
      console.error('Network error - no response from server')
    } else {
      // Error occurred while setting up the request
      console.error('Error setting up request:', error.message)
    }
    
    // Return the rejected promise so the calling code can handle the error
    return Promise.reject(error)
  }
)

export default apiClient  // Export so other files can use this configured instance

