<template>
  <div class="webrtc-video-player">
    <div class="video-container">
      <video
        ref="videoElement"
        autoplay
        playsinline
        muted
        controls
        class="video-stream"
        :class="{ 'no-stream': !hasStream }"
      >
        <source :src="streamUrl" type="video/mp4" v-if="streamUrl" />
        Your browser does not support the video tag.
      </video>
      
      <!-- WebRTC Video Element (hidden, used for WebRTC streams) -->
      <video
        ref="webrtcVideoElement"
        autoplay
        playsinline
        class="webrtc-video-stream"
        :class="{ 'no-stream': !hasWebRTCStream }"
        style="display: none;"
      ></video>
      
      <!-- Loading overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
      
      <!-- No stream overlay -->
      <div v-if="!hasStream && !hasWebRTCStream && !isLoading" class="no-stream-overlay">
        <div class="no-stream-content">
          <i class="el-icon-video-camera" style="font-size: 48px; color: #ccc;"></i>
          <p>No video stream available</p>
          <p class="stream-info" v-if="streamInfo">{{ streamInfo.title }}</p>
        </div>
      </div>
    </div>
    
    <!-- Stream Controls -->
    <div class="stream-controls" v-if="hasStream || hasWebRTCStream">
      <div class="stream-info-display">
        <span v-if="streamInfo" class="stream-title">{{ streamInfo.title }}</span>
        <span v-if="streamInfo" class="stream-status" :class="streamInfo.status">
          {{ streamInfo.status }}
        </span>
      </div>
      
      <div class="control-buttons">
        <el-button
          type="primary"
          size="small"
          @click="toggleFullscreen"
          :icon="isFullscreen ? 'el-icon-copy-document' : 'el-icon-full-screen'"
        >
          {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
        </el-button>
        
        <el-button
          type="info"
          size="small"
          @click="toggleMute"
          :icon="isMuted ? 'el-icon-microphone' : 'el-icon-turn-off-microphone'"
        >
          {{ isMuted ? 'Unmute' : 'Mute' }}
        </el-button>
        
        <el-button
          type="warning"
          size="small"
          @click="refreshStream"
          :loading="isRefreshing"
          icon="el-icon-refresh"
        >
          Refresh
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElButton, ElMessage } from 'element-plus'

interface StreamInfo {
  id: string
  title: string
  description?: string
  status: 'live' | 'ended' | 'connecting'
  streamer?: {
    name: string
    email: string
  }
  resolution?: string
  bitrate?: number
  framerate?: number
}

interface Props {
  streamInfo?: StreamInfo
  streamUrl?: string
  autoPlay?: boolean
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoPlay: true,
  showControls: true
})

const emit = defineEmits<{
  streamStarted: [stream: MediaStream]
  streamEnded: []
  streamError: [error: Error]
  fullscreenChanged: [isFullscreen: boolean]
}>()

// Refs
const videoElement = ref<HTMLVideoElement>()
const webrtcVideoElement = ref<HTMLVideoElement>()
const isLoading = ref(false)
const isRefreshing = ref(false)
const isMuted = ref(false)
const isFullscreen = ref(false)
const loadingMessage = ref('Connecting to stream...')

// WebRTC related
const peerConnection = ref<RTCPeerConnection | null>(null)
const webSocket = ref<WebSocket | null>(null)
const hasWebRTCStream = ref(false)
const currentStream = ref<MediaStream | null>(null)
const connectionTimeout = ref<NodeJS.Timeout | null>(null)

// Computed
const hasStream = computed(() => {
  return !!(props.streamUrl || currentStream.value)
})

// WebRTC Configuration
const webrtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

// WebSocket URL for signaling - auto-detect environment
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'
const signalingServerUrl = isDevelopment 
  ? 'ws://localhost:3002/video-stream'
  : 'wss://kesmis.go.ke:3002/video-stream'

onMounted(() => {
  if (props.streamInfo?.status === 'live') {
    connectToStream()
  }
})

onUnmounted(() => {
  cleanup()
})

// Watch for stream info changes
watch(() => props.streamInfo, (newInfo) => {
  if (newInfo?.status === 'live' && !hasWebRTCStream.value) {
    connectToStream()
  } else if (newInfo?.status === 'ended') {
    stopStream()
  }
}, { deep: true })

/**
 * Connect to WebRTC stream
 */
const connectToStream = async () => {
  if (!props.streamInfo?.id) {
    console.error('No stream ID provided')
    return
  }

  try {
    isLoading.value = true
    loadingMessage.value = 'Connecting to stream...'
    
    console.log('🎥 Attempting to connect to video stream:', props.streamInfo.id)
    console.log('🌐 WebSocket URL:', signalingServerUrl)
    
    // Create WebRTC peer connection
    peerConnection.value = new RTCPeerConnection(webrtcConfig)
    
    // Handle incoming stream
    peerConnection.value.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[0])
      const stream = event.streams[0]
      currentStream.value = stream
      
      if (webrtcVideoElement.value) {
        webrtcVideoElement.value.srcObject = stream
        webrtcVideoElement.value.style.display = 'block'
        if (videoElement.value) {
          videoElement.value.style.display = 'none'
        }
      }
      
      hasWebRTCStream.value = true
      isLoading.value = false
      
      // Clear any pending timeouts
      if (connectionTimeout.value) {
        clearTimeout(connectionTimeout.value)
        connectionTimeout.value = null
      }
      
      emit('streamStarted', stream)
    }
    
    // Handle connection state changes
    peerConnection.value.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', peerConnection.value?.connectionState)
      
      if (peerConnection.value?.connectionState === 'failed') {
        ElMessage.error('Connection failed. Please try again.')
        isLoading.value = false
      }
    }
    
    // Handle ICE candidates
    peerConnection.value.onicecandidate = (event) => {
      if (event.candidate && webSocket.value?.readyState === WebSocket.OPEN) {
        webSocket.value.send(JSON.stringify({
          type: 'ice_candidate',
          candidate: event.candidate,
          streamId: props.streamInfo?.id
        }))
      }
    }
    
    // Connect to signaling server
    await connectToSignalingServer()
    
  } catch (error) {
    console.error('Error connecting to stream:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    ElMessage.error(`Failed to connect to stream: ${errorMessage}`)
    isLoading.value = false
    emit('streamError', error as Error)
  }
}

/**
 * Connect to WebSocket signaling server
 */
const connectToSignalingServer = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      webSocket.value = new WebSocket(signalingServerUrl)
      
      webSocket.value.onopen = () => {
        console.log('✅ Connected to video streaming signaling server')
        loadingMessage.value = 'Requesting stream...'
        
        // Send request to join stream
        webSocket.value?.send(JSON.stringify({
          type: 'join_stream',
          streamId: props.streamInfo?.id,
          user: {
            id: 'viewer',
            name: 'Viewer',
            email: 'viewer@example.com'
          }
        }))
        
        resolve()
      }
      
      webSocket.value.onmessage = async (event) => {
        const data = JSON.parse(event.data)
        console.log('Received signaling message:', data)
        
        switch (data.type) {
          case 'stream_info':
            console.log('📺 Received stream info:', data.stream)
            loadingMessage.value = 'Stream found, waiting for video...'
            
            // Check if streamer is actually streaming
            if (data.stream && data.stream.status === 'live') {
              console.log('📡 Stream is live, waiting for WebRTC connection from streamer...')
              // Set a timeout to show a message if no video comes
              connectionTimeout.value = setTimeout(() => {
                if (isLoading.value && !hasWebRTCStream.value) {
                  loadingMessage.value = 'Waiting for streamer to start video...'
                  ElMessage.info('Stream is live but no video yet. Waiting for streamer to start video.')
                  
                  // Set another timeout to give up
                  setTimeout(() => {
                    if (isLoading.value && !hasWebRTCStream.value) {
                      ElMessage.warning('No video received. The streamer may not be actively streaming video.')
                      loadingMessage.value = 'No video available'
                    }
                  }, 10000)
                }
              }, 5000)
            } else {
              ElMessage.warning('Stream is not currently live')
              isLoading.value = false
            }
            break
            
          case 'stream_offer':
            console.log('📝 Received WebRTC offer')
            if (peerConnection.value) {
              await peerConnection.value.setRemoteDescription(new RTCSessionDescription(data.offer))
              const answer = await peerConnection.value.createAnswer()
              await peerConnection.value.setLocalDescription(answer)
              
              webSocket.value?.send(JSON.stringify({
                type: 'webrtc_answer',
                answer: answer,
                streamId: props.streamInfo?.id
              }))
            }
            break
            
          case 'ice_candidate':
            console.log('🧊 Received ICE candidate')
            if (peerConnection.value) {
              await peerConnection.value.addIceCandidate(new RTCIceCandidate(data.candidate))
            }
            break
            
          case 'stream_ended':
            console.log('Stream ended:', data.reason)
            stopStream()
            break
            
          case 'viewer_joined':
            console.log('👥 Viewer joined:', data.user.name)
            break
            
          case 'error':
            console.error('Stream server error:', data.message)
            ElMessage.error(data.message)
            isLoading.value = false
            break
        }
      }
      
      webSocket.value.onclose = (event) => {
        console.log('❌ Video streaming signaling server disconnected:', event.code, event.reason)
        if (isLoading.value) {
          reject(new Error(`WebSocket connection closed: ${event.code} - ${event.reason}`))
        }
      }
      
      webSocket.value.onerror = (error) => {
        console.error('❌ Video streaming signaling server error:', error)
        console.error('WebSocket URL:', signalingServerUrl)
        reject(new Error(`WebSocket connection failed: ${error}`))
      }
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Stop the current stream
 */
const stopStream = () => {
  if (currentStream.value) {
    currentStream.value.getTracks().forEach(track => track.stop())
    currentStream.value = null
  }
  
  if (webrtcVideoElement.value) {
    webrtcVideoElement.value.srcObject = null
    webrtcVideoElement.value.style.display = 'none'
    if (videoElement.value) {
      videoElement.value.style.display = 'block'
    }
  }
  
  hasWebRTCStream.value = false
  emit('streamEnded')
}

/**
 * Refresh the stream connection
 */
const refreshStream = async () => {
  isRefreshing.value = true
  try {
    stopStream()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
    await connectToStream()
  } catch (error) {
    console.error('Error refreshing stream:', error)
    ElMessage.error('Failed to refresh stream')
  } finally {
    isRefreshing.value = false
  }
}

/**
 * Toggle mute/unmute
 */
const toggleMute = () => {
  if (videoElement.value) {
    videoElement.value.muted = !videoElement.value.muted
    isMuted.value = videoElement.value.muted
  }
  if (webrtcVideoElement.value) {
    webrtcVideoElement.value.muted = !webrtcVideoElement.value.muted
    isMuted.value = webrtcVideoElement.value.muted
  }
}

/**
 * Toggle fullscreen
 */
const toggleFullscreen = () => {
  const element = videoElement.value || webrtcVideoElement.value
  if (!element) return
  
  if (!document.fullscreenElement) {
    element.requestFullscreen().then(() => {
      isFullscreen.value = true
      emit('fullscreenChanged', true)
    }).catch(err => {
      console.error('Error attempting to enable fullscreen:', err)
    })
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false
      emit('fullscreenChanged', false)
    }).catch(err => {
      console.error('Error attempting to exit fullscreen:', err)
    })
  }
}

/**
 * Cleanup resources
 */
const cleanup = () => {
  stopStream()
  
  // Clear any pending timeouts
  if (connectionTimeout.value) {
    clearTimeout(connectionTimeout.value)
    connectionTimeout.value = null
  }
  
  if (peerConnection.value) {
    peerConnection.value.close()
    peerConnection.value = null
  }
  
  if (webSocket.value) {
    webSocket.value.close()
    webSocket.value = null
  }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
  emit('fullscreenChanged', isFullscreen.value)
})
</script>

<style scoped>
.webrtc-video-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: #000;
}

.video-stream,
.webrtc-video-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.no-stream {
  display: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-top: 4px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-stream-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.no-stream-content {
  text-align: center;
  color: #666;
}

.no-stream-content p {
  margin: 8px 0;
}

.stream-info {
  font-size: 14px;
  color: #999;
}

.stream-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.stream-info-display {
  color: white;
  flex: 1;
}

.stream-title {
  font-weight: bold;
  font-size: 16px;
  margin-right: 12px;
}

.stream-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.stream-status.live {
  background: #67C23A;
  color: white;
}

.stream-status.ended {
  background: #909399;
  color: white;
}

.stream-status.connecting {
  background: #E6A23C;
  color: white;
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.control-buttons .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.control-buttons .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

/* Responsive design */
@media (max-width: 768px) {
  .stream-controls {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }
  
  .stream-info-display {
    text-align: center;
  }
  
  .control-buttons {
    justify-content: center;
  }
}
</style>
