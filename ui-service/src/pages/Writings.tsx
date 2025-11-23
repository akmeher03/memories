import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/auth.service'
import { ragService } from '../services/rag.service'
import type { ApiError } from '../models/auth.types'

function Dashboard() {
  const navigate = useNavigate()
  const [memory, setMemory] = useState('')
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/signin')
      return
    }
    setIsAuthenticated(true)
  }, [navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!memory.trim()) {
      setErrorMessage('Please write something before sending')
      return
    }

    setIsLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      // Store memory in RAG system
      const ragResponse = await ragService.storeMemory({
        title: title.trim() || 'Untitled Memory',
        content: memory.trim()
      })
      
      if (ragResponse.success) {
        setSuccessMessage('Memory saved successfully! ✨')
        setTitle('')
        setMemory('')
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setErrorMessage(ragResponse.message || 'Failed to save memory')
      }
    } catch (error: any) {
      const apiErr = error as ApiError
      setErrorMessage(apiErr.message || 'Failed to save memory. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Cosmic background */}
      <div className="fixed inset-0 bg-gradient-to-br from-accent-900/30 via-dark-bg to-primary-900/30"></div>
      
      {/* Animated stars/particles */}
      <div className="fixed inset-0">
        <div className="absolute top-16 right-32 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse"></div>
        <div className="absolute top-1/3 left-24 w-1 h-1 bg-accent-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute bottom-48 right-1/4 w-1.5 h-1.5 bg-primary-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.8s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-accent-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2.3s' }}></div>
      </div>

      {/* Floating orbs */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>

      {/* Navigation Bar */}
      <nav className="relative z-20 glass-card border-b border-white/10 py-4">
        <div className="max-w-[1200px] mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-3 text-2xl font-bold text-white">
            <span className="text-[2rem]">📝</span>
            <span className="tracking-wide text-gradient">Memories</span>
          </div>
          <ul className="flex gap-4 list-none m-0 p-0 items-center">
            <li>
              <Link to="/" className="text-white no-underline font-medium px-5 py-2.5 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm">
                Home
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-white no-underline font-medium px-3 py-2.5 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm flex items-center gap-2 cursor-pointer text-base"
                  title="Profile"
                >
                  <span className="text-2xl">👤</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-[900px] mx-auto px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-[3rem] font-extrabold text-white mb-3">
            Write Your <span className="text-gradient">Thoughts</span>
          </h1>
          <p className="text-[1.1rem] text-gray-400">
            Capture your memories, dreams, and moments
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 px-6 py-4 rounded-xl bg-primary-500/20 backdrop-blur-sm text-primary-300 text-center font-semibold shadow-lg border border-primary-500/30 animate-fade-in">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 px-6 py-4 rounded-xl bg-red-500/20 backdrop-blur-sm text-red-400 text-center font-semibold shadow-lg border border-red-500/30">
            {errorMessage}
          </div>
        )}

        {/* Writing Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8">
          {/* Title Input */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-gray-300 font-semibold text-lg mb-3">
              Title <span className="text-gray-500 text-sm font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your memory a title..."
              className="input-dark w-full"
            />
          </div>

          {/* Memory/Thought Text Area */}
          <div className="mb-6">
            <label htmlFor="memory" className="block text-gray-300 font-semibold text-lg mb-3">
              Your Memory
            </label>
            <textarea
              id="memory"
              value={memory}
              onChange={(e) => setMemory(e.target.value)}
              placeholder="Start writing your thoughts, feelings, or memories here..."
              rows={12}
              className="w-full px-5 py-4 bg-dark-card border-2 border-white/10 rounded-xl text-base transition-all duration-300 resize-none focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 font-[inherit] leading-relaxed text-white placeholder:text-gray-500"
            />
            <div className="text-right text-sm text-gray-500 mt-2">
              {memory.length} characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => {
                setMemory('')
                setTitle('')
                setErrorMessage('')
                setSuccessMessage('')
              }}
              className="btn-secondary px-8 py-3"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={isLoading || !memory.trim()}
              className="btn-primary px-10 py-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>📨</span>
                  Send Memory
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Go Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white underline text-sm transition-colors duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
