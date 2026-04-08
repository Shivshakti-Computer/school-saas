'use client'

// FILE: src/components/chat/ChatWidget.tsx

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation' // ✅ Add this

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
  'ok thanks', 'ok thank you', 'alright', 'sounds good',
]

const THANKS_REPLIES = [
  `🙏 **You're welcome!**\n\nI'm always here if you have more questions. Feel free to ask anytime!\n\n**Is there anything else I can help with?**`,
  `😊 **Glad I could help!**\n\nDon't hesitate to reach out if you need anything else.\n\n**Skolify is here for your school! 🏫**`,
  `👍 **Happy to help!**\n\nHave a great day — and feel free to come back if you need anything!\n\n**Anything else on your mind?**`,
]

const GLOBAL_STYLES = `
  @keyframes slideUpFade {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes chatOpen {
    from { opacity: 0; transform: translateY(24px) scale(0.92); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
    50%      { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
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
      content: `**Hey there! I'm the Skolify Assistant 👋**\n\nI'm here to help you explore everything Skolify has to offer for your school.\n\n**Here's what I can help with:**\n\n• 💰 Plans & Pricing\n• 🎁 60-Day Free Trial\n• 📦 22+ Features & Modules\n• 💳 Credits & Messaging\n• 🔧 Setup & Onboarding\n\nWhat would you like to know? Just ask!`,
      quickReplies: [
        { text: '💰 See Plans', payload: 'pricing plans' },
        { text: '🎁 Free Trial', payload: 'free trial info' },
        { text: '📦 Features', payload: 'what features do you offer' },
        { text: '📞 Talk to Us', action: 'forward' },
      ],
    },
    admin: {
      content: `**Welcome back! 👋**\n\nGood to see you in the Skolify Admin Portal.\n\n**How can I help you today?**\n\n• 💳 Credits & billing\n• ⬆️ Upgrade your plan\n• 👥 Manage students & teachers\n• 🔧 Setup & configuration`,
      quickReplies: [
        { text: '💳 Buy Credits', payload: 'how to buy credits' },
        { text: '⬆️ Upgrade Plan', payload: 'upgrade plan' },
        { text: '🚀 Setup Guide', payload: 'how to setup skolify' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    teacher: {
      content: `**Hello! 👋**\n\nWelcome to your Teacher Portal.\n\n**What can I help you with today?**\n\n• ✔ Mark attendance\n• 📝 Enter exam marks\n• 📚 Assign homework\n• 📊 View reports`,
      quickReplies: [
        { text: '✔ Attendance', payload: 'how to mark attendance' },
        { text: '📝 Enter Marks', payload: 'how to enter exam marks' },
        { text: '📚 Homework', payload: 'how to assign homework' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    staff: {
      content: `**Hello! 👋**\n\nWelcome to the Staff Portal.\n\n**What can I help you with today?**\n\n• ✔ Attendance\n• 📊 Reports\n• 🔧 Settings`,
      quickReplies: [
        { text: '✔ Attendance', payload: 'how to mark attendance' },
        { text: '📊 Reports', payload: 'how to view reports' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    student: {
      content: `**Hey! 👋**\n\nWelcome to your Student Portal.\n\n**What would you like to check?**\n\n• ✔ Attendance record\n• 📊 Exam results\n• 📝 Assignments\n• 💰 Fee status`,
      quickReplies: [
        { text: '✔ My Attendance', payload: 'check my attendance' },
        { text: '📊 My Results', payload: 'check my exam results' },
        { text: '💰 Fee Status', payload: 'check fee status' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    parent: {
      content: `**Hello! 👋**\n\nWelcome to the Parent Portal.\n\n**What would you like to know about your child?**\n\n• ✔ Attendance record\n• 💰 Fee payment\n• 📊 Exam results\n• 📚 Homework status`,
      quickReplies: [
        { text: '✔ Attendance', payload: 'check child attendance' },
        { text: '💰 Pay Fees', payload: 'how to pay fees' },
        { text: '📊 Results', payload: 'check exam results' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    superadmin: {
      content: `**Welcome, Super Admin! 👋**\n\nYou have full access to the Skolify platform.\n\n**What would you like to do?**`,
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
// Icons
// ══════════════════════════════════════════════

function IconClose({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

function IconBot({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="15" x2="8" y2="15.01" strokeWidth="3" />
      <line x1="16" y1="15" x2="16" y2="15.01" strokeWidth="3" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconForward() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5
        19.5 0 013.07 8.8 19.79 19.79 0 01-.001 .17A2 2 0 012 0h3a2 2 0 012
        1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0
        006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0
        0122 14.9v2z" />
    </svg>
  )
}

// ══════════════════════════════════════════════
// Launcher Bubble (Updated)
// ══════════════════════════════════════════════

function LauncherBubble({
  onOpen,
  visible,
  isLoggedIn, // ✅ New prop
}: {
  onOpen: () => void
  visible: boolean
  isLoggedIn: boolean // ✅ New prop
}) {
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
      }, 300)
    }, 3500)
    return () => clearInterval(interval)
  }, [visible, dismissed])

  // ✅ Portal/Dashboard me mat dikhao
  if (!visible || dismissed || isLoggedIn) return null

  return (
    <div
      className="fixed bottom-24 right-5 z-[9998] flex items-end gap-2.5"
      style={{ animation: 'slideUpFade 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}
    >
      <div className="relative max-w-[240px] cursor-pointer group" onClick={onOpen}>
        <div
          className="px-4 py-3.5 rounded-2xl rounded-br-sm transition-all duration-300 group-hover:shadow-xl"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Skolify AI
            </span>
          </div>

          <p
            className="text-[13.5px] font-semibold leading-snug text-slate-800 transition-all duration-300"
            style={{
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(6px)',
            }}
          >
            {SUGGESTIONS[suggIdx]}
          </p>
        </div>

        <svg
          className="absolute bottom-0 right-[-6px]"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <path d="M0 0 L12 12 L0 12 Z" fill="#FFFFFF" />
        </svg>
      </div>

      <button
        onClick={e => { e.stopPropagation(); setDismissed(true) }}
        className="mb-1.5 w-6 h-6 rounded-full flex items-center justify-center
        transition-all hover:bg-slate-200 active:scale-90"
        style={{ background: 'rgba(148,163,184,0.2)', color: '#64748B' }}
        aria-label="Dismiss"
      >
        <IconClose size={10} />
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════
// Markdown Renderer
// ══════════════════════════════════════════════

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-blue-500 underline hover:text-blue-600" target="_blank" rel="noopener">$1</a>')
    .replace(/`(.*?)`/g,
      '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono">$1</code>')
}

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-2 text-[14px] leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />

        if (line.startsWith('## ')) {
          return (
            <p key={idx} className="font-bold text-[15px] mt-2 mb-1">
              {line.replace('## ', '')}
            </p>
          )
        }

        if (line.startsWith('### ')) {
          return (
            <p key={idx} className="font-semibold text-[13px] opacity-70 mt-2">
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
            <div key={idx} className="flex gap-1.5 text-[11px]">
              {cells.map((cell, i) => (
                <span key={i}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-center ${isHeader
                      ? 'bg-blue-50 text-blue-900 font-bold'
                      : i === 0
                        ? 'bg-slate-50 font-semibold'
                        : 'bg-white'
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
              <span className="text-emerald-500 flex-shrink-0 font-bold mt-0.5">•</span>
              <span className="flex-1 opacity-90"
                dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
            </div>
          )
        }

        if (line.trim().match(/^\d+\./)) {
          const content = line.replace(/^\d+\.\s*/, '')
          const num = line.match(/^(\d+)\./)?.[1]
          return (
            <div key={idx} className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700
                text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {num}
              </span>
              <span className="flex-1 opacity-90"
                dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
            </div>
          )
        }

        return (
          <p key={idx} className="opacity-90"
            dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════
// Timestamp
// ══════════════════════════════════════════════

function TimeStamp({ date }: { date: Date }) {
  const time = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return (
    <span className="text-[10px] opacity-60 select-none font-medium">
      {time}
    </span>
  )
}

// ══════════════════════════════════════════════
// Typing Indicator
// ══════════════════════════════════════════════

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600
        flex items-center justify-center text-white flex-shrink-0 shadow-sm">
        <IconBot size={16} />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm
        border border-slate-100 flex gap-1 items-center">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
          />
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// Forward Form
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
    <div
      className="rounded-2xl overflow-hidden shadow-lg border border-slate-200"
      style={{ animation: 'scaleIn 0.3s ease' }}
    >
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3.5
        flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm
          flex items-center justify-center">
          💬
        </div>
        <div>
          <p className="text-white font-bold text-sm">Connect with our team</p>
          <p className="text-emerald-50 text-[11px] font-medium">We'll reply within 2-4 hours</p>
        </div>
      </div>

      <div className="bg-white p-4 space-y-3">
        <input
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200
          bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2
          focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400"
          placeholder="Your name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200
          bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2
          focus:ring-emerald-100 outline-none transition-all placeholder:text-slate-400"
          placeholder="WhatsApp Number *"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
        <textarea
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200
          bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-2
          focus:ring-emerald-100 outline-none transition-all resize-none placeholder:text-slate-400"
          rows={3}
          placeholder="Describe your question *"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm rounded-xl font-semibold
            bg-slate-100 text-slate-700 hover:bg-slate-200
            transition-all active:scale-95">
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
            className="flex-1 py-2.5 text-sm rounded-xl font-bold text-white
            bg-gradient-to-r from-emerald-500 to-emerald-600
            hover:from-emerald-600 hover:to-emerald-700
            transition-all active:scale-95 shadow-md">
            Send Message
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// Main ChatWidget (Updated)
// ══════════════════════════════════════════════

export function ChatWidget() {
  const { data: session } = useSession()
  const pathname = usePathname() // ✅ Current route

  const userRole = (session?.user?.role as SessionUserRole) || 'guest'
  const tenantId = (session?.user as any)?.tenantId || null

  // ✅ Check if user is logged in (portal/dashboard)
  const isLoggedIn = !!session?.user && userRole !== 'guest'

  // ✅ Portal routes detection
  const isPortalRoute = pathname?.startsWith('/dashboard') || 
                        pathname?.startsWith('/portal') ||
                        pathname?.startsWith('/admin') ||
                        pathname?.startsWith('/teacher') ||
                        pathname?.startsWith('/student') ||
                        pathname?.startsWith('/parent') ||
                        pathname?.startsWith('/superadmin')

  const [isOpen, setIsOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [unreadCount, setUnreadCount] = useState(1)
  const [messages, setMessages] = useState<Message[]>(() => [
    getWelcomeMessage(userRole),
  ])
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
    // ✅ Portal me bubble kabhi nahi dikhao
    if (isPortalRoute || isLoggedIn) {
      setShowBubble(false)
      return
    }
    
    // Public pages pe 3 seconds baad dikhao
    const timer = setTimeout(() => setShowBubble(true), 3000)
    return () => clearTimeout(timer)
  }, [isPortalRoute, isLoggedIn])

  useEffect(() => {
    if (isOpen) {
      setShowBubble(false)
      setUnreadCount(0)
    }
  }, [isOpen])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
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
            { text: '💰 View Plans', payload: 'pricing plans' },
            { text: '📦 Features', payload: 'what features do you offer' },
            { text: '📞 Support', action: 'forward' },
          ],
          canForward: false,
          timestamp: new Date(),
          source: 'local',
        }])
        setLoading(false)
      }, 800)
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
        if (data.conversation_id) {
          setConversationId(data.conversation_id)
        }

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
        content: '😔 **Sorry about that!** Something went wrong.\n\nPlease try again, or reach out to our support team.',
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
        content: '✅ **Message sent successfully!**\n\nOur team will reach out on WhatsApp within **2–4 hours**.\n\nThank you! 🙏',
        timestamp: new Date(),
        source: 'system',
      }])
    } catch {
      alert('An error occurred. Please try again.')
    }
  }, [])

  const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      {/* ✅ Bubble sirf public pages pe dikhega */}
      <LauncherBubble
        visible={showBubble && !isOpen}
        onOpen={() => setIsOpen(true)}
        isLoggedIn={isLoggedIn}
      />

      {isOpen && (
        <div
          className="fixed bottom-20 right-5 z-[9999]
          w-[min(400px,calc(100vw-2.5rem))] flex flex-col rounded-3xl overflow-hidden"
          style={{
            height: 'min(600px, calc(100vh - 120px))',
            background: '#FFFFFF',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
            animation: 'chatOpen 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          {/* Header */}
          <div
            className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5"
            style={{
              background: 'linear-gradient(135deg, #00A884 0%, #008f6f 100%)',
            }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm
              flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <IconBot size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-[15px] leading-tight">
                Skolify Assistant
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                <p className="text-[11px] text-emerald-50 font-medium">
                  Online · Replies instantly
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
              text-white hover:bg-white/10 transition-all active:scale-90"
              aria-label="Close"
            >
              <IconClose size={20} />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
            style={{
              background: '#E5DDD5',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'none\'/%3E%3Cpath d=\'M10 10h15v15H10zM35 35h15v15H35zM60 10h15v15H60zM10 60h15v15H10z\' fill=\'%23000\' opacity=\'.03\'/%3E%3C/svg%3E")',
            }}
          >
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row items-end'
                  }`}>
                  {msg.role === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600
                      flex items-center justify-center text-white flex-shrink-0 self-end shadow-sm">
                      <IconBot size={14} />
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    style={{ maxWidth: '85%' }}
                  >
                    <div
                      className={msg.role === 'user'
                        ? 'rounded-xl rounded-br-sm px-3.5 py-2.5 shadow-sm'
                        : 'rounded-xl rounded-bl-sm px-3.5 py-2.5 shadow-sm'}
                      style={msg.role === 'user'
                        ? { background: '#DCF8C6', color: '#000000' }
                        : { background: '#FFFFFF', color: '#000000' }}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-[14px] leading-relaxed">
                          {msg.content}
                        </p>
                      ) : (
                        <MarkdownRenderer text={msg.content} />
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1">
                        <TimeStamp date={msg.timestamp} />
                        {msg.role === 'user' && (
                          <svg width="14" height="8" viewBox="0 0 18 10" fill="none">
                            <path d="M1 5L6 9L17 1" stroke="#53BDEB" strokeWidth="2"
                              strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {msg.role === 'bot' && msg.source?.includes('ai') && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold
                        bg-blue-100 text-blue-600 uppercase tracking-wide ml-1">
                        ✨ AI
                      </span>
                    )}
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
                            className="text-[12px] px-3 py-1.5 rounded-full font-semibold
                            bg-white text-emerald-700 border border-emerald-200
                            hover:bg-emerald-50 transition-all active:scale-95 shadow-sm"
                          >
                            {qr.text}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.canForward && !forwarded && (
                      <button
                        onClick={() => setShowForwardForm(p => !p)}
                        className="flex items-center gap-1.5 text-[12px] px-3 py-1.5
                        rounded-full font-bold bg-emerald-500 text-white
                        hover:bg-emerald-600 transition-all active:scale-95 shadow-md"
                      >
                        <IconForward />
                        Talk to a real person
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {showForwardForm && (
              <div className="ml-9">
                <ForwardForm
                  onSubmit={handleForwardSubmit}
                  onCancel={() => setShowForwardForm(false)}
                />
              </div>
            )}

            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 bg-white px-3 py-2.5 flex gap-2 items-center
            border-t border-slate-200">
            <input
              ref={inputRef}
              className="flex-1 px-4 py-2.5 text-[14px] rounded-full outline-none
              bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-400
              transition-all disabled:opacity-50"
              placeholder="Type a message..."
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
              className="w-11 h-11 rounded-full flex items-center justify-center
              text-white transition-all flex-shrink-0
              disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
              style={{
                background: !input.trim() || loading
                  ? '#94A3B8'
                  : 'linear-gradient(135deg, #00A884, #008f6f)',
                boxShadow: !input.trim() || loading ? 'none' : '0 2px 8px rgba(0,168,132,0.4)',
              }}
              aria-label="Send"
            >
              <IconSend />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <div className="fixed bottom-5 right-5 z-[9999]">
        <button
          onClick={() => setIsOpen(p => !p)}
          className="relative w-14 h-14 rounded-full text-white flex items-center
          justify-center transition-all hover:scale-110 active:scale-95 shadow-xl"
          style={{
            background: isOpen
              ? 'linear-gradient(135deg, #6B7280, #4B5563)'
              : 'linear-gradient(135deg, #00A884, #008f6f)',
            animation: !isOpen ? 'pulseGlow 2s infinite' : 'none',
          }}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? (
            <IconClose size={22} />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.67-.34-3.81-.94l-.27-.15-2.85.48.48-2.85-.15-.27C4.34 14.67 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
            </svg>
          )}
        </button>

        {/* ✅ Unread badge sirf public pages pe dikhega */}
        {!isOpen && unreadCount > 0 && !isLoggedIn && !isPortalRoute && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full
            flex items-center justify-center text-[10px] font-bold text-white
            bg-red-500 shadow-lg border-2 border-white"
            style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)' }}
          >
            {unreadCount}
          </span>
        )}
      </div>
    </>
  )
}