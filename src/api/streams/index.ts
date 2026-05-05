import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

interface StreamType {
  id?: string
  title: string
  description?: string
  location?: string
  county?: string
  isPublic?: boolean
  settings?: {
    resolution?: string
    bitrate?: number
    framerate?: number
    camera?: string
    audio?: boolean
  }
  tags?: string[]
  status?: string
  createdAt?: string
  updatedAt?: string
}

// Get all active streams
export const getActiveStreams = (): Promise<IResponse<StreamType[]>> => {
  console.log('Getting active streams....')
  return request.get({ url: prod + '/api/v1/video-stream/active' })
}

// Search streams
export const searchStreams = (params: { q?: string; county?: string; status?: string; limit?: number; offset?: number }): Promise<IResponse<StreamType[]>> => {
  console.log('Searching streams....', params)
  return request.get({ url: prod + '/api/v1/video-stream/search', params })
}

// Get streams by county
export const getStreamsByCounty = (county: string, params?: { status?: string; limit?: number; offset?: number }): Promise<IResponse<StreamType>> => {
  console.log('Getting streams by county....', county, params)
  return request.get({ url: prod + `/api/v1/video-stream/county/${county}`, params })
}

// Get user's streams
export const getUserStreams = (userId: string, params?: { status?: string; limit?: number; offset?: number }): Promise<IResponse<StreamType>> => {
  console.log('Getting user streams....', userId, params)
  return request.get({ url: prod + `/api/v1/video-stream/user/${userId}`, params })
}

// Get specific stream by ID
export const getStreamById = (streamId: string): Promise<IResponse<StreamType>> => {
  console.log('Getting stream by ID....', streamId)
  return request.get({ url: prod + `/api/v1/video-stream/${streamId}` })
}

// Create new stream
export const createStream = (data: StreamType): Promise<IResponse<StreamType>> => {
  console.log('Creating stream....', data)
  return request.post({ url: prod + '/api/v1/video-stream/', data })
}

// Update stream
export const updateStream = (streamId: string, data: StreamType): Promise<IResponse<StreamType>> => {
  console.log('Updating stream....', streamId, data)
  return request.put({ url: prod + `/api/v1/video-stream/${streamId}`, data })
}

// Delete stream
export const deleteStream = (streamId: string): Promise<IResponse<StreamType>> => {
  console.log('Deleting stream....', streamId)
  return request.delete({ url: prod + `/api/v1/video-stream/${streamId}` })
}

// End stream
export const endStream = (streamId: string): Promise<IResponse<StreamType>> => {
  console.log('Ending stream....', streamId)
  return request.post({ url: prod + `/api/v1/video-stream/${streamId}/end` })
}

// Get stream chat messages
export const getStreamChat = (streamId: string, params?: { limit?: number; offset?: number }): Promise<IResponse<StreamType>> => {
  console.log('Getting stream chat....', streamId, params)
  return request.get({ url: prod + `/api/v1/video-stream/${streamId}/chat`, params })
}

// Post chat message
export const postChatMessage = (streamId: string, data: { message: string; messageType?: string }): Promise<IResponse<StreamType>> => {
  console.log('Posting chat message....', streamId, data)
  return request.post({ url: prod + `/api/v1/video-stream/${streamId}/chat`, data })
}

// Get all streams (with pagination)
export const getVideoStreams = (params?: { status?: string; limit?: number; offset?: number }): Promise<IResponse<StreamType[]>> => {
  console.log('Getting all video streams....', params)
  return request.get({ url: prod + '/api/v1/video-stream/all', params })
}

