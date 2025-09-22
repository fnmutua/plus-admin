<script setup lang="ts">


import {
  Filter
} from '@element-plus/icons-vue'

import { ref, onMounted, onUnmounted } from 'vue'
import {
  ElButton, ElCol, ElTooltip, ElPopover,
  ElRow, ElCard, ElImage, ElSelect, ElMessage, ElTag,
  ElDialog, ElTabs, ElTabPane
} from 'element-plus'
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import WebRTCVideoPlayer from '@/components/WebRTCVideoPlayer.vue';

import {
  searchStreams,
  getVideoStreams
} from '@/api/streams'
 

const model = 'VideoStream'


// component for docuemnts 
const tableDataList = ref<any[]>([])

const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const totalItems = ref(0)
const total = ref(0)


const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

const loading = ref(false)
onMounted(async () => {
  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check

  // Load initial data - streams with live tab as default
  await loadActiveStreams()
  activeTab.value = 'live'
  tableDataList.value = liveStreams.value
  
  // Auto-refresh disabled by request
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('resize', updatePageSize);
  // No interval to clear (auto-refresh disabled)
})












const page = ref(1)







// Computed Property for Paginated Data

const search_string = ref()



const filters = ref()
const filterValues = ref() // make sure the inner array is array





const handleClear = async () => {
  console.log('cleared....')
  search_string.value = ''
  await getFilteredData(filters.value, filterValues.value)
}

// Load all streams (both live and non-live)
const loadActiveStreams = async (skipTabUpdate = false) => {
  loading.value = true
  try {
    // Try to get all streams, fallback to search if /all fails
    let res
    try {
      res = await getVideoStreams() as any
    } catch (error) {
      console.warn('getVideoStreams failed, trying search endpoint:', error)
      // Fallback to search endpoint to get all streams
      res = await searchStreams({ limit: 100 }) as any
    }
    
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      // Separate live and not live streams
      liveStreams.value = res.data.data.filter(stream => stream.status === 'live')
      notLiveStreams.value = res.data.data.filter(stream => stream.status !== 'live')
      
      // Set the current tab data only if not called from tab change
      if (!skipTabUpdate) {
        if (activeTab.value === 'live') {
          tableDataList.value = liveStreams.value
        } else {
          tableDataList.value = notLiveStreams.value
        }
      }
      
      totalItems.value = res.data.data.length
      
      // Fetch thumbnails for each stream
      res.data.data.forEach(async (stream) => {
        await fetchStreamThumbnail(stream)
      })
    } else {
      console.error('Error fetching streams:', res)
      ElMessage.error('Failed to fetch streams')
    }
  } catch (error) {
    console.error('Error in loadActiveStreams:', error)
    ElMessage.error('Failed to fetch streams')
  } finally {
    loading.value = false
  }
}


const getFilteredData = async (selFilters, selfilterValues) => {
  loading.value = true
  
  try {
    // Calculate offset for pagination
    const offset = (page.value - 1) * pageSize.value
    
    // Prepare query parameters
    const params: any = {
      limit: pageSize.value,
      offset: offset
    }
    
    // Add status filter if needed
    if (selFilters && selfilterValues) {
      // You can add more filter logic here based on your needs
      if (selfilterValues.status) {
        params.status = selfilterValues.status
      }
    }

    console.log('Fetching streams with params:', params)
    const res = await getVideoStreams(params) as any

    console.log('Streams collected........', res)

    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      tableDataList.value = res.data.data
      totalItems.value = res.data.data.length
      
      // Fetch thumbnails for each stream
      tableDataList.value.forEach(async (stream) => {
        await fetchStreamThumbnail(stream)
      })
    } else {
      console.error('Error fetching streams:', res)
      ElMessage.error('Failed to fetch streams')
      tableDataList.value = []
    }
  } catch (error) {
    console.error('Error in getFilteredData:', error)
    ElMessage.error('Failed to fetch streams')
    tableDataList.value = []
  } finally {
    loading.value = false
  }
}


const getFilteredBySearchData = async (searchKey) => {
  loading.value = true
  searchLoading.value = true
  
  try {
    console.log('search_string.value', search_string.value)
    
    // Calculate offset for pagination
    const offset = (page.value - 1) * pageSize.value
    
    // Prepare search parameters
    const params: any = {
      q: searchKey,
      limit: pageSize.value,
      offset: offset
    }
    
    // Add additional filters if needed
    if (filters.value && filterValues.value) {
      if (filterValues.value.county) {
        params.county = filterValues.value.county
      }
      if (filterValues.value.status) {
        params.status = filterValues.value.status
      }
    }

    console.log('Searching streams with params:', params)
    const res = await searchStreams(params) as any
    
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      tableDataList.value = res.data.data
      total.value = res.data.data.length
      console.log('tableDataList.value', tableDataList.value)
    } else {
      console.error('Error searching streams:', res)
      ElMessage.error('Failed to search streams')
      tableDataList.value = []
    }
  } catch (error) {
    console.error('Error in getFilteredBySearchData:', error)
    ElMessage.error('Failed to search streams')
    tableDataList.value = []
  } finally {
    searchLoading.value = false
    loading.value = false
  }
}

const searchByNewName = async (filterString: any) => {

  getFilteredBySearchData(filterString)
}





const searchLoading = ref()
const associated_multiple_models = []

// Stream viewing variables
const selectedStream = ref<any>(null)
const showStreamDialog = ref(false)
const activeTab = ref('live')
const liveStreams = ref<any[]>([])
const notLiveStreams = ref<any[]>([])













// Initial data load is now handled in onMounted
// Ensure we open the most up-to-date stream object from server
const refreshSingleStream = async (streamId) => {
  try {
    const res = await getVideoStreams({ limit: 100 }) as any
    if (res?.data?.success && Array.isArray(res.data.data)) {
      const latest = res.data.data.find((s: any) => s.id === streamId)
      return latest || null
    }
  } catch (e) {
    console.error('Failed to refresh single stream:', e)
  }
  return null
}

const watchStream = async (stream) => {
  console.log('Watching stream:', stream)
  
  // fetch freshest info for this stream before opening
  const latest = await refreshSingleStream(stream.id)
  if (!latest) {
    ElMessage.error('Video cannot be found. It may have ended.')
    return
  }
  if (latest.status !== 'live') {
    ElMessage.warning('This stream is not currently live')
    return
  }
  
  selectedStream.value = latest
  showStreamDialog.value = true
  ElMessage.info(`Opening stream: ${latest.title}`)
}























const fetchStreamThumbnail = async (stream) => {
  const thumbnailSrc = await getStreamThumbnail(stream); // Assuming getStreamThumbnail returns the Base64 image
  stream.thumbnailSrc = thumbnailSrc; // Assign the fetched stream thumbnail to the stream object
};



async function getStreamThumbnail(stream) {
  // For streams, we might have a thumbnail URL or need to generate one
  // This is a placeholder - adjust based on your stream data structure
  if (stream.thumbnailUrl) {
    return stream.thumbnailUrl;
  }

  // If no thumbnail URL, return a placeholder or generate one
  console.log("No thumbnail found for stream:", stream.title);
  return null;
}


// Stream dialog handlers
const videoPlayerRef = ref<any>(null)

const handleStreamDialogClose = () => {
  // Set keepAlive to prevent stream cleanup when dialog closes
  if (videoPlayerRef.value) {
    videoPlayerRef.value.keepAlive = true
  }
  showStreamDialog.value = false;
  // Don't clear selectedStream to keep it alive
};

const handleStreamStarted = (stream: MediaStream) => {
  console.log('Stream started:', stream);
  ElMessage.success('Stream connected successfully!');
};

const handleStreamEnded = () => {
  console.log('Stream ended');
  ElMessage.info('Stream ended');
};

const handleStreamError = (error: Error) => {
  console.error('Stream error:', error);
  ElMessage.error('Stream error: ' + error.message);
};

const handleFullscreenChanged = (isFullscreen: boolean) => {
  console.log('Fullscreen changed:', isFullscreen);
};

const refreshStream = () => {
  if (selectedStream.value) {
    // Force refresh by closing and reopening the stream
    const streamId = selectedStream.value.id;
    selectedStream.value = null;
    setTimeout(() => {
      selectedStream.value = tableDataList.value.find(s => s.id === streamId);
    }, 100);
  }
};

// Handle tab change
const handleTabChange = async (tabName: string) => {
  activeTab.value = tabName;
  
  // Automatically load streams when tab changes
  await loadActiveStreams(true); // Skip tab update to avoid double setting
  
  // Set the appropriate data for the selected tab
  if (tabName === 'live') {
    tableDataList.value = liveStreams.value;
  } else {
    tableDataList.value = notLiveStreams.value;
  }
};











</script>

<template>
  <el-card>

    <el-row :gutter="10" style="margin-bottom:10px;">
      <el-col :xs="24" :sm="24" :md="20" :lg="20">
        <el-select 
          v-model="search_string" 
          multiple 
          clearable 
          filterable 
          remote 
          :remote-method="searchByNewName"
          reserve-keyword 
          no-match-text='' 
          placeholder="Search a stream by its title or part of it ..."
          style=" margin-right: 5px;" />


      </el-col>

      <el-col :xs="24" :sm="24" :md="12" :lg="4">
        <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">
          <el-tooltip content="Load Active Streams" placement="top">
            <el-button @click="() => loadActiveStreams()" type="success" :loading="loading">
              Live Streams
            </el-button>
          </el-tooltip>
          
          <!-- Auto-refresh control removed -->
          
          <el-tooltip content="Clear" placement="top">
            <el-button @click="handleClear" type="primary" :icon="Filter" />
          </el-tooltip>

          <DownloadCustom :data="tableDataList" :model="model" :associated_models="associated_multiple_models" />
        </div>
      </el-col>
    </el-row>


    <!-- Stream Tabs -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange" type="card" style="margin-bottom: 20px;">
      <el-tab-pane label="Live Streams" name="live">
        <div v-if="liveStreams.length === 0" style="text-align: center; padding: 40px; color: #999;">
          <i class="el-icon-video-camera" style="font-size: 48px; margin-bottom: 16px;"></i>
          <p>No live streams available</p>
        </div>
        <el-row :gutter="20" justify="start" v-else>
          <el-col :span="8" :xs="24" :sm="12" :md="8" v-for="stream in liveStreams" :key="stream.id">
            <el-card class="stream-card" shadow="hover" style="height: 95%;">
              <template #header>
                <el-popover placement="bottom" width="30%" trigger="hover" :content="stream.title">
                  <template #reference>
                    <h2 class="stream-title">{{ stream.title }}</h2>
                  </template>
                </el-popover>
              </template>

              <div class="stream-content" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                
 

                <!-- Stream Info -->
                <div class="stream-info" style="text-align: center; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 10px 0; color: #409EFF;">{{ stream.streamer?.name || 'Unknown Streamer' }}</h3>
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    Started: {{ new Date(stream.start_time).toLocaleString() }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="stream-actions-row" style="text-align: center;">
                  <el-button 
                    v-if="stream.status === 'live'" 
                    type="primary" 
                    size="large"
                    @click="watchStream(stream)"
                    style="width: 100%;">
                    ▶️ Watch Live
                  </el-button>
                  <el-button 
                    v-else-if="stream.status === 'ended'" 
                    type="info" 
                    size="large"
                    disabled
                    style="width: 100%;">
                    ⏹️ Stream Ended
                  </el-button>
                  <el-button 
                    v-else 
                    type="warning" 
                    size="large"
                    disabled
                    style="width: 100%;">
                    ⚠️ Not Available
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
      
      <el-tab-pane label="Not Live" name="not-live">
        <div v-if="notLiveStreams.length === 0" style="text-align: center; padding: 40px; color: #999;">
          <i class="el-icon-video-camera" style="font-size: 48px; margin-bottom: 16px;"></i>
          <p>No non-live streams available</p>
        </div>
        <el-row :gutter="20" justify="start" v-else>
          <el-col :span="8" :xs="24" :sm="12" :md="8" v-for="stream in notLiveStreams" :key="stream.id">
            <el-card class="stream-card" shadow="hover" style="height: 95%;">
              <template #header>
                <el-popover placement="bottom" width="30%" trigger="hover" :content="stream.title">
                  <template #reference>
                    <h2 class="stream-title">{{ stream.title }}</h2>
                  </template>
                </el-popover>
              </template>

              <div class="stream-content" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
                <!-- Stream Thumbnail -->
                <el-image v-if="stream.thumbnailSrc" :src="stream.thumbnailSrc" fit="cover" style="width: 100%; height: 150px;">
                  <template #placeholder>
                    <div class="image-placeholder">Loading...</div>
                  </template>
                  <template #error>
                    <div class="image-error">Failed to load</div>
                  </template>
                </el-image>

                <el-image v-else :src="'/placeholder.jpg'" fit="cover" style="width: 100%; height: 150px;" />

                <!-- Stream Info -->
                <div class="stream-info" style="text-align: center; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 10px 0; color: #409EFF;">{{ stream.streamer?.name || 'Unknown Streamer' }}</h3>
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    Started: {{ new Date(stream.start_time).toLocaleString() }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="stream-actions-row" style="text-align: center;">
                  <el-button 
                    v-if="stream.status === 'live'" 
                    type="primary" 
                    size="large"
                    @click="watchStream(stream)"
                    style="width: 100%;">
                    ▶️ Watch Live
                  </el-button>
                  <el-button 
                    v-else-if="stream.status === 'ended'" 
                    type="info" 
                    size="large"
                    disabled
                    style="width: 100%;">
                    ⏹️ Stream Ended
                  </el-button>
                  <el-button 
                    v-else 
                    type="warning" 
                    size="large"
                    disabled
                    style="width: 100%;">
                    ⚠️ Not Available
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- Old stream list (hidden) -->
    <el-row :gutter="20" justify="start" style="display: none;">
      <el-col :span="8" :xs="24" :sm="12" :md="8" v-for="stream in tableDataList" :key="stream.id">
        <el-card class="stream-card" shadow="hover" style="height: 95%;">
          <template #header>
            <el-popover placement="bottom" width="30%" trigger="hover" :content="stream.title">
              <template #reference>
                <h2 class="stream-title">{{ stream.title }}</h2>
              </template>
            </el-popover>
          </template>

          <div class="stream-content" style="height: 100%;">
            <!-- Stream Thumbnail -->
            <el-image v-if="stream.thumbnailSrc" :src="stream.thumbnailSrc" fit="cover" style="width: 100%; height: 150px;">
              <template #placeholder>
                <div class="image-placeholder">Loading...</div>
              </template>
              <template #error>
                <div class="image-error">Failed to load</div>
              </template>
            </el-image>

            <el-image v-else :src="'/placeholder.jpg'" fit="cover" style="width: 100%; height: 150px;" />

            <!-- Stream Description (Truncate if too long) -->
            <p 
              class="stream-description"
              style="display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
              {{ stream.description }}
            </p>

            <!-- Stream Info -->
            <div class="stream-info" style="margin-bottom: 10px;">
              <p><strong>Status:</strong> 
                <el-tag 
                  :type="stream.status === 'live' ? 'success' : stream.status === 'ended' ? 'info' : 'warning'">
                  {{ stream.status || 'Unknown' }}
                </el-tag>
              </p>
              <p v-if="stream.streamer"><strong>Streamer:</strong> {{ stream.streamer.name || 'Unknown' }}</p>
            </div>

            <!-- Actions -->
            <div 
              class="stream-actions-row"
              style="display: flex; align-items: center; justify-content: space-between; margin-bottom:5px">
              <el-button 
                v-if="stream.status === 'live'" 
                type="primary" 
                @click="watchStream(stream)">
                Watch Live
              </el-button>
              <el-button 
                v-else-if="stream.status === 'ended'" 
                type="info" 
                disabled
              >
                Stream Ended
              </el-button>
              <el-button 
                v-else 
                type="warning" 
                disabled
              >
                Not Available
              </el-button>
            </div>

           

          </div>
        </el-card>
      </el-col>
    </el-row>

  </el-card>

  <!-- Simple Video Player Dialog -->
  <el-dialog
    v-model="showStreamDialog"
    :title="selectedStream?.title || 'Live Stream'"
    width="80%"
    :before-close="handleStreamDialogClose"
    :destroy-on-close="false"
  >
    <div v-if="selectedStream && selectedStream.status === 'live'" style="height: 60vh;">
      <WebRTCVideoPlayer
        ref="videoPlayerRef"
        :stream-info="selectedStream"
        @stream-started="handleStreamStarted"
        @stream-ended="handleStreamEnded"
        @stream-error="handleStreamError"
        @fullscreen-changed="handleFullscreenChanged"
      />
    </div>
    <div v-else style="text-align: center; padding: 50px; color: #999;">
      <i class="el-icon-video-camera" style="font-size: 48px; margin-bottom: 16px;"></i>
      <p>Stream is not available or not live</p>
    </div>
    
    
  </el-dialog>

</template>



<style scoped>
.upload-demo {
  width: 300px;
}

.template-link {
  text-decoration: underline;
  color: #409EFF;
  /* Optional: change link color */
}




.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .el-pagination {
    font-size: 12px;
    /* Adjust font size for small screens */
  }

  .el-pagination .el-pagination__sizes {
    display: none;
    /* Hide size selector on small screens */
  }

  .el-pagination .el-pagination__total {
    display: none;
    /* Hide total count on small screens */
  }



}
</style>



<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .rejected-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .referred-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  --el-table-tr-text-color: var(--el-color-warning);
  color: var(--el-table-tr-text-color);
}

.el-table .escalated-row {
  --el-table-tr-bg-color: var(--el-color-secondary);
  --el-table-tr-text-color: var(--el-color-secondary);
  color: var(--el-table-tr-text-color);
}

.el-table .resolved-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .closed-row {
  --el-table-tr-bg-color: var(--el-color-info-light-9);
  --el-table-tr-text-color: var(--el-color-info);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}


.basemap {
  width: 100%;
  height: 65vh;
}
</style>

<style scoped>
.stream-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.stream-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.stream-title {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 1em;
}

.stream-description {
  margin-bottom: 1em;
}

.attachments {
  margin-top: 1em;
}

.image-placeholder,
.image-error {
  text-align: center;
  padding: 50px;
  font-size: 1.2em;
}

.el-card {
  height: 100%;
}



.stream-title {
  font-size: 1em;
  font-weight: bold;
  margin-bottom: 1em;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  /* Truncate after 1 line */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}



.el-popper.is-customized {
  /* Set padding to ensure the height is 32px */
  padding: 6px 12px;
  background: linear-gradient(90deg, rgb(233, 12, 12), rgb(229, 174, 129));
}
</style>