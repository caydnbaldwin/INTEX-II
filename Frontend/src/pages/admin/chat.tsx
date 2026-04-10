import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChatMessageRenderer } from '@/components/AiChat'
import { fetchApi } from '@/lib/api'

const STORAGE_KEY = 'lunas_chat_history'

interface RecordReference {
  type: string
  id: number
  label: string
  route: string
}

interface ChatResponse {
  answer: string
  references: RecordReference[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  references: RecordReference[]
}

const SUGGESTED_QUESTIONS = [
  'Which residents are most at risk?',
  'Which donors are at risk of churning?',
  'Show unresolved incidents',
  'Which safehouses are near capacity?',
]

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Message[]) : []
  } catch {
    return []
  }
}

export function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>(loadHistory)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Persist history whenever messages change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function clearHistory() {
    sessionStorage.removeItem(STORAGE_KEY)
    setMessages([])
  }

  async function handleSubmit(question: string) {
    const q = question.trim()
    if (!q || isLoading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: q, references: [] }])
    setIsLoading(true)

    try {
      const data = await fetchApi<ChatResponse>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ question: q }),
      })
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, references: data.references },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          references: [],
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AI Assistant</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ask questions about residents, donors, incidents, or safehouses.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory} className="text-muted-foreground hover:text-foreground gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      <Card className="flex flex-col flex-1 overflow-hidden p-0">
        {/* Message list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">How can I help you today?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try one of the suggested questions below.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSubmit(q)}
                    className="text-left text-sm px-3 py-2 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 rounded-full bg-primary/10 p-1.5 h-8 w-8 flex items-center justify-center mt-0.5">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ChatMessageRenderer text={msg.content} references={msg.references} />
                ) : (
                  msg.content
                )}
              </div>

              {msg.role === 'user' && (
                <div className="flex-shrink-0 rounded-full bg-secondary p-1.5 h-8 w-8 flex items-center justify-center mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 rounded-full bg-primary/10 p-1.5 h-8 w-8 flex items-center justify-center mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-border p-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit(input)
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={isLoading}
              className="flex-1"
              aria-label="Chat input"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
