<template>
  <div class="webrtc-player">
    <!-- Remote video -->
    <video
      ref="videoRef"
      autoplay
      playsinline
      controls
      class="webrtc-video"
    ></video>

    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <!-- Overlay message if no stream -->
    <div v-if="!hasStream && !isLoading" class="overlay">
      <p>No video stream available</p>
    </div>

    <!-- Reconnecting banner -->
    <div v-if="reconnecting" class="reconnecting-banner">
      <div class="reconnecting-spinner"></div>
      <span>Reconnecting... ({{ reconnectAttempts }}/{{ maxReconnectAttempts }})</span>
    </div>

    <!-- Stream Info -->
    <div class="stream-info" v-if="props.streamInfo?.id">
      <span class="stream-id">ID: {{ props.streamInfo.id }}</span>
    </div>

    <!-- Controls -->
    <div class="controls" v-if="hasStream">
      <el-button size="small" type="primary" @click="toggleFullscreen">
        {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
      </el-button>
      <el-button size="small" type="info" @click="toggleMute">
        {{ isMuted ? 'Unmute' : 'Mute' }}
      </el-button>
      <el-button size="small" type="warning" @click="refreshStream" :loading="isRefreshing">
        Refresh
      </el-button>
    </div>
    
    <!-- Loading controls -->
    <div class="controls" v-if="!hasStream && isLoading">
      <el-button size="small" type="danger" @click="forceRefresh" :loading="isRefreshing">
        Force Refresh
      </el-button>
      <el-button size="small" type="info" @click="refreshStream" :loading="isRefreshing">
        Retry Connection
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElButton, ElMessage } from 'element-plus'

/**
 * Props: optional metadata about the stream
 */
interface Props {
  streamInfo?: any
  streamUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  streamInfo: null,
  streamUrl: ''
})

/**
 * Emits
 */
const emit = defineEmits<{
  (e: 'stream-started', stream: MediaStream): void
  (e: 'stream-ended'): void
  (e: 'stream-error', error: Error): void
  (e: 'fullscreen-changed', isFullscreen: boolean): void
}>()

/**
 * State
 */
const videoRef = ref<HTMLVideoElement | null>(null)
const hasStream = ref(false)
const isFullscreen = ref(false)
const isMuted = ref(false)
const isLoading = ref(false)
const isRefreshing = ref(false)
const loadingMessage = ref('Connecting to stream...')
let currentStream: MediaStream | null = null

// WebRTC related
const peerConnection = ref<RTCPeerConnection | null>(null)
const webSocket = ref<WebSocket | null>(null)
const connectionTimeout = ref<NodeJS.Timeout | null>(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 3
const reconnecting = ref(false)
const keepAlive = ref(false)

// WebRTC Configuration (supports optional env TURN/STUN)
const envIce: RTCIceServer[] = []
const envStun = (import.meta as any)?.env?.VITE_STUN_URLS as string | undefined
if (envStun) {
  const stunUrls = envStun.split(',').map((u: string) => u.trim()).filter(Boolean)
  if (stunUrls.length) envIce.push({ urls: stunUrls })
}
const turnUrl = (import.meta as any)?.env?.VITE_TURN_URL as string | undefined
const turnUser = (import.meta as any)?.env?.VITE_TURN_USERNAME as string | undefined
const turnCred = (import.meta as any)?.env?.VITE_TURN_CREDENTIAL as string | undefined
if (turnUrl && turnUser && turnCred) {
  const turnUrls = turnUrl.split(',').map((u: string) => u.trim()).filter(Boolean)
  if (turnUrls.length) envIce.push({ urls: turnUrls, username: turnUser, credential: turnCred })
}
const defaultIce: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
]
const webrtcConfig: RTCConfiguration = {
  iceServers: envIce.length > 0 ? envIce : defaultIce
}

// WebSocket URL for signaling - auto-detect environment and host
const protocolIsSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
const hostName = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const envUrl = (import.meta as any)?.env?.VITE_VIDEO_STREAM_WS_URL
// If env var provided, use it. Otherwise:
// - In production behind reverse-proxy, assume same-origin path `/video-stream`
// - In local dev, use ws://localhost:3002/video-stream
const signalingServerUrl = envUrl && typeof envUrl === 'string' && envUrl.length > 0
  ? envUrl
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? `${protocolIsSecure ? 'wss' : 'ws'}://${hostName}/video-stream`
      : `ws://localhost:3002/video-stream`)

/**
 * Mount lifecycle
 */
onMounted(() => {

  console.log ('signalingServerUrl ---> ',signalingServerUrl)
  if (props.streamInfo?.status === 'live') {
    connectToStream()
  }
})

/**
 * Cleanup lifecycle
 */
onUnmounted(() => {
  cleanup()
})

// Watch for stream info changes
watch(() => props.streamInfo, (newInfo) => {
  if (newInfo?.status === 'live' && !hasStream.value) {
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
    
    // Handle incoming stream (guard against duplicate ontrack and autoplay AbortError)
    peerConnection.value.ontrack = (event) => {
      const stream = event.streams[0]
      console.log('🎥 Remote stream received:', stream)

      // If we already set the same stream, ignore duplicate ontrack
      if (hasStream.value && videoRef.value && videoRef.value.srcObject === stream) {
        console.log('🔁 Duplicate ontrack ignored')
        return
      }

      currentStream = stream
      
      if (videoRef.value) {
        if (videoRef.value.srcObject !== stream) {
          videoRef.value.srcObject = stream
        }
        // Ensure muted for autoplay policies
        if (videoRef.value.muted !== true) {
          videoRef.value.muted = true
        }
        const playPromise = videoRef.value.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(err => {
            if (err && (err.name === 'AbortError' || err.code === 20)) {
              console.log('🔄 play() aborted by a new load; retrying shortly')
              setTimeout(() => {
                if (videoRef.value) {
                  videoRef.value.play().catch(() => {})
                }
              }, 150)
            } else {
              console.error('play() failed:', err)
              emit('stream-error', err as Error)
            }
          })
        }
      }
      
      hasStream.value = true
      isLoading.value = false
      
      // Clear any pending timeouts
      if (connectionTimeout.value) {
        clearTimeout(connectionTimeout.value)
        connectionTimeout.value = null
      }
      
      emit('stream-started', stream)
    }
    
    // Handle connection state changes
    peerConnection.value.onconnectionstatechange = () => {
      console.log('WebRTC connection state:', peerConnection.value?.connectionState)
      
      if (peerConnection.value?.connectionState === 'failed') {
        tryReconnect('failed')
      } else if (peerConnection.value?.connectionState === 'connected') {
        console.log('🎉 WebRTC connection established!')
        ElMessage.success('Video connection established!')
        reconnectAttempts.value = 0
        reconnecting.value = false
      } else if (peerConnection.value?.connectionState === 'connecting') {
        console.log('🔄 WebRTC connecting...')
        loadingMessage.value = 'Connecting to video stream...'
      } else if (peerConnection.value?.connectionState === 'disconnected') {
        tryReconnect('disconnected')
      }
    }

    // ICE layer transitions can also indicate transient drops
    peerConnection.value.oniceconnectionstatechange = () => {
      const s = peerConnection.value?.iceConnectionState
      console.log('ICE state:', s)
      if (s === 'failed' || s === 'disconnected') {
        tryReconnect(`ice-${s}`)
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
    emit('stream-error', error as Error)
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
        console.log('🔗 WebSocket URL:', signalingServerUrl)
        console.log('📡 Stream ID:', props.streamInfo?.id)
        loadingMessage.value = 'Requesting stream...'
        
        // Send request to join stream
        const joinMessage = {
          type: 'join_stream',
          streamId: props.streamInfo?.id,
          user: {
            id: 'viewer',
            name: 'Viewer',
            email: 'viewer@example.com'
          }
        }
        console.log('📤 Sending join stream message:', joinMessage)
        webSocket.value?.send(JSON.stringify(joinMessage))
        
        resolve()
      }
      
      webSocket.value.onmessage = async (event) => {
        const data = JSON.parse(event.data)
        console.log('📨 Received signaling message:', data)
        
        switch (data.type) {
          case 'stream_info':
            console.log('📺 Received stream info:', data.stream)
            loadingMessage.value = 'Stream found, waiting for video...'
            
            // Check if streamer is actually streaming
            if (data.stream && data.stream.status === 'live') {
              console.log('📡 Stream is live, waiting for WebRTC connection from streamer...')
              console.log('🔍 Stream details:', {
                id: data.stream.id,
                title: data.stream.title,
                status: data.stream.status,
                startTime: data.stream.startTime
              })
              
              // Set a timeout to show a message if no video comes
              connectionTimeout.value = setTimeout(() => {
                if (isLoading.value && !hasStream.value) {
                  console.log('⏰ 5 seconds passed, no video received yet')
                  loadingMessage.value = 'Waiting for streamer to start video...'
                  ElMessage.info('Stream is live but no video yet. Waiting for streamer to start video.')
                  
                  // Set another timeout to give up
                  setTimeout(() => {
                    if (isLoading.value && !hasStream.value) {
                      console.log('⏰ 15 seconds passed, still no video')
                      ElMessage.warning('No video received. The streamer may not be actively streaming video.')
                      loadingMessage.value = 'No video available - Try refreshing or check if streamer is connected'
                    }
                  }, 10000)
                }
              }, 5000)
            } else {
              console.log('❌ Stream is not live:', data.stream?.status)
              ElMessage.warning('Stream is not currently live')
              isLoading.value = false
            }
            break
            
          case 'stream_offer':
            console.log('📝 Received WebRTC offer')
            if (peerConnection.value) {
              try {
                console.log('🔧 Setting remote description...')
                await peerConnection.value.setRemoteDescription(new RTCSessionDescription(data.offer))
                console.log('✅ Remote description set successfully')
                
                console.log('🔧 Creating answer...')
                const answer = await peerConnection.value.createAnswer()
                console.log('✅ Answer created successfully')
                
                console.log('🔧 Setting local description...')
                await peerConnection.value.setLocalDescription(answer)
                console.log('✅ Local description set successfully')
                
                console.log('📤 Sending answer to streamer...')
                webSocket.value?.send(JSON.stringify({
                  type: 'webrtc_answer',
                  answer: answer,
                  streamId: props.streamInfo?.id
                }))
                console.log('✅ Answer sent successfully')
              } catch (error) {
                console.error('❌ Error in WebRTC offer handling:', error)
                const errMsg = error instanceof Error ? error.message : String(error)
                ElMessage.error('WebRTC connection failed: ' + errMsg)
              }
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
        if (!reconnecting.value && isLoading.value) {
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
  console.log('🛑 Stream ended')
  hasStream.value = false
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop())
    currentStream = null
  }
  emit('stream-ended')
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

// Attempt reconnection with simple exponential backoff
const tryReconnect = (reason: string) => {
  console.warn('Attempting reconnect due to:', reason)
  if (reconnectAttempts.value >= maxReconnectAttempts) {
    ElMessage.error('Connection failed. Try refreshing.')
    isLoading.value = false
    reconnecting.value = false
    return
  }
  reconnecting.value = true
  reconnectAttempts.value += 1
  const backoffMs = Math.min(5000, 500 * Math.pow(2, reconnectAttempts.value))
  setTimeout(async () => {
    try {
      await refreshStream()
    } catch (e) {
      console.error('Reconnect attempt failed:', e)
    }
  }, backoffMs)
}

// Expose keepAlive for parent to control
defineExpose({ keepAlive })

/**
 * Force refresh - completely restart the connection
 */
const forceRefresh = async () => {
  isRefreshing.value = true
  try {
    console.log('🔄 Force refreshing stream connection...')
    
    // Clean up everything
    cleanup()
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Restart connection
    await connectToStream()
    
    ElMessage.info('Force refresh completed')
  } catch (error) {
    console.error('Error in force refresh:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    ElMessage.error('Force refresh failed: ' + errMsg)
  } finally {
    isRefreshing.value = false
  }
}

/**
 * Toggle mute/unmute
 */
const toggleMute = () => {
  if (videoRef.value) {
    videoRef.value.muted = !videoRef.value.muted
    isMuted.value = videoRef.value.muted
  }
}

/**
 * Handle fullscreen toggle
 */
const toggleFullscreen = async () => {
  if (!videoRef.value) return
  try {
    if (!document.fullscreenElement) {
      await videoRef.value.requestFullscreen()
      isFullscreen.value = true
      emit('fullscreen-changed', true)
    } else {
      await document.exitFullscreen()
      isFullscreen.value = false
      emit('fullscreen-changed', false)
    }
  } catch (err) {
    console.error('Fullscreen toggle failed', err)
  }
}

/**
 * Cleanup resources
 */
const cleanup = (force = false) => {
  if (keepAlive.value && !force) {
    console.log('Skipping cleanup to keep stream alive')
    return
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop())
    currentStream = null
  }
  
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
  keepAlive.value = false
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
  isFullscreen.value = !!document.fullscreenElement
  emit('fullscreen-changed', isFullscreen.value)
})
</script>

<style scoped>
.webrtc-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: black;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
}

.webrtc-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
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

.overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  background: rgba(0, 0, 0, 0.6);
  padding: 10px 20px;
  border-radius: 8px;
}

.controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
}

.controls .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.controls .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.stream-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  z-index: 5;
}

.stream-id {
  color: #00ff00;
  font-weight: bold;
}

.reconnecting-banner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 15;
}

.reconnecting-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #333;
  border-top: 2px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Responsive design */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    gap: 8px;
    bottom: 10px;
    right: 10px;
  }
}
</style>
