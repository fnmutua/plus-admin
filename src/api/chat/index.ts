
import request from '@/config/axios'

export interface ChatUser {
  id: number
  name: string
  email: string
  avatar: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen: string | null
  isOnline: boolean
}

export interface ChatUsersResponse {
  data: ChatUser[]
  total: number
  code: string
  currentUserRole?: {
    isSupportStaff: boolean
    isAdmin: boolean
    roles: string[]
  }
}

/**
 * Get chat users based on current user's role
 * - All users see support staff with their online status
 * - Support staff see all users with their respective status
 */
export const getChatUsers = () => {
  return request.get<ChatUsersResponse>('/api/v1/chat/users')
}

/**
 * Get support staff users only (for regular users)
 */
export const getSupportStaff = () => {
  return request.get<ChatUsersResponse>('/api/v1/chat/users/support')
}

/**
 * Get support users with their online/offline status
 */
export const getSupportUsersWithStatus = () => {
  return request.get<ChatUsersResponse>('/api/v1/chat/users/support-with-status')
}

/**
 * Get online users
 */
export const getOnlineUsers = () => {
  return request.get<ChatUsersResponse>('/api/v1/chat/users/online')
}

/**
 * Get all users with their online status (support staff and admins only)
 */
export const getAllUsersWithStatus = () => {
  return request.get<ChatUsersResponse>('/api/v1/chat/users/all')
}

/**
 * Refresh online status for all users (support staff and admins only)
 */
export const refreshOnlineStatus = () => {
  return request.get<ChatUsersResponse>('/api/v1/chat/users/refresh-status')
}

/**
 * Update user status
 */
export const updateUserStatus = (data: { status: string; is_online?: boolean }) => {
  return request.post({
    url: '/api/v1/chat/user/status',
    data
  })
}

/**
 * Get unread message count
 */
export const getUnreadCount = () => {
  return request.get('/api/v1/chat/unread')
}
