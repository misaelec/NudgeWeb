'use client'

import { useState, useRef, useEffect, useMemo, FormEvent } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { useAuth } from '@/components/Providers'
import { MessageCircle, Send, X, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface MessagePart {
  type: string
  text?: string
  state?: string
  output?: any
  toolInvocation?: { result?: any }
}

interface CalendarOption {
  id: string
  name: string
  provider: string
  color?: string
}

function ChatPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const tc = useTranslations('chat')
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        headers: {
          'x-user-id': userId,
          'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    [userId]
  )

  const { messages, sendMessage, status, error } = useChat({ transport })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[520px] bg-surface-primary border border-border-primary rounded-apple-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary">
        <h3 className="text-text-primary font-semibold text-sm">{tc('title')}</h3>
        <button
          onClick={onClose}
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-text-tertiary text-sm text-center mt-8">
            {tc('empty')}
          </p>
        )}
        {messages.map((msg, msgIndex) => {
          const parts = msg.parts as MessagePart[]
          const textContent = parts
            .filter((p) => p.type === 'text' && p.text)
            .map((p) => p.text)
            .join('')
          const hasToolPending = parts.some(
            (p) => p.type.startsWith('tool-') && p.state !== 'output-available'
          )

          // Show calendar picker only on the last message (disappears once user picks)
          const isLastMessage = msgIndex === messages.length - 1
          const calendarSelectPart = isLastMessage ? parts.find((p) => {
            if (!p.type.startsWith('tool-') || p.state !== 'output-available') return false
            const result = p.output ?? p.toolInvocation?.result
            return result?.action === 'select_calendar'
          }) : undefined
          const calendarSelectData = calendarSelectPart
            ? (calendarSelectPart.output ?? calendarSelectPart.toolInvocation?.result)
            : null

          return (
            <div key={msg.id}>
              {textContent && (
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-apple-lg text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-accent-primary text-white'
                        : 'bg-surface-secondary text-text-primary'
                    }`}
                  >
                    {textContent}
                  </div>
                </div>
              )}
              {hasToolPending && (
                <div className="flex justify-start mt-1">
                  <div className="bg-surface-secondary text-text-tertiary px-3 py-2 rounded-apple-lg text-sm flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                    Consultando calendario...
                  </div>
                </div>
              )}
              {calendarSelectData && !isLoading && (
                <div className="flex justify-start mt-2">
                  <div className="bg-surface-secondary rounded-apple-lg px-3 py-2 max-w-[80%]">
                    <p className="text-xs text-text-tertiary mb-2">{tc('chooseCalendar')}</p>
                    <div className="flex flex-col gap-1.5">
                      {(calendarSelectData.calendars as CalendarOption[]).map((cal) => (
                        <button
                          key={cal.id}
                          onClick={() =>
                            sendMessage({ text: `Calendar selected: ${cal.name} (id: ${cal.id})` })
                          }
                          className="flex items-center gap-2 text-left px-3 py-2 rounded-apple-lg bg-surface-primary hover:bg-accent-primary/10 transition-colors text-sm text-text-primary border border-border-primary"
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cal.color ?? '#6366f1' }}
                          />
                          {cal.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-surface-secondary px-3 py-3 rounded-apple-lg flex items-center gap-1">
              <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-apple-lg text-sm">
              Error: {error.message || 'Something went wrong. Try again.'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 border-t border-border-primary"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tc('placeholder')}
          className="flex-1 bg-surface-secondary text-text-primary placeholder-text-tertiary text-sm px-3 py-2 rounded-apple-lg border border-border-primary outline-none focus:ring-1 focus:ring-accent-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="text-accent-primary disabled:opacity-40 transition-opacity"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}

export default function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  if (!user) return null

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-primary text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && <ChatPanel userId={user.id} onClose={() => setIsOpen(false)} />}
    </>
  )
}
