// src/types/chat.ts

export type SessionUserRole =
  | 'admin'
  | 'teacher'
  | 'staff'
  | 'student'
  | 'parent'
  | 'superadmin'
  | 'guest'

export type ChatMode = 'public' | 'portal' | 'superadmin'

export interface QuickReply {
  text: string
  action?: 'navigate' | 'forward' | 'send_message' | 'link'
  payload?: string
  url?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  content: string
  quickReplies?: QuickReply[]
  canForward?: boolean
  timestamp: Date
  source?: string
}

export interface AIResponse {
  success: boolean
  answer: string
  conversation_id: string
  sources?: Array<{
    url: string
    page_type: string
    score: number
  }>
  quickReplies?: QuickReply[]
  canForward?: boolean
  metadata?: {
    llm_used: boolean
    llm_provider: string
    model: string
    source: string
    context_chunks: number
    portal_mode?: boolean
    tenant_id?: string
    role?: string
  }
}

export interface PythonChatPayload {
  message: string
  conversation_id: string | null
  role: SessionUserRole
  mode: ChatMode
  tenant_id?: string | null
  user_id?: string | null
  user_name?: string | null
}

// Next.js API se frontend ko jaane wala response
export interface ClientChatResponse {
  success: boolean
  response: string
  quickReplies: QuickReply[]
  canForward: boolean
  conversation_id: string | null
  source: string
  error?: string
}