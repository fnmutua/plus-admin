import { defHttp } from '@/utils/http/axios'

enum Api {
  VIDEO_STREAMS = '/api/v1/video-stream',
}

// Get all active streams
export const getActiveStreams = () => {
  return defHttp.get({ url: `${Api.VIDEO_STREAMS}/active` })
}

// Search streams
export const searchStreams = (params: {
  q?: string
  county?: string
  status?: string
  limit?: number
  offset?: number
}) => {
  return defHttp.get({ 
    url: `${Api.VIDEO_STREAMS}/search`,
    params 
  })
}

// Get streams by county
export const getStreamsByCounty = (county: string) => {
  return defHttp.get({ url: `${Api.VIDEO_STREAMS}/county/${county}` })
}

// Get specific stream by ID
export const getStreamById = (streamId: string) => {
  return defHttp.get({ url: `${Api.VIDEO_STREAMS}/${streamId}` })
}

// Create new stream
export const createStream = (data: {
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
}) => {
  return defHttp.post({ 
    url: Api.VIDEO_STREAMS,
    data 
  })
}

// Update stream
export const updateStream = (streamId: string, data: {
  title?: string
  description?: string
  location?: string
  county?: string
  isPublic?: boolean
  settings?: any
  tags?: string[]
}) => {
  return defHttp.put({ 
    url: `${Api.VIDEO_STREAMS}/${streamId}`,
    data 
  })
}

// Delete stream
export const deleteStream = (streamId: string) => {
  return defHttp.delete({ url: `${Api.VIDEO_STREAMS}/${streamId}` })
}

// Get stream chat messages
export const getStreamChat = (streamId: string, params?: {
  limit?: number
  offset?: number
}) => {
  return defHttp.get({ 
    url: `${Api.VIDEO_STREAMS}/${streamId}/chat`,
    params 
  })
}

// Post chat message
export const postChatMessage = (streamId: string, data: {
  message: string
}) => {
  return defHttp.post({ 
    url: `${Api.VIDEO_STREAMS}/${streamId}/chat`,
    data 
  })
}

// Get all streams (with pagination)
export const getVideoStreams = (params?: {
  page?: number
  limit?: number
  status?: string
  county?: string
  search?: string
}) => {
  return defHttp.get({ 
    url: Api.VIDEO_STREAMS,
    params 
  })
}

