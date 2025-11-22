import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'
import type { ApiError } from '../models/auth.types'

function SignIn() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
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
        // Prepare signin request - removed rememberMe as per updated model
        const signInData = {
          email: formData.email,
          password: formData.password
        }

        // Call API service
        const response = await authService.signIn(signInData)

        if (response.success) {
          // Success - redirect to home page (which will show welcome with typing effect)
          navigate('/')
        } else {
          setApiError(response.message || 'Sign in failed')
        }
      } catch (error: any) {
        const apiErr = error as ApiError
        setApiError(apiErr.message || 'Invalid email or password. Please try again.')
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
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900/30 via-dark-bg to-accent-900/30"></div>
      
      {/* Animated stars/particles */}
      <div className="fixed inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-primary-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-accent-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-60 right-1/3 w-1 h-1 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-20 right-1/4 w-2 h-2 bg-primary-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating orbs */}
      <div className="fixed top-1/4 right-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-1/4 left-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

      <div className="glass-card p-10 w-full max-w-[450px] relative z-10">
        <h1 className="m-0 mb-2 text-white text-[2rem] text-center font-bold">
          Welcome <span className="text-gradient">Back</span>
        </h1>
        <p className="text-center text-gray-400 mb-8 text-base">Sign in to your account</p>

        {apiError && (
          <div className="px-4 py-3 rounded-lg mb-5 text-sm bg-red-500/10 text-red-400 border border-red-500/20 backdrop-blur-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

          <div className="flex justify-end items-center -mt-2">
            <a href="#" className="text-primary-400 no-underline text-sm font-semibold hover:text-primary-300 transition-colors">
              Forgot password?
            </a>
          </div>

          <button 
            type="submit" 
            className="btn-primary mt-2"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400 text-sm">
          Don't have an account? <Link to="/signup" className="text-primary-400 no-underline font-semibold hover:text-primary-300 transition-colors">Sign up here</Link>
        </p>
      </div>
    </div>
  )
}

export default SignIn
