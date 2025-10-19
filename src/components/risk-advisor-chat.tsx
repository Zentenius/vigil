'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { AlertCircle, Paperclip, Mic, CornerDownLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '~/components/chat-bubble'
import { ChatInput } from '~/components/chat-input'
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from '~/components/expandable-chat'

interface Message {
  id: number
  content: string
  sender: 'ai' | 'user'
}

export function RiskAdvisorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: 'Hello! I\'m Vigil\'s Risk Advisor. I can help you analyze active hazards in Jamaica and provide actionable safety recommendations. What would you like to know?',
      sender: 'ai',
    },
  ])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        content: input,
        sender: 'user',
      },
    ])

    const userInput = input
    setInput('')
    setIsLoading(true)

    try {
      console.log('📤 Sending message:', userInput)
      const response = await fetch('/api/risk-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.sender === 'ai' ? 'assistant' : 'user',
              content: m.content,
            })),
            { role: 'user', content: userInput },
          ],
        }),
      })

      if (!response.ok) {
        console.error('Response error:', response.status, response.statusText)
        throw new Error(`Failed to get response: ${response.statusText}`)
      }

      console.log('📥 Response received, reading stream...')
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      let fullContent = ''
      const assistantMessageId = messages.length + 2

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          content: '',
          sender: 'ai',
        },
      ])

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
          if (lastMsg?.sender === 'ai') {
            updated[updated.length - 1] = {
              id: lastMsg.id,
              content: fullContent,
              sender: 'ai',
            }
          }
          return updated
        })
      }
    } catch (error) {
      console.error('❌ Chat error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          content: `⚠️ Error: ${errorMsg}. Please try again.`,
          sender: 'ai',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttachFile = () => {
    console.log('Attach file clicked')
  }

  const handleMicrophoneClick = () => {
    console.log('Microphone clicked')
  }

  return (
    <ExpandableChat
      size="lg"
      position="bottom-right"
      icon={<AlertCircle className="h-6 w-6" />}
      className='rounded-full'
    >
      <ExpandableChatHeader className="flex-col text-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white">
        <h1 className="text-lg font-semibold">Vigil Risk Advisor</h1>
        <p className="text-sm text-red-100">Real-time hazard analysis & community safety guidance</p>
      </ExpandableChatHeader>

      <ExpandableChatBody className="bg-background/15 p-5">
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              variant={message.sender === 'user' ? 'sent' : 'received'}
            >
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src={
                  message.sender === 'user'
                    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop'
                    : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop'
                }
                fallback={message.sender === 'user' ? 'You' : 'RA'}
              />
              <ChatBubbleMessage
                variant={message.sender === 'user' ? 'sent' : 'received'}
              >
                {message.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                fallback="RA"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </div>
      </ExpandableChatBody>

      <ExpandableChatFooter>
        <form
          onSubmit={handleSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={input}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            placeholder="Ask about active hazards, safety recommendations, trends..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleAttachFile}
              >
                <Paperclip className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleMicrophoneClick}
              >
                <Mic className="size-4" />
              </Button>
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="sm"
              className="ml-auto gap-1.5"
            >
              Send
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  )
}
