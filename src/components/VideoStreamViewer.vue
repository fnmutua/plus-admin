<template>
  <div class="video-stream-viewer">
    <!-- Stream Header -->
    <div class="stream-header">
      <div class="stream-info">
        <h3>{{ stream.title }}</h3>
        <div class="stream-meta">
          <span class="streamer-name">{{ stream.streamer?.name || 'Unknown' }}</span>
          <span v-if="stream.status === 'live'" class="live-badge">
            <span class="live-dot"></span>
            LIVE
          </span>
          <span v-else class="ended-badge">ENDED</span>
        </div>
      </div>
      <div class="stream-actions">
        <el-button @click="$emit('close')" circle>
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- Video Container -->
    <div class="video-container">
      <div v-if="stream.status === 'live'" class="live-video">
        <div class="video-placeholder">
          <el-icon size="64"><VideoCamera /></el-icon>
          <p>Live Stream Video</p>
          <p class="stream-id">Stream ID: {{ stream.id }}</p>
        </div>
        <div class="live-overlay">
          <div class="viewer-count">
            <el-icon><View /></el-icon>
            {{ stream.viewer_count || 0 }} viewers
          </div>
          <div class="stream-duration" v-if="streamDuration">
            {{ formatDuration(streamDuration) }}
          </div>
        </div>
      </div>
      
      <div v-else class="ended-video">
        <div class="video-placeholder">
          <el-icon size="64"><VideoPlay /></el-icon>
          <p>Stream Ended</p>
          <p class="stream-duration">
            Duration: {{ formatDuration(stream.duration || 0) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Stream Details -->
    <div class="stream-details">
      <div class="details-section">
        <h4>Stream Information</h4>
        <div class="details-grid">
          <div class="detail-item">
            <label>Status:</label>
            <span :class="stream.status">{{ stream.status.toUpperCase() }}</span>
          </div>
          <div class="detail-item">
            <label>Started:</label>
            <span>{{ formatDateTime(stream.start_time) }}</span>
          </div>
          <div class="detail-item" v-if="stream.end_time">
            <label>Ended:</label>
            <span>{{ formatDateTime(stream.end_time) }}</span>
          </div>
          <div class="detail-item" v-if="stream.location">
            <label>Location:</label>
            <span>{{ stream.location }}{{ stream.county ? ', ' + stream.county : '' }}</span>
          </div>
          <div class="detail-item" v-if="stream.settings">
            <label>Quality:</label>
            <span>{{ stream.settings.resolution }}</span>
          </div>
          <div class="detail-item" v-if="stream.settings">
            <label>Bitrate:</label>
            <span>{{ stream.settings.bitrate }} kbps</span>
          </div>
        </div>
      </div>

      <div class="details-section" v-if="stream.description">
        <h4>Description</h4>
        <p>{{ stream.description }}</p>
      </div>

      <div class="details-section" v-if="stream.settings">
        <h4>Stream Settings</h4>
        <div class="settings-grid">
          <div class="setting-item">
            <label>Resolution:</label>
            <el-tag>{{ stream.settings.resolution }}</el-tag>
          </div>
          <div class="setting-item">
            <label>Framerate:</label>
            <el-tag>{{ stream.settings.framerate }} fps</el-tag>
          </div>
          <div class="setting-item">
            <label>Camera:</label>
            <el-tag>{{ stream.settings.camera }}</el-tag>
          </div>
          <div class="setting-item">
            <label>Audio:</label>
            <el-tag :type="stream.settings.audio ? 'success' : 'info'">
              {{ stream.settings.audio ? 'Enabled' : 'Disabled' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <el-button v-if="stream.status === 'live'" type="primary" size="large">
        <el-icon><VideoPlay /></el-icon>
        Join Live Stream
      </el-button>
      <el-button v-else type="info" size="large" disabled>
        <el-icon><VideoPlay /></el-icon>
        Stream Ended
      </el-button>
      <el-button @click="shareStream" size="large">
        <el-icon><Share /></el-icon>
        Share
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElButton, ElIcon, ElTag, ElMessage } from 'element-plus'
import { Close, VideoCamera, VideoPlay, View, Share } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  stream: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['close'])

// Reactive data
const streamDuration = ref(0)
const durationInterval = ref(null)

// Computed
const isLive = computed(() => props.stream.status === 'live')

// Methods
const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const shareStream = () => {
  const url = `${window.location.origin}/media/streams/${props.stream.id}`
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('Stream link copied to clipboard!')
  }).catch(() => {
    ElMessage.error('Failed to copy link')
  })
}

const startDurationTimer = () => {
  if (isLive.value) {
    const startTime = new Date(props.stream.start_time)
    durationInterval.value = setInterval(() => {
      const now = new Date()
      streamDuration.value = Math.floor((now - startTime) / 1000)
    }, 1000)
  }
}

const stopDurationTimer = () => {
  if (durationInterval.value) {
    clearInterval(durationInterval.value)
    durationInterval.value = null
  }
}

// Lifecycle
onMounted(() => {
  startDurationTimer()
})

onUnmounted(() => {
  stopDurationTimer()
})
</script>

<style scoped>
.video-stream-viewer {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.stream-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.stream-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #303133;
}

.stream-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.streamer-name {
  color: #606266;
  font-weight: 500;
}

.live-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f56565;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.ended-badge {
  background: #6b7280;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.video-container {
  position: relative;
  background: #000;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.live-video, .ended-video {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  text-align: center;
}

.video-placeholder p {
  margin: 10px 0;
  font-size: 18px;
}

.stream-id {
  font-size: 14px;
  color: #ccc;
}

.live-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.viewer-count, .stream-duration {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stream-details {
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.details-section {
  margin-bottom: 20px;
}

.details-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.detail-item span {
  font-size: 14px;
  color: #606266;
}

.detail-item span.live {
  color: #f56565;
  font-weight: bold;
}

.detail-item span.ended {
  color: #6b7280;
  font-weight: bold;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.action-buttons {
  padding: 20px;
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .settings-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
