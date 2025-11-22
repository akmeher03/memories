import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '../services/auth.service'

// Inspirational quotes about memories, thoughts, and journaling
const QUOTES = [
  "Your memories are the threads that weave the tapestry of your life.",
  "Write your story, one memory at a time.",
  "Every thought captured is a moment preserved forever.",
  "In the garden of your mind, memories bloom eternal.",
  "Your past is a treasure chest, and your memories are the gems.",
  "The pen is mightier than forgetfulness.",
  "Memories are timeless treasures of the heart.",
  "Today's moments become tomorrow's memories.",
  "Writing is the painting of the voice of your soul.",
  "Every memory is a piece of the puzzle that makes you whole.",
  "Capture the moments, cherish the memories.",
  "Your journal is a mirror of your journey.",
  "In every memory lies a story waiting to be told.",
  "The best stories are found between the pages of our memories.",
  "Your thoughts today shape your memories tomorrow."
]

const Welcome = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [displayedName, setDisplayedName] = useState('')
  const [displayedQuote, setDisplayedQuote] = useState('')
  const [currentQuote, setCurrentQuote] = useState('')
  const [userName, setUserName] = useState('')
  const [nameComplete, setNameComplete] = useState(false)

  useEffect(() => {
    // Get user name from location state or fetch from service
    const stateUserName = location.state?.firstName
    
    if (stateUserName) {
      setUserName(stateUserName)
    } else {
      // If no name in state, try to get from auth service
      const fetchUserName = async () => {
        try {
          const response = await authService.getUserProfile()
          if (response.success && response.data) {
            setUserName(response.data.firstName || 'Friend')
          } else {
            setUserName('Friend')
          }
        } catch (error) {
          setUserName('Friend')
        }
      }
      fetchUserName()
    }

    // Select a random quote
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
    setCurrentQuote(randomQuote)
  }, [location.state])

  // Typing effect for name
  useEffect(() => {
    if (!userName) return

    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex <= userName.length) {
        setDisplayedName(userName.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(typingInterval)
        setNameComplete(true)
      }
    }, 100) // 100ms per character

    return () => clearInterval(typingInterval)
  }, [userName])

  // Typing effect for quote (starts after name is complete)
  useEffect(() => {
    if (!nameComplete || !currentQuote) return

    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex <= currentQuote.length) {
        setDisplayedQuote(currentQuote.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(typingInterval)
      }
    }, 50) // 50ms per character for quote

    return () => clearInterval(typingInterval)
  }, [nameComplete, currentQuote])

  // Auto redirect to home after animation completes
  useEffect(() => {
    if (displayedQuote === currentQuote && currentQuote.length > 0) {
      const timer = setTimeout(() => {
        navigate('/')
      }, 3000) // Wait 3 seconds after quote finishes, then redirect

      return () => clearTimeout(timer)
    }
  }, [displayedQuote, currentQuote, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg relative overflow-hidden">
      {/* Cosmic background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900/40 via-dark-bg to-accent-900/40"></div>
      
      {/* Animated stars/particles - more stars for welcome page */}
      <div className="fixed inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1}s`
            }}
          />
        ))}
      </div>

      {/* Multiple floating orbs */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl">
        {/* Welcome Text */}
        <div className="mb-12">
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-4">
            Welcome,
          </h1>
          <h2 className="text-5xl md:text-6xl font-bold text-gradient min-h-[80px] flex items-center justify-center">
            {displayedName}
            {displayedName && displayedName.length < userName.length && (
              <span className="inline-block w-1 h-16 bg-primary-400 ml-2 animate-pulse"></span>
            )}
          </h2>
        </div>

        {/* Quote */}
        {nameComplete && (
          <div className="glass-card p-8 max-w-3xl mx-auto animate-fade-in">
            <p className="text-xl md:text-2xl text-gray-300 italic leading-relaxed min-h-[100px] flex items-center justify-center">
              "{displayedQuote}"
              {displayedQuote && displayedQuote.length < currentQuote.length && (
                <span className="inline-block w-0.5 h-8 bg-accent-400 ml-1 animate-pulse"></span>
              )}
            </p>
          </div>
        )}

        {/* Loading indicator */}
        {displayedQuote === currentQuote && currentQuote.length > 0 && (
          <div className="mt-12 animate-fade-in">
            <p className="text-gray-400 text-sm mb-4">Redirecting to your dashboard...</p>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Skip button */}
        <button
          onClick={() => navigate('/')}
          className="mt-8 text-gray-500 hover:text-gray-300 text-sm underline transition-colors duration-300"
        >
          Skip to dashboard
        </button>
      </div>
    </div>
  )
}

export default Welcome
