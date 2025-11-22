import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import type { User, ApiError } from '../models/auth.types'

function Profile() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [apiError, setApiError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
        console.log('User not authenticated, redirecting to signin')
      navigate('/signin')
      return
    }

    // Fetch user data from API
    const fetchUserProfile = async () => {
      try {
        setIsFetching(true)
        
        // Check if we have authentication token
        const authToken = localStorage.getItem('authToken')

        if (!authToken) {
          setApiError('Authentication required. Please sign in again.')
          navigate('/signin')
          return
        }

        // Fetch user profile from API
        const response = await authService.getUserProfile()

        if (response.success && response.data) {
          setCurrentUser(response.data)
          setFormData({
            firstName: response.data.firstName || '',
            lastName: response.data.lastName || '',
            email: response.data.email || '',
            password: ''
          })
        } else {
          setApiError(response.message || 'Failed to load profile')
        }
      } catch (error: any) {
        const apiErr = error as ApiError
        setApiError(apiErr.message || 'Failed to load user profile')
        // If error is 401 (unauthorized), redirect to signin
        if (apiErr.statusCode === 401) {
          navigate('/signin')
        }
      } finally {
        setIsFetching(false)
      }
    }

    fetchUserProfile()
  }, [navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    setApiError('')
    setSuccessMessage('')
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    return newErrors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError('')
    setSuccessMessage('')
    
    const newErrors = validateForm()

    if (Object.keys(newErrors).length === 0 && currentUser) {
      setIsLoading(true)
      
      try {
        // Prepare update request
        const updateData: any = {
          userId: currentUser.userId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim()
        }

        // Only include password if it's been changed
        if (formData.password) {
          updateData.password = formData.password
        }

        // Call API service
        const response = await authService.updateProfile(updateData)

        if (response.success) {
          setSuccessMessage(response.message || 'Profile updated successfully!')
          // Clear password field after successful update
          setFormData(prev => ({ ...prev, password: '' }))
        } else {
          setApiError(response.message || 'Profile update failed')
        }
      } catch (error: any) {
        const apiErr = error as ApiError
        setApiError(apiErr.message || 'An unexpected error occurred. Please try again.')
      } finally {
        setIsLoading(false)
      }
    } else {
      setErrors(newErrors)
    }
  }

  const handleSignOut = async () => {
    console.log('Signing out user')
    await authService.signOut()
    navigate('/signin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden p-5">
      {/* Cosmic background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900/30 via-dark-bg to-accent-900/30"></div>
      
      {/* Animated stars/particles */}
      <div className="fixed inset-0">
        <div className="absolute top-12 left-24 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse"></div>
        <div className="absolute top-1/4 right-28 w-1 h-1 bg-primary-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-accent-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1.1s' }}></div>
        <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.7s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-primary-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2.2s' }}></div>
      </div>

      {/* Floating orbs */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div className="glass-card p-10 w-full max-w-[500px] relative z-10">
        <div className="flex justify-between items-center mb-2">
          <h1 className="m-0 text-white text-[2rem] font-bold">
            <span className="text-gradient">Profile</span>
          </h1>
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white text-2xl bg-transparent border-none cursor-pointer transition-colors"
            title="Back to Home"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-400 mb-8 text-base">Update your personal information</p>

        {isFetching ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-300 text-lg">Loading profile...</div>
          </div>
        ) : (
          <>
            {apiError && (
              <div className="px-4 py-3 rounded-lg mb-5 text-sm bg-red-500/10 text-red-400 border border-red-500/20 backdrop-blur-sm">
                {apiError}
              </div>
            )}

            {successMessage && (
              <div className="px-4 py-3 rounded-lg mb-5 text-sm bg-primary-500/10 text-primary-300 border border-primary-500/20 backdrop-blur-sm">
                {successMessage}
              </div>
            )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* User ID Display */}
          {/* {currentUser && (
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-gray-300 text-sm">User ID</label>
              <input
                type="text"
                value={currentUser.userId}
                disabled
                className="px-4 py-3 border-2 border-white/10 rounded-lg text-base bg-dark-card text-gray-500 cursor-not-allowed"
              />
            </div>
          )} */}

          {/* First Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="firstName" className="font-semibold text-gray-300 text-sm">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              className={`input-dark ${
                errors.firstName ? 'border-red-500/50' : ''
              }`}
            />
            {errors.firstName && <span className="text-red-400 text-[13px] -mt-1">{errors.firstName}</span>}
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="lastName" className="font-semibold text-gray-300 text-sm">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              className={`input-dark ${
                errors.lastName ? 'border-red-500/50' : ''
              }`}
            />
            {errors.lastName && <span className="text-red-400 text-[13px] -mt-1">{errors.lastName}</span>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-semibold text-gray-300 text-sm">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`input-dark ${
                errors.email ? 'border-red-500/50' : ''
              }`}
            />
            {errors.email && <span className="text-red-400 text-[13px] -mt-1">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-semibold text-gray-300 text-sm">
              Password <span className="text-gray-500 text-xs font-normal">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
              className={`input-dark ${
                errors.password ? 'border-red-500/50' : ''
              }`}
            />
            {errors.password && <span className="text-red-400 text-[13px] -mt-1">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="btn-primary mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full px-6 py-3 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(239,68,68,0.2)] backdrop-blur-sm"
          >
            Sign Out
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Profile
