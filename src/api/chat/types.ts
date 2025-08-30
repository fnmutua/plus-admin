export type ChatUserType = {
  id: number
  name: string
  email: string
  username?: string
  photo: string
  avatar?: string // Keep for backward compatibility
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen: string | null
  isOnline: boolean
}

export type ChatMessageType = {
  id: string
  content: string
  message_type: 'text' | 'image' | 'file'
  sender_id: number
  receiver_id: number | null
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  created_at: string
  updated_at: string
}

export type ChatStatusType = {
  status: 'online' | 'away' | 'busy' | 'offline'
  is_online: boolean
}

export type ChatUnreadType = {
  unreadCount: number
}

export type ChatStatsType = {
  totalMessages: number
  totalUsers: number
  onlineUsers: number
  todayMessages: number
}
