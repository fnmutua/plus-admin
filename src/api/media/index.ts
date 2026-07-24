import request from '@/config/axios'
import { apiOrigin as prod } from '@/config/apiBase'

export interface YoutubeVideoItem {
  videoId: string
  title: string
  publishedAt: string | null
}

export const getYoutubeVideos = (): Promise<IResponse<{ videos: YoutubeVideoItem[] }>> => {
  return request.get({ url: `${prod}/api/v1/media/youtube-videos` })
}
