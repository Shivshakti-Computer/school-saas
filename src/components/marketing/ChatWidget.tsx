'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type SessionUserRole =
  | 'admin'
  | 'teacher'
  | 'staff'
  | 'student'
  | 'parent'
  | 'superadmin'
  | 'guest'

interface QuickReply {
  text: string
  action?: 'navigate' | 'forward' | 'send_message'
  payload?: string
}

interface Message {
  id: string
  role: 'user' | 'bot'
  content: string
  quickReplies?: QuickReply[]
  canForward?: boolean
  timestamp: Date
  source?: string
}

// ══════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════

const SUGGESTIONS = [
  'Got a question? Ask away! 🙏',
  'Plans & Pricing →',
  '60-Day Free Trial! 🎁',
  'Need setup help? →',
  'Book a Demo! 📞',
  'See all Features →',
]

const THANKS_PATTERNS = [
  'thanks', 'thank you', 'thankyou', 'thank you so much',
  'that helped', 'got it', 'understood', 'makes sense',
  'perfect', 'great', 'awesome', 'wonderful', 'helpful',
  'appreciate it', 'cheers', 'nice', 'cool', 'okay thanks',
]

const THANKS_REPLIES = [
  `🙏 **You're welcome!**\n\nI'm always here if you have more questions.\n\n**Is there anything else I can help with?**`,
  `😊 **Glad I could help!**\n\nFeel free to reach out anytime.\n\n**Skolify is here for your school! 🏫**`,
  `👍 **Happy to help!**\n\nCome back if you need anything!\n\n**Anything else on your mind?**`,
]

// ✨ Minimal Animations
const GLOBAL_STYLES = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

// ══════════════════════════════════════════════
// Welcome Messages
// ══════════════════════════════════════════════

function getWelcomeMessage(role: SessionUserRole): Message {
  const base = {
    id: 'welcome',
    role: 'bot' as const,
    timestamp: new Date(),
    source: 'welcome',
  }

  const content: Record<SessionUserRole, { content: string; quickReplies: QuickReply[] }> = {
    guest: {
      content: `**Hey there! I'm the Skolify Assistant 👋**\n\nI'm here to help you explore Skolify.\n\n**What I can help with:**\n\n• 💰 Plans & Pricing\n• 🎁 60-Day Free Trial\n• 📦 Features & Modules\n• 💳 Credits & Messaging\n• 🔧 Setup Help\n\nWhat would you like to know?`,
      quickReplies: [
        { text: '💰 See Plans', payload: 'pricing plans' },
        { text: '🎁 Free Trial', payload: 'free trial info' },
        { text: '📦 Features', payload: 'what features do you offer' },
        { text: '📞 Talk to Us', action: 'forward' },
      ],
    },
    admin: {
      content: `**Welcome back! 👋**\n\nHow can I help you today?\n\n• 💳 Credits & billing\n• ⬆️ Upgrade plan\n• 👥 Manage users\n• 🔧 Setup help`,
      quickReplies: [
        { text: '💳 Buy Credits', payload: 'how to buy credits' },
        { text: '⬆️ Upgrade', payload: 'upgrade plan' },
        { text: '🚀 Setup', payload: 'how to setup skolify' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    teacher: {
      content: `**Hello! 👋**\n\nWhat can I help with?\n\n• ✔ Attendance\n• 📝 Exam marks\n• 📚 Homework\n• 📊 Reports`,
      quickReplies: [
        { text: '✔ Attendance', payload: 'how to mark attendance' },
        { text: '📝 Marks', payload: 'how to enter exam marks' },
        { text: '📚 Homework', payload: 'how to assign homework' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    staff: {
      content: `**Hello! 👋**\n\nHow can I assist you?\n\n• ✔ Attendance\n• 📊 Reports\n• 🔧 Settings`,
      quickReplies: [
        { text: '✔ Attendance', payload: 'how to mark attendance' },
        { text: '📊 Reports', payload: 'how to view reports' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    student: {
      content: `**Hey! 👋**\n\nWhat would you like to check?\n\n• ✔ Attendance\n• 📊 Results\n• 📝 Assignments\n• 💰 Fees`,
      quickReplies: [
        { text: '✔ Attendance', payload: 'check my attendance' },
        { text: '📊 Results', payload: 'check my exam results' },
        { text: '💰 Fees', payload: 'check fee status' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    parent: {
      content: `**Hello! 👋**\n\nWhat would you like to know?\n\n• ✔ Attendance\n• 💰 Fee payment\n• 📊 Results\n• 📚 Homework`,
      quickReplies: [
        { text: '✔ Attendance', payload: 'check child attendance' },
        { text: '💰 Pay Fees', payload: 'how to pay fees' },
        { text: '📊 Results', payload: 'check exam results' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    superadmin: {
      content: `**Welcome, Super Admin! 👋**\n\nFull platform access.\n\n**What would you like to do?**`,
      quickReplies: [
        { text: '📊 Overview', payload: 'platform overview' },
        { text: '🏫 Schools', payload: 'manage schools' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
  }

  return { ...base, ...content[role] }
}

// ══════════════════════════════════════════════
// Icons — Minimal
// ══════════════════════════════════════════════

function IconClose({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}

function IconBot({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 16h.01M16 16h.01" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconSparkles() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7l2-7z" />
    </svg>
  )
}

// ══════════════════════════════════════════════
// Launcher Bubble — Minimal
// ══════════════════════════════════════════════

function LauncherBubble({ onOpen, visible }: { onOpen: () => void; visible: boolean }) {
  const [suggIdx, setSuggIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!visible || dismissed) return
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setSuggIdx(i => (i + 1) % SUGGESTIONS.length)
        setFade(true)
      }, 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [visible, dismissed])

  if (!visible || dismissed) return null

  return (
    <div
      className="fixed bottom-[92px] right-4 z-[9998] flex items-end gap-2"
      style={{ animation: 'slideUp 0.3s ease-out forwards' }}
    >
      <div className="relative max-w-[200px] cursor-pointer" onClick={onOpen}>
        <div className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-blue-600"><IconSparkles /></span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
              Skolify AI
            </span>
          </div>

          <p
            className="text-xs font-medium text-slate-900 leading-snug transition-all duration-200"
            style={{ opacity: fade ? 1 : 0 }}
          >
            {SUGGESTIONS[suggIdx]}
          </p>

          <div className="flex gap-1 mt-1.5">
            {SUGGESTIONS.map((_, i) => (
              <span
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === suggIdx ? '12px' : '4px',
                  height: '4px',
                  background: i === suggIdx ? '#2563EB' : '#CBD5E1',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); setDismissed(true) }}
        className="w-5 h-5 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
        aria-label="Dismiss"
      >
        <IconClose size={10} />
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════
// Markdown Renderer — Clean
// ══════════════════════════════════════════════

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900 font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-700 italic">$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-blue-600 underline hover:text-blue-700 transition-colors" target="_blank">$1</a>')
    .replace(/`(.*?)`/g,
      '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">$1</code>')
}

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-slate-700">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />

        if (line.startsWith('## ')) {
          return (
            <p key={idx} className="font-bold text-sm text-slate-900 mt-2 mb-1 pb-1 border-b border-slate-100">
              {line.replace('## ', '')}
            </p>
          )
        }

        if (line.startsWith('### ')) {
          return (
            <p key={idx} className="font-semibold text-[11px] text-slate-600 mt-2 uppercase tracking-wide">
              {line.replace('### ', '')}
            </p>
          )
        }

        if (line.trim().match(/^\|?[-:\s|]+\|?$/)) return null

        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0)
          if (cells.length === 0) return null

          const isHeader = idx < lines.length - 1 &&
            lines[idx + 1]?.trim().match(/^\|?[-:\s|]+\|?$/)

          return (
            <div key={idx} className="flex gap-1 text-[10px] flex-wrap">
              {cells.map((cell, i) => (
                <span key={i}
                  className={`flex-1 min-w-[40px] px-2 py-1 rounded text-center border ${
                    isHeader
                      ? 'bg-blue-50 text-blue-900 font-bold border-blue-200'
                      : i === 0
                        ? 'bg-slate-50 text-slate-800 font-medium border-slate-200'
                        : 'bg-white text-slate-700 border-slate-200'
                  }`}>
                  {cell.replace(/\*\*/g, '')}
                </span>
              ))}
            </div>
          )
        }

        if (line.trim().match(/^[•*\-]\s/)) {
          const content = line.replace(/^[•*\-]\s+/, '')
          return (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
            </div>
          )
        }

        if (line.trim().match(/^\d+\./)) {
          const content = line.replace(/^\d+\.\s*/, '')
          const num = line.match(/^(\d+)\./)?.[1]
          return (
            <div key={idx} className="flex gap-2 items-start">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center mt-0.5">
                {num}
              </span>
              <span dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
            </div>
          )
        }

        return <p key={idx} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      })}
    </div>
  )
}

// ══════════════════════════════════════════════
// Timestamp
// ══════════════════════════════════════════════

function TimeStamp({ date }: { date: Date }) {
  const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return <span className="text-[9px] text-slate-400">{time}</span>
}

// ══════════════════════════════════════════════
// Typing Indicator — Minimal
// ══════════════════════════════════════════════

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 text-white">
        <IconBot />
      </div>
      <div className="rounded-xl bg-white border border-slate-200 px-3 py-2 flex gap-1 items-center">
        <span className="text-[10px] text-slate-500 mr-1">Typing</span>
        {[0, 1, 2].map(i => (
          <div key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-500"
            style={{ animation: `pulse 1s ease-in-out ${i * 0.15}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// Forward Form — Clean
// ══════════════════════════════════════════════

function ForwardForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { name: string; phone: string; query: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [query, setQuery] = useState('')

  return (
    <div className="rounded-xl overflow-hidden bg-blue-50 border border-blue-200">
      <div className="px-4 py-2.5 bg-blue-600 flex items-center gap-2">
        <span className="text-white">💬</span>
        <p className="text-white font-semibold text-sm">Talk to our team</p>
      </div>
      <div className="p-4 space-y-2.5">
        <input
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          placeholder="Your name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          placeholder="WhatsApp Number *"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        <textarea
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none transition-all"
          rows={3}
          placeholder="Your question *"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-sm rounded-lg font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!phone.trim() || !query.trim()) {
                alert('Please provide your WhatsApp number and question')
                return
              }
              onSubmit({ name, phone, query })
            }}
            className="flex-1 py-2 text-sm rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            Send →
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// Main ChatWidget — Ultra Minimal
// ══════════════════════════════════════════════

export function ChatWidget() {
  const { data: session } = useSession()

  const userRole = (session?.user?.role as SessionUserRole) || 'guest'
  const tenantId = (session?.user as any)?.tenantId || null

  const [isOpen, setIsOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [unreadCount, setUnreadCount] = useState(1)
  const [messages, setMessages] = useState<Message[]>(() => [getWelcomeMessage(userRole)])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForwardForm, setShowForwardForm] = useState(false)
  const [forwarded, setForwarded] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages([getWelcomeMessage(userRole)])
  }, [userRole])

  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setShowBubble(false)
      setUnreadCount(0)
    }
  }, [isOpen])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen, messages, scrollToBottom])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages(prev => [...prev, {
      id: `user_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }])
    setInput('')
    setLoading(true)
    setShowForwardForm(false)

    const msgLower = trimmed.toLowerCase()
    const isThanks = THANKS_PATTERNS.some(p => msgLower.includes(p))

    if (isThanks) {
      const reply = THANKS_REPLIES[Math.floor(Math.random() * THANKS_REPLIES.length)]
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `bot_${Date.now()}`,
          role: 'bot',
          content: reply,
          quickReplies: [
            { text: '💰 Plans', payload: 'pricing plans' },
            { text: '📦 Features', payload: 'what features do you offer' },
            { text: '📞 Support', action: 'forward' },
          ],
          timestamp: new Date(),
          source: 'local',
        }])
        setLoading(false)
      }, 500)
      return
    }

    const endpoint = (() => {
      if (userRole === 'superadmin') return '/api/chat/superadmin'
      if (userRole !== 'guest' && tenantId) return '/api/chat/portal'
      return '/api/chat'
    })()

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: conversationId,
          tenant_id: tenantId,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()

      if (data.success) {
        if (data.conversation_id) setConversationId(data.conversation_id)

        setMessages(prev => [...prev, {
          id: `bot_${Date.now()}`,
          role: 'bot',
          content: data.response,
          quickReplies: data.quickReplies ?? [],
          canForward: data.canForward ?? false,
          timestamp: new Date(),
          source: data.source,
        }])
      } else {
        throw new Error(data.error || 'Unknown error')
      }

    } catch (err) {
      console.error('[ChatWidget] Error:', err)
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'bot',
        content: '😔 **Sorry!** Something went wrong.\n\nPlease try again or contact support.',
        canForward: true,
        timestamp: new Date(),
        source: 'error',
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, conversationId, tenantId, userRole])

  const handleQuickReply = useCallback((qr: QuickReply) => {
    if (qr.action === 'navigate' && qr.payload) {
      window.location.href = qr.payload
    } else if (qr.action === 'forward') {
      setShowForwardForm(true)
      scrollToBottom()
    } else {
      sendMessage(qr.payload || qr.text)
    }
  }, [sendMessage, scrollToBottom])

  const handleForwardSubmit = useCallback(async (data: {
    name: string; phone: string; query: string
  }) => {
    try {
      await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name || 'Chat User',
          phone: data.phone,
          subject: 'Chatbot Forward',
          message: data.query,
          source: 'chatbot_forward',
        }),
      })
      setForwarded(true)
      setShowForwardForm(false)
      setMessages(prev => [...prev, {
        id: `fwd_${Date.now()}`,
        role: 'bot',
        content: '✔ **Message sent!**\n\nOur team will reach out on WhatsApp within 2–4 hours.\n\nThank you! 🙏',
        timestamp: new Date(),
        source: 'system',
      }])
    } catch {
      alert('Error occurred. Please try again.')
    }
  }, [])

  const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <LauncherBubble visible={showBubble && !isOpen} onOpen={() => setIsOpen(true)} />

      {isOpen && (
        <div
          className="fixed bottom-[84px] right-4 z-[9999] w-[min(400px,calc(100vw-2rem))] flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-200"
          style={{
            height: 'min(600px, calc(100vh - 110px))',
            animation: 'slideUp 0.3s ease-out forwards',
          }}
        >
          {/* Header — Minimal */}
          <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 bg-blue-600 border-b border-blue-700">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <IconBot />
            </div>

            <div className="flex-1 min-w-0">
              <p className="" style={{color: 'white'}}>Skolify Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <p className="text-[10px]" style={{color: 'white'}}>Online</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white transition-colors"
              aria-label="Close"
            >
              <IconClose />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'items-end'}`}>
                  {msg.role === 'bot' ? (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 text-white flex-shrink-0 self-end">
                      <IconBot />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-400 text-white flex-shrink-0 self-end">
                      <IconUser />
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    style={{ maxWidth: '80%' }}>
                    <div
                      className={msg.role === 'user'
                        ? 'rounded-xl rounded-br-sm px-3.5 py-2.5 bg-blue-600 text-white'
                        : 'rounded-xl rounded-bl-sm px-3.5 py-2.5 bg-white border border-slate-200'}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm leading-relaxed font-medium" style={{color: 'white'}}>{msg.content}</p>
                      ) : (
                        <MarkdownRenderer text={msg.content} />
                      )}
                    </div>

                    {msg.role === 'bot' && msg.source?.includes('ai') && (
                      <span className="text-[8px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase tracking-wide">
                        ✨ AI
                      </span>
                    )}

                    <TimeStamp date={msg.timestamp} />
                  </div>
                </div>

                {msg.role === 'bot' && idx === messages.length - 1 && (
                  <div className="mt-2.5 ml-9 space-y-2">
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.quickReplies.map(qr => (
                          <button
                            key={qr.text}
                            onClick={() => handleQuickReply(qr)}
                            className="text-xs px-3 py-1.5 rounded-full font-medium bg-white border border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            {qr.text}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.canForward && !forwarded && (
                      <button
                        onClick={() => setShowForwardForm(p => !p)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                      >
                        💬 Talk to real person
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {showForwardForm && (
              <div className="ml-9">
                <ForwardForm onSubmit={handleForwardSubmit} onCancel={() => setShowForwardForm(false)} />
              </div>
            )}

            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input — Clean */}
          <div className="flex-shrink-0 px-4 py-3 flex gap-2 items-center bg-white border-t border-slate-200">
            <input
              ref={inputRef}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Send"
            >
              <IconSend />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button — Minimal */}
      <div className="fixed bottom-4 right-4 z-[9999]">
        <button
          onClick={() => setIsOpen(p => !p)}
          className="relative w-14 h-14 rounded-2xl text-white flex items-center justify-center border-2 border-white hover:scale-105 transition-transform"
          style={{
            background: isOpen ? '#475569' : '#2563EB',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          }}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? (
            <IconClose size={20} />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
            </svg>
          )}
        </button>

        {!isOpen && unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-red-500 border-2 border-white"
            style={{ animation: 'slideUp 0.3s ease-out forwards' }}
          >
            {unreadCount}
          </span>
        )}
      </div>
    </>
  )
}