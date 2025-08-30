
import request from '@/config/axios'
import state from '@/config/axios'
import type { ChatUserType } from './types'
import axios, { AxiosResponse } from 'axios'

const dev = import.meta.env.VITE_APP_HOST + ':4000' // Add the port for local Dev
const prod = import.meta.env.VITE_APP_HOST // remove the port for production

/**
 * Get chat users with photos for the chat interface
 * This endpoint returns users that can participate in chat with their photos
 */
export const getChatUsersWithPhotos = (data?: any): Promise<IResponse<ChatUserType[]>> => {
  console.log('Calling getChatUsersWithPhotos with URL:', prod + '/api/v1/chat/xusers', 'Data:', data)
  return request.post({ url: prod + '/api/v1/chat/xusers', data })
}

/**
 * Get support users with their online/offline status
 */
export const getSupportUsersWithStatus = (data?: any): Promise<IResponse<ChatUserType[]>> => {
  console.log('Getting support users with status:', data)
  return request.post({ url: prod + '/api/v1/chat/users/support-with-status', data })
}

/**
 * Get online users
 */
export const getOnlineUsers = (data?: any): Promise<IResponse<ChatUserType[]>> => {
  console.log('Getting online users:', data)
  return request.post({ url: prod + '/api/v1/chat/users/online', data })
}

/**
 * Update user status
 */
export const updateUserStatus = (data: { status: string; is_online?: boolean }): Promise<IResponse<any>> => {
  console.log('Updating user status:', data)
  return request.post({ url: prod + '/api/v1/chat/user/status', data })
}

/**
 * Get unread message count
 */
export const getUnreadCount = (data?: any): Promise<IResponse<any>> => {
  console.log('Getting unread count:', data)
  return request.post({ url: prod + '/api/v1/chat/unread', data })
}

/**
 * Mark all messages as read
 */
export const markAllAsRead = (data?: any): Promise<IResponse<any>> => {
  console.log('Marking all messages as read:', data)
  return request.post({ url: prod + '/api/v1/chat/mark-read', data })
}

/**
 * Get chat messages with pagination and filtering
 */
export const getChatMessages = (data: {
  limit?: number
  page?: number
  receiver_id?: number | null
  since?: string
}): Promise<IResponse<any>> => {
  console.log('Getting chat messages:', data)
  return request.post({ url: prod + '/api/v1/chat/messages', data })
}

/**
 * Send a new chat message
 */
export const sendChatMessage = (data: {
  content: string
  message_type?: 'text' | 'image' | 'file'
  receiver_id?: number | null
}): Promise<IResponse<any>> => {
  console.log('Sending chat message:', data)
  return request.post({ url: prod + '/api/v1/chat/send', data })
}

/**
 * Update message status
 */
export const updateMessageStatus = (data: {
  message_id: string
  status: 'delivered' | 'read'
}): Promise<IResponse<any>> => {
  console.log('Updating message status:', data)
  return request.post({ url: prod + '/api/v1/chat/status', data })
}

/**
 * Get chat statistics (admin only)
 */
export const getChatStats = (): Promise<IResponse<any>> => {
  console.log('Getting chat statistics')
  return request.get({ url: prod + '/api/v1/chat/stats' })
}

/**
 * Get chat users (alternative endpoint)
 */
export const getChatUsers = (data?: any): Promise<IResponse<ChatUserType[]>> => {
  console.log('Getting chat users:', data)
  return request.post({ url: prod + '/api/v1/chat/users', data })
}

// Define interfaces for type safety
interface IResponse<T> {
  message: string
  code: string
  results: T
}
