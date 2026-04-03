'use client'

// FILE: src/components/chat/ChatWidget.tsx
// ═══════════════════════════════════════════════════════════
// Skolify AI Assistant — Animated Launcher + Chat Widget
// Auto-show bubble · Pulse ring · Professional UX
// ═══════════════════════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import type { UserRole } from '@/lib/chatbot/qa-database'

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
}

// ══════════════════════════════════════════════════════════
// ROTATING SUGGESTION TEXTS — Auto-animated bubble
// ══════════════════════════════════════════════════════════

const SUGGESTIONS = [
  'कोई प्रश्न है? पूछें! 🙏',
  'Plans & Pricing जानें →',
  '60-दिन Free Trial! 🎁',
  'Setup में सहायता लें →',
  'अभी Demo लें! 📞',
  'Features देखें →',
]

// ══════════════════════════════════════════════════════════
// ICONS
// ══════════════════════════════════════════════════════════

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5
        19.5 0 013.07 8.8 19.79 19.79 0 01-.001 .17A2 2 0 012 0h3a2 2 0 012
        1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0
        006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0
        0122 14.9v2z" />
    </svg>
  )
}

function IconSpark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3
        2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  )
}

// ══════════════════════════════════════════════════════════
// ANIMATED LAUNCHER BUBBLE
// ══════════════════════════════════════════════════════════

function LauncherBubble({
  onOpen,
  visible,
}: {
  onOpen: () => void
  visible: boolean
}) {
  const [suggIdx, setSuggIdx] = useState(0)
  const [fade, setFade] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  // Rotate suggestions every 3s
  useEffect(() => {
    if (!visible || dismissed) return
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setSuggIdx(i => (i + 1) % SUGGESTIONS.length)
        setFade(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [visible, dismissed])

  if (!visible || dismissed) return null

  return (
    <div
      className="fixed bottom-[100px] right-4 sm:right-6 z-[9998]
      flex items-end gap-2"
      style={{
        animation: 'bubbleIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      }}
    >
      {/* Suggestion card */}
      <div
        className="relative max-w-[220px] cursor-pointer"
        onClick={onOpen}
      >
        {/* Card */}
        <div
          className="px-4 py-3 rounded-2xl rounded-br-sm select-none"
          style={{
            background: '#FFFFFF',
            boxShadow: [
              '0 0 0 1px rgba(37,99,235,0.1)',
              '0 8px 32px rgba(37,99,235,0.18)',
              '0 2px 8px rgba(0,0,0,0.08)',
            ].join(','),
          }}
        >
          {/* Header row */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{ color: '#2563EB' }}>
              <IconSpark />
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: '#2563EB' }}
            >
              Skolify Assistant
            </span>
          </div>

          {/* Animated suggestion text */}
          <p
            className="text-[13px] font-semibold leading-snug transition-all
            duration-300"
            style={{
              color: '#0F172A',
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(4px)',
            }}
          >
            {SUGGESTIONS[suggIdx]}
          </p>

          {/* Dots indicator */}
          <div className="flex gap-1 mt-2">
            {SUGGESTIONS.map((_, i) => (
              <span
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === suggIdx ? '16px' : '5px',
                  height: '5px',
                  background: i === suggIdx ? '#2563EB' : '#CBD5E1',
                }}
              />
            ))}
          </div>
        </div>

        {/* Tail */}
        <div
          className="absolute bottom-0 right-[-6px]"
          style={{
            width: 0,
            height: 0,
            borderStyle: 'solid',
            borderWidth: '0 0 10px 10px',
            borderColor: 'transparent transparent #FFFFFF transparent',
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.05))',
          }}
        />
      </div>

      {/* Dismiss button */}
      <button
        onClick={e => {
          e.stopPropagation()
          setDismissed(true)
        }}
        className="mb-1 w-5 h-5 rounded-full flex items-center justify-center
        transition-all hover:scale-110 active:scale-90"
        style={{
          background: 'rgba(100,116,139,0.15)',
          color: '#64748B',
        }}
        aria-label="बंद करें"
      >
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MARKDOWN RENDERER
// ══════════════════════════════════════════════════════════

function MarkdownRenderer({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1.5" />

        if (line.startsWith('## ')) {
          return (
            <p key={idx}
              className="font-bold text-[15px] text-slate-900 mt-3 mb-1.5
              pb-1.5 border-b border-slate-100">
              {line.replace('## ', '')}
            </p>
          )
        }

        if (line.startsWith('### ')) {
          return (
            <p key={idx}
              className="font-semibold text-[12px] text-slate-600 mt-2 mb-1
              uppercase tracking-wider">
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
            <div key={idx} className="flex gap-1.5 text-[11px] flex-wrap">
              {cells.map((cell, i) => (
                <span key={i}
                  className={`flex-1 min-w-[50px] px-2 py-1.5 rounded-lg
                  text-center border ${isHeader
                      ? 'bg-blue-50 text-blue-900 font-bold border-blue-200'
                      : i === 0
                        ? 'bg-slate-100 text-slate-800 font-semibold border-slate-200'
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
              <span className="text-blue-500 flex-shrink-0 font-bold mt-0.5">•</span>
              <span className="text-slate-700 flex-1"
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
              <span className="text-slate-700 flex-1"
                dangerouslySetInnerHTML={{ __html: renderInline(content) }} />
            </div>
          )
        }

        return (
          <p key={idx} className="text-slate-700"
            dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
        )
      })}
    </div>
  )
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g,
      '<strong class="text-slate-900 font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g,
      '<em class="text-slate-800 italic">$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" class="text-blue-600 underline font-medium hover:text-blue-700 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`(.*?)`/g,
      '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">$1</code>')
}

// ══════════════════════════════════════════════════════════
// TIMESTAMP
// ══════════════════════════════════════════════════════════

function TimeStamp({ date }: { date: Date }) {
  const time = date.toLocaleTimeString('hi-IN', {
    hour: '2-digit', minute: '2-digit',
  })
  return <span className="text-[10px] text-slate-400 select-none">{time}</span>
}

// ══════════════════════════════════════════════════════════
// WELCOME MESSAGES
// ══════════════════════════════════════════════════════════

function getWelcomeMessage(role: UserRole | 'guest'): Message {
  const base = { id: 'welcome', role: 'bot' as const, timestamp: new Date() }

  const content: Record<UserRole | 'guest', {
    content: string
    quickReplies: QuickReply[]
  }> = {
    guest: {
      content: `**नमस्कार! मैं Skolify Assistant हूँ 🙏**\n\nआपके विद्यालय को digital बनाने में सहायता करना मेरा उद्देश्य है।\n\n**मैं इन विषयों में सहायता कर सकता हूँ:**\n\n• 💰 योजनाएँ एवं मूल्य निर्धारण\n• 🎁 60-दिवस निःशुल्क परीक्षण\n• 📦 22+ सुविधाएँ एवं modules\n• 💳 Credits एवं messaging\n• 🔧 Setup एवं onboarding\n\nकृपया बताएं, आप क्या जानना चाहेंगे?`,
      quickReplies: [
        { text: '💰 योजनाएँ देखें', payload: 'admin_plans_overview' },
        { text: '🎁 Free Trial', payload: 'trial_info' },
        { text: '📦 सुविधाएँ', payload: 'features_overview' },
        { text: '📞 Demo लें', action: 'forward' },
      ],
    },
    admin: {
      content: `**स्वागत है! 🙏**\n\nSkolify Admin Portal में आपका पुनः स्वागत है।\n\n**आज मैं किस विषय में सहायता करूँ?**\n\n• 💳 Credits एवं billing प्रबंधन\n• ⬆️ योजना upgrade करें\n• 👥 छात्र/शिक्षक सीमा बढ़ाएँ\n• 🔧 Setup एवं configuration`,
      quickReplies: [
        { text: '💳 Credits खरीदें', payload: 'buy_credits' },
        { text: '⬆️ Upgrade करें', payload: 'admin_upgrade' },
        { text: '🚀 Setup गाइड', payload: 'admin_first_steps' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    teacher: {
      content: `**नमस्कार! 🙏**\n\nTeacher Portal में आपका स्वागत है।\n\n**मैं आपकी कैसे सहायता करूँ?**\n\n• ✔ उपस्थिति अंकन\n• 📝 अंक प्रविष्टि\n• 📚 गृहकार्य प्रबंधन\n• 📊 Reports देखें`,
      quickReplies: [
        { text: '✔ उपस्थिति', payload: 'teacher_attendance' },
        { text: '📝 अंक दर्ज', payload: 'teacher_marks' },
        { text: '📚 गृहकार्य', payload: 'teacher_homework' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    student: {
      content: `**नमस्कार! 🙏**\n\nStudent Portal में आपका स्वागत है।\n\n**आप क्या देखना चाहते हैं?**\n\n• ✔ उपस्थिति रिकॉर्ड\n• 📊 परीक्षा परिणाम\n• 📝 Assignments\n• 💰 शुल्क स्थिति`,
      quickReplies: [
        { text: '✔ उपस्थिति', payload: 'student_attendance_check' },
        { text: '📊 परिणाम', payload: 'student_results' },
        { text: '💰 शुल्क', payload: 'fee_status_student' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
    parent: {
      content: `**नमस्कार! 🙏**\n\nParent Portal में आपका स्वागत है।\n\n**अपने बच्चे के बारे में क्या जानना चाहते हैं?**\n\n• ✔ उपस्थिति रिकॉर्ड\n• 💰 शुल्क भुगतान\n• 📊 परीक्षा परिणाम\n• 📚 गृहकार्य स्थिति`,
      quickReplies: [
        { text: '✔ उपस्थिति', payload: 'student_attendance_check' },
        { text: '💰 शुल्क भुगतान', payload: 'fee_status_student' },
        { text: '📊 परिणाम', payload: 'student_results' },
        { text: '📞 Support', action: 'forward' },
      ],
    },
  }

  return { ...base, ...content[role] }
}

// ══════════════════════════════════════════════════════════
// FORWARD FORM
// ══════════════════════════════════════════════════════════

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
    <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-blue-200"
      style={{ background: '#F0F7FF' }}>
      <div className="px-4 py-3 flex items-center gap-2"
        style={{ background: '#2563EB' }}>
        <span className="text-white text-sm">💬</span>
        <p className="text-white font-bold text-sm">मानव टीम से संपर्क करें</p>
      </div>
      <div className="p-4 space-y-3">
        <input
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2
          border-slate-200 bg-white focus:border-blue-500
          focus:ring-4 focus:ring-blue-100 outline-none transition-all
          text-slate-900 placeholder:text-slate-400 font-medium"
          placeholder="आपका नाम (वैकल्पिक)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2
          border-slate-200 bg-white focus:border-blue-500
          focus:ring-4 focus:ring-blue-100 outline-none transition-all
          text-slate-900 placeholder:text-slate-400 font-medium"
          placeholder="WhatsApp नंबर *"
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
        />
        <textarea
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border-2
          border-slate-200 bg-white focus:border-blue-500
          focus:ring-4 focus:ring-blue-100 outline-none transition-all
          resize-none text-slate-900 placeholder:text-slate-400 font-medium"
          rows={3}
          placeholder="आपका प्रश्न विस्तार से लिखें *"
          value={query}
          onChange={e => setQuery(e.target.value)}
          required
        />
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm rounded-xl font-semibold
            border-2 border-slate-300 bg-white text-slate-700
            hover:bg-slate-50 transition-all active:scale-95">
            रद्द करें
          </button>
          <button
            onClick={() => {
              if (!phone.trim() || !query.trim()) {
                alert('कृपया WhatsApp नंबर और प्रश्न अवश्य दर्ज करें।')
                return
              }
              onSubmit({ name, phone, query })
            }}
            className="flex-1 py-2.5 text-sm rounded-xl font-bold
            text-white transition-all active:scale-95 shadow-md"
            style={{ background: '#2563EB' }}>
            भेजें →
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// TYPING INDICATOR
// ══════════════════════════════════════════════════════════

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center
        flex-shrink-0 text-white" style={{ background: '#2563EB' }}>
        <IconBot />
      </div>
      <div className="rounded-2xl rounded-bl-md px-4 py-3.5 flex gap-1.5
        items-center bg-white border-2 border-slate-200 shadow-sm">
        <span className="text-[11px] text-slate-500 mr-1">उत्तर दे रहे हैं</span>
        {[0, 1, 2].map(i => (
          <div key={i}
            className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// GLOBAL KEYFRAMES (injected once)
// ══════════════════════════════════════════════════════════

const GLOBAL_STYLES = `
  @keyframes bubbleIn {
    from { opacity: 0; transform: translateY(16px) scale(0.92); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes chatOpen {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes pulseRing {
    0%   { transform: scale(1);    opacity: 0.6; }
    70%  { transform: scale(1.55); opacity: 0;   }
    100% { transform: scale(1.55); opacity: 0;   }
  }
  @keyframes badgePop {
    0%   { transform: scale(0); }
    70%  { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`

// ══════════════════════════════════════════════════════════
// MAIN CHAT WIDGET
// ══════════════════════════════════════════════════════════

export function ChatWidget() {
  const { data: session } = useSession()
  const userRole = (session?.user?.role as UserRole) || 'guest'

  const [isOpen, setIsOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [unreadCount, setUnreadCount] = useState(1)
  const [messages, setMessages] = useState<Message[]>([
    getWelcomeMessage(userRole),
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForwardForm, setShowForwardForm] = useState(false)
  const [forwarded, setForwarded] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Show bubble after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  // Hide bubble when chat opens; clear unread
  useEffect(() => {
    if (isOpen) {
      setShowBubble(false)
      setUnreadCount(0)
    }
  }, [isOpen])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen, messages, scrollToBottom])

  // ── Send message ──
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

    // ── Thanks detection (API call nahi hoga) ──
    const thanksPatterns = [
      'thanks', 'thank you', 'thankyou', 'thank',
      'dhanyawad', 'dhanyavaad', 'shukriya', 'shukriyaa',
      'bahut achha', 'bahut acha', 'bahut accha',
      'bilkul sahi', 'samajh gaya', 'samajh gayi',
      'theek hai', 'thik hai', 'theek h', 'thik h',
      'ok thanks', 'ok thank', 'accha', 'acha',
      'धन्यवाद', 'शुक्रिया', 'बहुत अच्छा', 'समझ गया',
      'समझ गई', 'ठीक है', 'बिल्कुल सही', 'अच्छा',
    ]

    const msgLower = trimmed.toLowerCase()
    const isThanks = thanksPatterns.some(p => msgLower.includes(p))

    if (isThanks) {
      const thanksReplies = [
        '🙏 **आपका स्वागत है!**\n\nSkolify Assistant हमेशा आपकी सेवा में उपस्थित है।\n\n**क्या कोई और जानकारी चाहिए?**',
        '😊 **खुशी हुई सहायता करके!**\n\nकोई भी प्रश्न हो, बेझिझक पूछें।\n\n**Skolify आपके विद्यालय के साथ है!** 🏫',
        '🙏 **धन्यवाद आपका भी!**\n\nआपका दिन शुभ हो।\n\n**कोई और सहायता चाहिए?**',
      ]
      const reply = thanksReplies[Math.floor(Math.random() * thanksReplies.length)]

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `bot_${Date.now()}`,
          role: 'bot',
          content: reply,
          quickReplies: [
            { text: '💰 योजनाएँ देखें', payload: 'admin_plans_overview' },
            { text: '📦 सुविधाएँ', payload: 'features_overview' },
            { text: '📞 Support', action: 'forward' },
          ],
          canForward: false,
          timestamp: new Date(),
        }])
        setLoading(false)
      }, 600) // typing feel ke liye thoda delay
      return
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, role: userRole }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.success) {
        setMessages(prev => [...prev, {
          id: `bot_${Date.now()}`,
          role: 'bot',
          content: data.response,
          quickReplies: data.quickReplies ?? [],
          canForward: data.canForward ?? false,
          timestamp: new Date(),
        }])
      } else throw new Error(data.error || 'Server error')
    } catch {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'bot',
        content: '😔 **क्षमा करें**, तकनीकी समस्या उत्पन्न हुई है।\n\nकृपया कुछ समय बाद पुनः प्रयास करें।',
        canForward: true,
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, userRole])

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
        content: '✔ **आपका संदेश सफलतापूर्वक भेज दिया गया है!**\n\nहमारी टीम **2-4 घंटे** में आपसे WhatsApp पर संपर्क करेगी।\n\nधन्यवाद! 🙏',
        timestamp: new Date(),
      }])
    } catch {
      alert('कुछ समस्या हुई। कृपया enquiry form का उपयोग करें।')
    }
  }, [])

  const lastBotMsg = [...messages].reverse().find(m => m.role === 'bot')
  const hasQuickReplies = !!(lastBotMsg?.quickReplies?.length)

  return (
    <>
      {/* ── Global keyframe styles ── */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      {/* ══════════════════════════════════════════════════
          ANIMATED LAUNCHER BUBBLE
      ══════════════════════════════════════════════════ */}
      <LauncherBubble
        visible={showBubble && !isOpen}
        onOpen={() => setIsOpen(true)}
      />

      {/* ══════════════════════════════════════════════════
          CHAT WINDOW
      ══════════════════════════════════════════════════ */}
      {isOpen && (
        <div
          className="fixed bottom-[88px] right-4 sm:right-6 z-[9999]
          w-[min(420px,calc(100vw-2rem))] flex flex-col rounded-2xl
          overflow-hidden"
          style={{
            height: 'min(640px, calc(100vh - 120px))',
            background: '#FFFFFF',
            boxShadow: [
              '0 0 0 1px rgba(0,0,0,0.06)',
              '0 4px 6px -1px rgba(0,0,0,0.07)',
              '0 24px 48px -8px rgba(0,0,0,0.22)',
              '0 48px 80px -12px rgba(37,99,235,0.12)',
            ].join(','),
            animation: 'chatOpen 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          {/* ── HEADER ── */}
          <div
            className="flex-shrink-0 flex items-center gap-3 px-5 py-4"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
              borderBottom: '1.5px solid rgba(255,255,255,0.15)',
            }}
          >
            {/* Avatar with pulse */}
            <div className="relative flex-shrink-0">
              {/* Pulse rings */}
              <span className="absolute inset-0 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.3)',
                  animation: 'pulseRing 2s ease-out infinite',
                }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center
                justify-center relative z-10 text-white"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                }}
              >
                <IconBot size={20} />
              </div>
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] leading-tight"
                style={{ color: '#FFFFFF' }}>
                Skolify Assistant
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-400"
                  style={{ animation: 'pulseRing 2s ease-out infinite' }}
                />
                <p className="text-[11px] font-medium"
                  style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Online · तुरंत उत्तर मिलेगा
                </p>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center
              justify-center transition-all active:scale-90 hover:bg-white/20"
              style={{
                color: 'rgba(255,255,255,0.9)',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
              aria-label="चैट बंद करें"
            >
              <IconClose />
            </button>
          </div>

          {/* ── MESSAGES ── */}
          <div
            className="flex-1 overflow-y-auto px-4 py-5 space-y-4
            portal-scrollbar"
            style={{ background: '#F1F5F9' }}
          >
            {messages.map((msg, idx) => (
              <div key={msg.id}>
                <div className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row items-end'
                  }`}>
                  {/* Avatar */}
                  {msg.role === 'bot' ? (
                    <div className="w-8 h-8 rounded-xl flex items-center
                      justify-center flex-shrink-0 self-end mb-1 text-white"
                      style={{ background: '#2563EB' }}>
                      <IconBot />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl flex items-center
                      justify-center flex-shrink-0 self-end mb-1 text-white"
                      style={{ background: '#64748B' }}>
                      <IconUser />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    style={{ maxWidth: '82%' }}
                  >
                    <div
                      className={msg.role === 'user'
                        ? 'rounded-2xl rounded-br-md px-4 py-3'
                        : 'rounded-2xl rounded-bl-md px-4 py-3'}
                      style={msg.role === 'user'
                        ? {
                          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                          color: '#FFFFFF',
                          boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                        }
                        : {
                          background: '#FFFFFF',
                          border: '1.5px solid #E2E8F0',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                        }}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm leading-relaxed font-medium"
                          style={{ color: '#FFFFFF' }}>
                          {msg.content}
                        </p>
                      ) : (
                        <MarkdownRenderer text={msg.content} />
                      )}
                    </div>
                    <TimeStamp date={msg.timestamp} />
                  </div>
                </div>

                {/* Quick replies — last bot message only */}
                {msg.role === 'bot' && idx === messages.length - 1 && (
                  <div className="mt-3 ml-10 space-y-2.5">
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.quickReplies.map(qr => (
                          <button
                            key={qr.text}
                            onClick={() => handleQuickReply(qr)}
                            className="text-xs px-3.5 py-2 rounded-full
                            font-semibold transition-all active:scale-95
                            hover:shadow-md"
                            style={{
                              background: '#FFFFFF',
                              border: '2px solid #2563EB',
                              color: '#1E40AF',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = '#2563EB'
                              e.currentTarget.style.color = '#FFFFFF'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = '#FFFFFF'
                              e.currentTarget.style.color = '#1E40AF'
                            }}
                          >
                            {qr.text}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.canForward && !forwarded && (
                      <button
                        onClick={() => setShowForwardForm(p => !p)}
                        className="flex items-center gap-2 text-xs px-4 py-2.5
                        rounded-full font-bold transition-all active:scale-95
                        text-white shadow-md"
                        style={{
                          background: 'linear-gradient(135deg, #059669, #047857)',
                        }}
                      >
                        <IconForward />
                        मानव टीम से बात करें
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {showForwardForm && (
              <div className="ml-10">
                <ForwardForm
                  onSubmit={handleForwardSubmit}
                  onCancel={() => setShowForwardForm(false)}
                />
              </div>
            )}

            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* ── STICKY QUICK CHIPS ── */}
          {hasQuickReplies && !loading && !showForwardForm && (
            <div
              className="px-4 py-2.5 flex gap-2 flex-wrap flex-shrink-0
              overflow-x-auto"
              style={{
                background: '#F8FAFC',
                borderTop: '1.5px solid #E2E8F0',
              }}
            >
              {lastBotMsg!.quickReplies!.map(qr => (
                <button
                  key={qr.text}
                  onClick={() => handleQuickReply(qr)}
                  className="text-[11px] px-3 py-1.5 rounded-full font-semibold
                  whitespace-nowrap transition-all active:scale-95 flex-shrink-0"
                  style={{
                    background: '#EFF6FF',
                    border: '1.5px solid #93C5FD',
                    color: '#1D4ED8',
                  }}
                >
                  {qr.text}
                </button>
              ))}
            </div>
          )}

          {/* ── INPUT ── */}
          <div
            className="flex-shrink-0 px-4 py-3.5 flex gap-2.5 items-center"
            style={{
              background: '#FFFFFF',
              borderTop: '1.5px solid #E2E8F0',
            }}
          >
            <input
              ref={inputRef}
              className="flex-1 px-4 py-3 text-sm rounded-xl outline-none
              transition-all disabled:opacity-50 font-medium"
              style={{
                background: '#F8FAFC',
                border: '2px solid #E2E8F0',
                color: '#0F172A',
              }}
              placeholder="संदेश लिखें..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#2563EB'
                e.currentTarget.style.background = '#FFFFFF'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#E2E8F0'
                e.currentTarget.style.background = '#F8FAFC'
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-xl flex items-center justify-center
              text-white transition-all flex-shrink-0
              disabled:opacity-40 disabled:cursor-not-allowed active:scale-90"
              style={{
                background: !input.trim() || loading
                  ? '#94A3B8'
                  : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                boxShadow: !input.trim() || loading
                  ? 'none'
                  : '0 4px 14px rgba(37,99,235,0.4)',
              }}
              aria-label="संदेश भेजें"
            >
              <IconSend />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          FLOATING TOGGLE BUTTON — with pulse ring + badge
      ══════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-[9999]">
        {/* Pulse ring — only when closed */}
        {!isOpen && (
          <>
            <span
              className="absolute inset-0 rounded-2xl"
              style={{
                background: '#2563EB',
                animation: 'pulseRing 2s ease-out infinite',
              }}
            />
            <span
              className="absolute inset-0 rounded-2xl"
              style={{
                background: '#2563EB',
                animation: 'pulseRing 2s ease-out 0.6s infinite',
              }}
            />
          </>
        )}

        {/* Main button */}
        <button
          onClick={() => setIsOpen(p => !p)}
          className="relative w-16 h-16 rounded-2xl text-white flex items-center
          justify-center transition-all hover:scale-110 active:scale-95"
          style={{
            background: isOpen
              ? 'linear-gradient(135deg, #475569, #334155)'
              : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            boxShadow: [
              '0 0 0 3px rgba(37,99,235,0.15)',
              '0 8px 24px rgba(37,99,235,0.45)',
              '0 2px 6px rgba(0,0,0,0.15)',
            ].join(','),
            border: '2.5px solid rgba(255,255,255,0.9)',
          }}
          aria-label={isOpen ? 'चैट बंद करें' : 'चैट खोलें'}
        >
          {isOpen ? (
            <IconClose size={22} />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
            </svg>
          )}
        </button>

        {/* Unread badge */}
        {!isOpen && unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
            flex items-center justify-center text-[10px] font-bold text-white"
            style={{
              background: '#EF4444',
              boxShadow: '0 0 0 2px #FFFFFF',
              animation: 'badgePop 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
            }}
          >
            {unreadCount}
          </span>
        )}
      </div>
    </>
  )
}