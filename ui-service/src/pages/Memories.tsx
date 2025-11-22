import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/auth.service'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const Memories: React.FC = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/signin')
      return
    }

    // Add welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I can help you explore your memories. Ask me anything about what you\'ve written, and I\'ll do my best to help you remember and reflect.',
        timestamp: new Date()
      }
    ])
  }, [navigate])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // TODO: Replace with actual API call to your backend
      // const response = await fetch('/api/memories/chat', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      //   },
      //   body: JSON.stringify({ message: inputMessage.trim() })
      // })
      // const data = await response.json()

      // Simulated response for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a placeholder response. Your backend should process the question and search through your memories to provide relevant answers.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Cosmic background */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900/30 via-dark-bg to-accent-900/30"></div>
      
      {/* Animated stars/particles */}
      <div className="fixed inset-0">
        <div className="absolute top-20 right-40 w-2 h-2 bg-white rounded-full opacity-70 animate-pulse"></div>
        <div className="absolute top-1/4 left-32 w-1 h-1 bg-primary-300 rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-1.5 h-1.5 bg-accent-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1.1s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full opacity-80 animate-pulse" style={{ animationDelay: '1.7s' }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-primary-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '2.2s' }}></div>
      </div>

      {/* Floating orbs */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col relative z-10">
        {/* Header */}
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                💭 Memory Assistant
              </h1>
              <p className="text-gray-400">
                Ask me anything about your memories
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[75%] rounded-3xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-xl glow-primary'
                      : 'bg-dark-card text-white shadow-lg border border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {message.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-2 opacity-80">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </p>
                      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-2.5 ${
                        message.role === 'user' ? 'text-white/60' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[75%] rounded-3xl px-6 py-4 bg-dark-card text-white shadow-lg border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">🤖</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-2 opacity-80">Assistant</p>
                      <div className="flex gap-2">
                        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="p-6 bg-gradient-to-t from-white/10 to-transparent border-t border-white/10">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me about your memories..."
                className="input-dark flex-1"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="btn-primary"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                ) : (
                  '✈️ Send'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer Note */}
        <div className="glass-card p-4 text-center mt-4">
          <p className="text-gray-400 text-sm">
            💡 Tip: Try asking "What did I write about last week?" or "Find my happiest memories"
          </p>
        </div>
      </div>
    </div>
  )
}

export default Memories
