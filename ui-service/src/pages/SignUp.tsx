import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import type { ApiError } from '../models/auth.types'

function SignUp() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string>('')

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

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    return newErrors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError('')
    
    const newErrors = validateForm()

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true)
      
      try {
        // Prepare signup request - match the updated model
        const signUpData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email,
          password: formData.password
        }

        // Call API service
        const response = await authService.signUp(signUpData)

        if (response.success) {
          // Success - redirect to home page (which will show welcome with typing effect)
          navigate('/')
        } else {
          setApiError(response.message || 'Sign up failed')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden p-5">
      {/* Cosmic background */}
      <div className="fixed inset-0 bg-gradient-to-br from-accent-900/30 via-dark-bg to-primary-900/30"></div>
      
      {/* Animated stars/particles */}
      <div className="fixed inset-0">
        <div className="absolute top-10 right-16 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse"></div>
        <div className="absolute top-1/3 left-20 w-1 h-1 bg-accent-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute bottom-40 right-1/4 w-1.5 h-1.5 bg-primary-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.8s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-accent-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2.3s' }}></div>
      </div>

      {/* Floating orbs */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>

      <div className="glass-card p-10 w-full max-w-[450px] relative z-10">
        <h1 className="m-0 mb-2 text-white text-[2rem] text-center font-bold">
          Create <span className="text-gradient">Account</span>
        </h1>
        <p className="text-center text-gray-400 mb-8 text-base">Sign up to get started</p>

        {apiError && (
          <div className="px-4 py-3 rounded-lg mb-5 text-sm bg-red-500/10 text-red-400 border border-red-500/20 backdrop-blur-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-semibold text-gray-300 text-sm">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`input-dark ${
                errors.password ? 'border-red-500/50' : ''
              }`}
            />
            {errors.password && <span className="text-red-400 text-[13px] -mt-1">{errors.password}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="font-semibold text-gray-300 text-sm">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={`input-dark ${
                errors.confirmPassword ? 'border-red-500/50' : ''
              }`}
            />
            {errors.confirmPassword && <span className="text-red-400 text-[13px] -mt-1">{errors.confirmPassword}</span>}
          </div>

          <button 
            type="submit" 
            className="btn-primary mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400 text-sm">
          Already have an account? <Link to="/signin" className="text-primary-400 no-underline font-semibold hover:text-primary-300 transition-colors">Sign in here</Link>
        </p>
      </div>
    </div>
  )
}

export default SignUp
