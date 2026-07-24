const axios = require('axios')
const { XMLParser } = require('fast-xml-parser')

const DEFAULT_CHANNEL_ID =
  process.env.YOUTUBE_CHANNEL_ID || 'UC0hCUWeDllvva19KGJfTz4w'

async function fetchYoutubeVideosViaRss(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
  const response = await axios.get(url, {
    timeout: 15000,
    headers: { Accept: 'application/atom+xml, application/xml, text/xml' },
  })

  const parser = new XMLParser({ ignoreAttributes: false })
  const parsed = parser.parse(response.data)
  const feed = parsed?.feed
  if (!feed) return []

  let entries = feed.entry || []
  if (!Array.isArray(entries)) entries = [entries]

  return entries
    .map((entry) => {
      const rawId = entry['yt:videoId'] || entry?.id || ''
      const videoId = String(rawId).replace(/^yt:video:/, '')
      return {
        videoId,
        title: entry.title || '',
        publishedAt: entry.published || entry.updated || null,
      }
    })
    .filter((video) => video.videoId)
}

exports.getYoutubeVideos = async (req, res) => {
  try {
    const channelId = String(req.query.channelId || DEFAULT_CHANNEL_ID).trim()
    const videos = await fetchYoutubeVideosViaRss(channelId)
    res.status(200).send({ code: '0000', videos })
  } catch (error) {
    console.error('YouTube RSS fetch failed:', error.message || error)
    res.status(500).send({
      code: '9999',
      message: 'Failed to load YouTube videos',
      videos: [],
    })
  }
}
