'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
}

export default function TestNavioPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      console.log('📤 Sending message:', input)
      const response = await fetch('/api/test-navio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      console.log('📥 Response received, reading stream...')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      let fullContent = ''
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
      }
      setMessages((prev) => [...prev, assistantMessage])

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log('✅ Stream complete')
          break
        }

        const chunk = decoder.decode(value)
        fullContent += chunk
        setMessages((prev) => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg && lastMsg.role === 'assistant') {
            updated[updated.length - 1] = {
              ...lastMsg,
              content: fullContent,
            }
          }
          return updated
        })
      }
    } catch (error) {
      console.error('❌ Error:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: `❌ Error: ${errorMsg}`,
          role: 'assistant',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-t-lg shadow-lg p-6 border-b-4 border-blue-500">
          <h1 className="text-3xl font-bold text-blue-600">🧪 Test Navio Chat</h1>
          <p className="text-gray-600 mt-2">Simple API test to verify Mistral connectivity</p>
        </div>

        {/* Messages */}
        <Card className="flex-1 overflow-y-auto p-6 rounded-none bg-white space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <p className="text-2xl text-gray-400">💬</p>
                <p className="text-gray-500 mt-2">Start a conversation to test Navio AI</p>
                <p className="text-sm text-gray-400 mt-1">Try asking a question about CXC subjects</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Navio is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </Card>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-b-lg shadow-lg p-4 border-t border-gray-200 space-y-3"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Navio anything... (e.g., 'Explain photosynthesis')"
              disabled={isLoading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            Testing connection to Mistral API (mistral-small-2503)
          </div>
        </form>
      </div>
    </div>
  )
}
