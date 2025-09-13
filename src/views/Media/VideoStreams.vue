<template>
  <div class="video-streams-container">
    <!-- Header -->
    <div class="streams-header">
      <h2>Live Video Streams</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refreshStreams" :loading="loading">
          <el-icon><Refresh /></el-icon>
          Refresh
        </el-button>
        <el-button type="success" @click="startNewStream">
          <el-icon><VideoCamera /></el-icon>
          Start Stream
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="Search streams..."
            @input="filterStreams"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-select v-model="selectedCounty" placeholder="Filter by County" @change="filterStreams" clearable>
            <el-option
              v-for="county in counties"
              :key="county"
              :label="county"
              :value="county"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="statusFilter" placeholder="Filter by Status" @change="filterStreams" clearable>
            <el-option label="Live" value="live" />
            <el-option label="Ended" value="ended" />
            <el-option label="All" value="" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="clearFilters">Clear Filters</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- Streams Grid -->
    <div class="streams-grid" v-loading="loading">
      <div v-if="filteredStreams.length === 0 && !loading" class="no-streams">
        <el-empty description="No video streams found">
          <el-button type="primary" @click="startNewStream">Start First Stream</el-button>
        </el-empty>
      </div>
      
      <div v-else class="streams-list">
        <div
          v-for="stream in filteredStreams"
          :key="stream.id"
          class="stream-card"
          @click="viewStream(stream)"
        >
          <!-- Stream Thumbnail/Preview -->
          <div class="stream-preview">
            <div v-if="stream.status === 'live'" class="live-indicator">
              <span class="live-dot"></span>
              LIVE
            </div>
            <div v-else class="ended-indicator">
              <el-icon><VideoPlay /></el-icon>
              ENDED
            </div>
            <div class="stream-duration" v-if="stream.duration">
              {{ formatDuration(stream.duration) }}
            </div>
          </div>

          <!-- Stream Info -->
          <div class="stream-info">
            <h3 class="stream-title">{{ stream.title }}</h3>
            <p class="stream-description">{{ stream.description || 'No description' }}</p>
            
            <div class="stream-meta">
              <div class="streamer-info">
                <el-avatar :size="24" :src="stream.streamer?.photo ? `data:image/png;base64,${stream.streamer.photo}` : ''">
                  {{ stream.streamer?.name?.charAt(0) || 'U' }}
                </el-avatar>
                <span class="streamer-name">{{ stream.streamer?.name || 'Unknown' }}</span>
              </div>
              
              <div class="stream-stats">
                <span v-if="stream.status === 'live'" class="viewer-count">
                  <el-icon><View /></el-icon>
                  {{ stream.viewer_count || 0 }} viewers
                </span>
                <span class="start-time">
                  <el-icon><Clock /></el-icon>
                  {{ formatTime(stream.start_time) }}
                </span>
              </div>
            </div>

            <div class="stream-location" v-if="stream.location">
              <el-icon><Location /></el-icon>
              {{ stream.location }}
              <span v-if="stream.county">, {{ stream.county }}</span>
            </div>

            <div class="stream-settings" v-if="stream.settings">
              <el-tag size="small">{{ stream.settings.resolution }}</el-tag>
              <el-tag size="small" v-if="stream.settings.audio">Audio</el-tag>
              <el-tag size="small" v-if="stream.settings.camera">Camera: {{ stream.settings.camera }}</el-tag>
            </div>
          </div>

          <!-- Stream Actions -->
          <div class="stream-actions">
            <el-button
              v-if="stream.status === 'live'"
              type="primary"
              @click.stop="joinStream(stream)"
              class="join-btn"
            >
              <el-icon><VideoPlay /></el-icon>
              Join Stream
            </el-button>
            <el-button
              v-else
              type="info"
              @click.stop="viewStream(stream)"
              class="view-btn"
            >
              <el-icon><View /></el-icon>
              View Details
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-section" v-if="totalStreams > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalStreams"
        layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <!-- Stream Viewer Dialog -->
    <el-dialog
      v-model="showStreamViewer"
      :title="selectedStream?.title"
      width="90%"
      :before-close="closeStreamViewer"
      class="stream-viewer-dialog"
    >
      <VideoStreamViewer
        v-if="selectedStream"
        :stream="selectedStream"
        @close="closeStreamViewer"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElButton, ElIcon, ElInput, ElSelect, ElOption, ElRow, ElCol, ElEmpty, ElTag, ElAvatar, ElPagination, ElDialog, ElMessage } from 'element-plus'
import { 
  Refresh, VideoCamera, Search, VideoPlay, View, Clock, Location 
} from '@element-plus/icons-vue'
import VideoStreamViewer from '@/components/VideoStreamViewer.vue'
import { getVideoStreams, getActiveStreams, getStreamsByCounty } from '@/api/videoStreams'

// Reactive data
const loading = ref(false)
const streams = ref([])
const searchQuery = ref('')
const selectedCounty = ref('')
const statusFilter = ref('live')
const currentPage = ref(1)
const pageSize = ref(12)
const showStreamViewer = ref(false)
const selectedStream = ref(null)

// Computed properties
const counties = computed(() => {
  const uniqueCounties = [...new Set(streams.value.map(stream => stream.county).filter(Boolean))]
  return uniqueCounties.sort()
})

const filteredStreams = computed(() => {
  let filtered = streams.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(stream => 
      stream.title.toLowerCase().includes(query) ||
      stream.description?.toLowerCase().includes(query) ||
      stream.streamer?.name?.toLowerCase().includes(query)
    )
  }

  // Filter by county
  if (selectedCounty.value) {
    filtered = filtered.filter(stream => stream.county === selectedCounty.value)
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(stream => stream.status === statusFilter.value)
  }

  return filtered
})

const totalStreams = computed(() => filteredStreams.value.length)

// Methods
const fetchStreams = async () => {
  loading.value = true
  try {
    const response = await getActiveStreams()
    if (response.success) {
      streams.value = response.data
    } else {
      ElMessage.error('Failed to fetch streams')
    }
  } catch (error) {
    console.error('Error fetching streams:', error)
    ElMessage.error('Error fetching streams')
  } finally {
    loading.value = false
  }
}

const refreshStreams = () => {
  fetchStreams()
}

const filterStreams = () => {
  // Filtering is handled by computed property
  currentPage.value = 1
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedCounty.value = ''
  statusFilter.value = 'live'
  currentPage.value = 1
}

const startNewStream = () => {
  // Navigate to stream creation or open stream component
  ElMessage.info('Starting new stream...')
  // You can implement navigation to stream creation page here
}

const viewStream = (stream) => {
  selectedStream.value = stream
  showStreamViewer.value = true
}

const joinStream = (stream) => {
  selectedStream.value = stream
  showStreamViewer.value = true
}

const closeStreamViewer = () => {
  showStreamViewer.value = false
  selectedStream.value = null
}

const handlePageChange = (page) => {
  currentPage.value = page
  // Scroll to top of streams
  document.querySelector('.streams-grid')?.scrollIntoView({ behavior: 'smooth' })
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
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

// Lifecycle
onMounted(() => {
  fetchStreams()
  // Auto-refresh every 30 seconds for live streams
  const refreshInterval = setInterval(() => {
    if (statusFilter.value === 'live') {
      fetchStreams()
    }
  }, 30000)

  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
})
</script>

<style scoped>
.video-streams-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.streams-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.streams-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.streams-grid {
  min-height: 400px;
}

.no-streams {
  text-align: center;
  padding: 60px 20px;
}

.streams-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.stream-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.stream-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stream-preview {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.live-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #f56565;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
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

.ended-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #6b7280;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stream-duration {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.stream-info {
  padding: 20px;
}

.stream-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.stream-description {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stream-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.streamer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.streamer-name {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.stream-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.viewer-count, .start-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.stream-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.stream-settings {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.stream-actions {
  padding: 0 20px 20px 20px;
}

.join-btn, .view-btn {
  width: 100%;
  justify-content: center;
}

.pagination-section {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

.stream-viewer-dialog {
  .el-dialog__body {
    padding: 0;
  }
}

@media (max-width: 768px) {
  .streams-list {
    grid-template-columns: 1fr;
  }
  
  .streams-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
}
</style>
