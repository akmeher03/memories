import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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

function Home() {
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [displayedName, setDisplayedName] = useState('')
  const [displayedQuote, setDisplayedQuote] = useState('')
  const [currentQuote, setCurrentQuote] = useState('')
  const [userName, setUserName] = useState('')
  const [nameComplete, setNameComplete] = useState(false)
  const [quoteTyped, setQuoteTyped] = useState(false) // Track if quote has been typed once

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Check authentication status
    const authenticated = authService.isAuthenticated()
    setIsAuthenticated(authenticated)

    // If authenticated, fetch user profile and select quote
    if (authenticated) {
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

      // Select a random quote
      const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
      setCurrentQuote(randomQuote)
    }
  }, [])

  // Typing effect for name - repeats continuously
  useEffect(() => {
    if (!userName || !isAuthenticated) return

    let currentIndex = 0
    let isDeleting = false
    let loopTimeout: ReturnType<typeof setTimeout>

    const typeEffect = () => {
      if (!isDeleting) {
        // Typing forward
        if (currentIndex <= userName.length) {
          setDisplayedName(userName.slice(0, currentIndex))
          currentIndex++
          loopTimeout = setTimeout(typeEffect, 100) // 100ms per character
        } else {
          // Finished typing, wait then start deleting
          setNameComplete(true)
          loopTimeout = setTimeout(() => {
            isDeleting = true
            typeEffect()
          }, 3000) // Wait 3 seconds before starting to delete
        }
      } else {
        // Deleting backward
        if (currentIndex > 0) {
          currentIndex--
          setDisplayedName(userName.slice(0, currentIndex))
          loopTimeout = setTimeout(typeEffect, 50) // Faster deletion
        } else {
          // Finished deleting, restart typing (keep nameComplete true so quote doesn't reset)
          isDeleting = false
          loopTimeout = setTimeout(typeEffect, 500) // Short pause before restarting
        }
      }
    }

    typeEffect()

    return () => clearTimeout(loopTimeout)
  }, [userName, isAuthenticated])

  // Typing effect for quote (types once when name completes, then stays)
  useEffect(() => {
    if (!nameComplete || !currentQuote || quoteTyped) return

    let currentIndex = 0
    let loopTimeout: ReturnType<typeof setTimeout>

    const typeEffect = () => {
      if (currentIndex <= currentQuote.length) {
        setDisplayedQuote(currentQuote.slice(0, currentIndex))
        currentIndex++
        loopTimeout = setTimeout(typeEffect, 30) // 30ms per character
      } else {
        // Once complete, mark as typed and never type again
        setQuoteTyped(true)
      }
    }

    typeEffect()

    return () => clearTimeout(loopTimeout)
  }, [nameComplete, currentQuote, quoteTyped])

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-x-hidden">
      {/* Gradient background overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900/20 via-dark-bg to-accent-900/20 pointer-events-none"></div>
      
      {/* Animated gradient orbs */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

      {/* Top Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-[1000] py-4 transition-all duration-400 ${
        isScrolled 
          ? 'bg-dark-surface/80 backdrop-blur-xl border-b border-white/10 shadow-lg' 
          : 'bg-transparent backdrop-blur-0 border-b border-transparent'
      }`}>
        <div className="max-w-[1200px] mx-auto px-8 flex justify-between items-center relative z-10">
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
      <div className="pt-[120px] max-w-[1400px] mx-auto px-8 pb-16 relative z-10">
        {/* Hero Section - Different for authenticated vs non-authenticated */}
        {isAuthenticated ? (
          // Authenticated User - Welcome with Typing Effect (One Line)
          <div className="text-center mb-16 py-8 animate-fade-in min-h-[500px] flex flex-col items-center justify-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-12 flex items-center justify-center gap-4">
              Welcome, <span className="text-gradient">{displayedName}</span>
              {displayedName && displayedName.length < userName.length && (
                <span className="inline-block w-1 h-16 bg-primary-400 animate-pulse"></span>
              )}
            </h1>

            {/* Quote with typing effect */}
            {nameComplete && (
              <div className="glass-card p-8 max-w-4xl mx-auto animate-fade-in">
                <p className="text-xl md:text-2xl text-gray-300 italic leading-relaxed min-h-[100px] flex items-center justify-center text-center">
                  "{displayedQuote}"
                  {!quoteTyped && displayedQuote && displayedQuote.length < currentQuote.length && (
                    <span className="inline-block w-0.5 h-8 bg-accent-400 ml-1 animate-pulse"></span>
                  )}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Non-authenticated User - Original Hero Section
          <div className="text-center mb-16 py-8 animate-fade-in">
            <h1 className="text-[4rem] font-extrabold text-white mb-6 leading-tight tracking-tight">
              Your Personal <span className="text-gradient">Virtual Diary</span>
            </h1>
            <p className="text-xl text-gray-300 font-normal leading-relaxed max-w-[700px] mx-auto">
              Capture your thoughts, dreams, and moments with AI-powered intelligence
            </p>
          </div>
        )}

        {/* Feature Cards - Only show for non-authenticated users */}
        {!isAuthenticated && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-8 mb-16 animate-slide-up">
          {/* Card 1 - Purple */}
          <div className="group glass-card-hover px-10 py-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary-500 to-accent-500 scale-x-0 transition-transform duration-400 group-hover:scale-x-100"></div>
            <div className="text-[4rem] mb-6">🌌</div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Explore Your Past</h3>
            <p className="text-base text-gray-400 leading-relaxed m-0">
              Journey through your memories with powerful search and timeline features
            </p>
          </div>

          {/* Card 2 - Blue */}
          <div className="group glass-card-hover px-10 py-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-cyan-500 scale-x-0 transition-transform duration-400 group-hover:scale-x-100"></div>
            <div className="text-[4rem] mb-6">🤖</div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">AI-Powered Insights</h3>
            <p className="text-base text-gray-400 leading-relaxed m-0">
              Get intelligent suggestions and insights from your personal diary entries
            </p>
          </div>

          {/* Card 3 - Green */}
          <div className="group glass-card-hover px-10 py-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-green-500 to-emerald-500 scale-x-0 transition-transform duration-400 group-hover:scale-x-100"></div>
            <div className="text-[4rem] mb-6">🔒</div>
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Private & Secure</h3>
            <p className="text-base text-gray-400 leading-relaxed m-0">
              Your memories are encrypted and protected with enterprise-grade security
            </p>
          </div>
        </div>
        )}

        {/* Call to Action */}
        <div className="flex justify-center gap-6 flex-wrap mb-12 animate-fade-in-delayed">
          {isAuthenticated ? (
            // Show for authenticated users
            <div className="flex flex-col gap-4 items-center">
              <Link to="/writings" className="group inline-flex items-center gap-3 px-14 py-4 text-lg font-semibold rounded-full no-underline transition-all duration-300 relative overflow-hidden min-w-[250px] justify-center bg-gradient-to-r from-primary-600 to-primary-500 text-white border-none hover:shadow-lg hover:shadow-primary-500/50 hover:scale-105 glow-primary">
                <span>✍️</span>
                <span>Start Writing</span>
                <span className="text-[1.3rem] transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
              <Link to="/memories" className="group inline-flex items-center gap-3 px-14 py-4 text-lg font-semibold rounded-full no-underline transition-all duration-300 relative overflow-hidden min-w-[250px] justify-center bg-white/10 text-white border-2 border-white/20 backdrop-blur-sm hover:bg-white/20 hover:border-white/30 hover:scale-105">
                <span>📖</span>
                <span>Revisit Your Memories</span>
                <span className="text-[1.3rem] transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
            </div>
          ) : (
            // Show for non-authenticated users
            <>
              <Link to="/signin" className="group inline-flex items-center gap-3 px-14 py-4 text-lg font-semibold rounded-full no-underline transition-all duration-300 relative overflow-hidden min-w-[250px] justify-center bg-gradient-to-r from-primary-600 to-primary-500 text-white border-none hover:shadow-lg hover:shadow-primary-500/50 hover:scale-105 glow-primary">
                <span>Sign In</span>
                <span className="text-[1.3rem] transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
              <Link to="/signup" className="group inline-flex items-center gap-3 px-14 py-4 text-lg font-semibold rounded-full no-underline transition-all duration-300 relative overflow-hidden min-w-[250px] justify-center bg-white/10 text-white border-2 border-white/20 backdrop-blur-sm hover:bg-white/20 hover:border-white/30 hover:scale-105">
                <span>Create an Account</span>
                <span className="text-[1.3rem] transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-lg font-medium m-0">
            Powered by AI ✨
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home
