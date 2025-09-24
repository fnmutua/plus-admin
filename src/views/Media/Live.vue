<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { ElTable, ElTableColumn, ElButton, ElMessage, ElDialog, ElTag, ElIcon ,ElCard} from "element-plus";
import { VideoPlay, Connection, Close } from "@element-plus/icons-vue";
import { webrtcService, type StreamInfo } from "@/services/webrtc";

const streams = ref<StreamInfo[]>([]);
const loading = ref(false);
const connecting = ref(false);
const showPlayer = ref(false);
const selectedStream = ref<StreamInfo | null>(null);
const connectionStatus = ref("disconnected");
const videoRef = ref<HTMLVideoElement | null>(null);
const isConnected = ref(false);

async function loadStreams() {
  loading.value = true;
  try {
    // Get streams from signaling server via nginx proxy
    const signalingServerUrl = 'https://kesmis.go.ke/stream';
    const response = await fetch(`${signalingServerUrl}/streams`);
    
    if (response.ok) {
      const res = await response.json();
      console.log("📡 Signaling Server Response:", res);
      
      if (res.success && Array.isArray(res.data)) {
        streams.value = res.data;
        console.log("📺 Active streams:", res.data);
        
        if (res.data.length === 0) {
          ElMessage.info("No active streams available");
        } else {
          ElMessage.success(`Found ${res.data.length} active stream(s)`);
        }
      } else {
        console.error("❌ Invalid signaling server response:", res);
        ElMessage.error("Invalid response from signaling server");
        streams.value = [];
      }
    } else {
      console.error("❌ Failed to fetch streams from signaling server");
      ElMessage.error("Failed to connect to signaling server");
      streams.value = [];
    }
  } catch (err) {
    console.error("❌ Error fetching streams:", err);
    ElMessage.error("Error fetching streams: " + (err as Error).message);
    streams.value = [];
  } finally {
    loading.value = false;
  }
}

async function connectToServer() {
  console.log("🔌 connectToServer called");
  if (connecting.value) {
    console.log("⚠️ Already connecting, skipping...");
    return;
  }
  
  connecting.value = true;
  console.log("🔄 Starting connection process...");
  
  try {
    console.log("🚀 Initializing WebRTC service with diagnostics...");
    await webrtcService.initialize();
    
    console.log("📡 Calling webrtcService.connectToSignalingServer()...");
    const connected = await webrtcService.connectToSignalingServer('https://kesmis.go.ke');
    console.log("📊 Connection result:", connected);
    
    if (connected) {
      console.log("✅ Connection successful, updating UI state...");
      isConnected.value = true;
      connectionStatus.value = "connected";
      ElMessage.success("Connected to signaling server");
      
      // Set up event handlers
      console.log("🎧 Setting up event handlers...");
      webrtcService.setEvents({
        onStreamEnded: () => {
          console.log("📡 Stream ended event received");
          ElMessage.warning("Stream ended by broadcaster");
          showPlayer.value = false;
          selectedStream.value = null;
        },
        onViewerJoined: (data) => {
          console.log("👥 Viewer joined:", data);
        },
        onViewerDisconnected: (data) => {
          console.log("👥 Viewer disconnected:", data);
        },
        onConnectionStateChange: (state) => {
          console.log("🔗 Connection state changed:", state);
          connectionStatus.value = state;
          if (state === "connected") {
            ElMessage.success("WebRTC connection established");
          } else if (state === "disconnected" || state === "failed") {
            ElMessage.error("WebRTC connection lost");
          }
        },
      });
      console.log("✅ Event handlers set up successfully");
      
    } else {
      console.log("❌ Connection failed");
      ElMessage.error("Failed to connect to signaling server");
    }
  } catch (error) {
    console.error("❌ Connection error:", error);
    ElMessage.error("Failed to connect to signaling server");
  } finally {
    connecting.value = false;
    console.log("🏁 Connection process completed");
  }
}

async function watchStream(stream: StreamInfo) {
  console.log("🎬 watchStream called with:", stream);
  console.log("🔍 Current state - isConnected:", isConnected.value);
  console.log("🔍 WebRTC socket connected:", webrtcService.isSocketConnected());
  
  if (!isConnected.value) {
    console.log("❌ Not connected to signaling server");
    ElMessage.warning("Please connect to the signaling server first. Click the 'Connect to Server' button.");
    return;
  }

  // Double-check WebRTC service connection
  if (!webrtcService.isSocketConnected()) {
    console.log("❌ WebRTC service not connected");
    ElMessage.warning("WebRTC service not connected. Please reconnect to the server.");
    return;
  }

  try {
    console.log("✅ Pre-checks passed, setting up stream...");
    selectedStream.value = stream;
    showPlayer.value = true;
    
    console.log("⏳ Waiting for drawer to open...");
    // Wait for the drawer to open and video element to be available
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("🔍 Checking video element availability...");
    
    // Retry mechanism for video element
    let retries = 0;
    const maxRetries = 5;
    while (!videoRef.value && retries < maxRetries) {
      retries++;
      console.log(`🔄 Video element not ready, retrying... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (!videoRef.value) {
      console.log("❌ Video element not available after retries");
      ElMessage.error("Video element not available - please try again");
      showPlayer.value = false;
      return;
    }
    
    console.log("✅ Video element found:", videoRef.value);
    console.log("🎥 Attempting to join stream:", stream.streamId);
    
    const success = await webrtcService.joinStream(stream.streamId, videoRef.value);
    console.log("📊 Stream join result:", success);
    
    if (success) {
      console.log("✅ Stream joined successfully");
      ElMessage.success(`Joining stream: ${stream.title}`);
    } else {
      console.log("❌ Failed to join stream");
      ElMessage.error("Failed to join stream - check console for details");
      showPlayer.value = false;
    }
  } catch (error) {
    console.error("❌ Error joining stream:", error);
    ElMessage.error("Failed to join stream: " + (error as Error).message);
    showPlayer.value = false;
  }
}


function handleWatchClick(row: StreamInfo) {
  console.log('🎬 Watch button clicked for:', row);
  console.log('🔍 Button state - isConnected:', isConnected.value);
  console.log('🔍 Button state - connecting:', connecting.value);
  
  if (!isConnected.value) {
    console.log('❌ Button disabled - not connected');
    ElMessage.warning("Please connect to the signaling server first!");
    return;
  }
  
  watchStream(row);
}

function closePlayer() {
  showPlayer.value = false;
  selectedStream.value = null;
  webrtcService.leaveStream();
}

function handleVideoClick() {
  console.log('🎮 Video clicked - attempting manual play');
  if (videoRef.value) {
    const v = videoRef.value;
    console.log('🔍 Video state before manual play:', {
      readyState: v.readyState,
      networkState: v.networkState,
      paused: v.paused,
      ended: v.ended,
      currentTime: v.currentTime,
      videoWidth: v.videoWidth,
      videoHeight: v.videoHeight,
      srcObject: !!v.srcObject
    });
    
    // Force load and play
    v.load();
    setTimeout(() => {
      v.play().then(() => {
        console.log('✅ Manual play successful after user gesture');
        console.log('🎯 Video playing:', {
          readyState: v.readyState,
          currentTime: v.currentTime,
          paused: v.paused
        });
      }).catch(err => {
        console.error('❌ Manual play failed:', err);
        console.error('🔍 Error details:', err.name, err.message);
      });
    }, 100);
  }
}

function formatStartTime(startTime: string | Date | undefined): string {
  if (!startTime) return 'Unknown';
  
  try {
    const date = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // If less than 1 minute ago, show "Just now"
    if (diffMs < 60000) {
      return 'Just now';
    }
    
    // If less than 1 hour ago, show minutes
    if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes}m ago`;
    }
    
    // If less than 24 hours ago, show hours and minutes
    if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      const minutes = Math.floor((diffMs % 3600000) / 60000);
      return `${hours}h ${minutes}m ago`;
    }
    
    // If more than 24 hours ago, show the date and time
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting start time:', error);
    return 'Invalid date';
  }
}





function getStatusColor(status: string) {
  switch (status) {
    case "connected": return "success";
    case "connecting": return "warning";
    case "disconnected": return "danger";
    case "failed": return "danger";
    default: return "info";
  }
}

onMounted(() => {
  loadStreams();
});

onUnmounted(() => {
  webrtcService.disconnect();
});
</script>

<template>

  <el-card>
    <div>
    <div class="header-section">
    <h2>📺 Live Streams</h2>
      
      <div class="connection-controls">
        <el-tag 
          :type="getStatusColor(connectionStatus)" 
          size="large"
          class="status-tag"
        >
          <el-icon><Connection v-if="isConnected" /><Close v-else /></el-icon>
          {{ connectionStatus.toUpperCase() }}
        </el-tag>
        
     
        
        <el-button 
          type="primary" 
          :loading="connecting"
          :disabled="isConnected"
          @click="connectToServer"
        >
          <el-icon><Connection /></el-icon>
          Connect to Server
        </el-button>
        
        
        <el-button 
          type="default"
          @click="loadStreams"
          :loading="loading"
        >
          🔄 Refresh Streams
        </el-button>
      
         
      </div>
    </div>


    <el-table
      v-loading="loading"
      :data="isConnected ? streams : []"
      style="width: 100%"
      :empty-text="isConnected ? 'No streams available' : 'Connect to server to view streams'"
    >
      <!-- <el-table-column prop="title" label="Title" /> -->
      <el-table-column prop="streamerName" label="Streamer">
        <template #default="{ row }">
          {{ row.streamerName || 'Unknown Streamer' }}
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="Start Time" width="160">
        <template #default="{ row }">
          {{ formatStartTime(row.startTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="streamId" label="Stream ID" width="120">
        <template #default="{ row }">
          <code>{{ row.streamId?.substring(0, 8) }}...</code>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="Status" width="100">
        <template #default="{ row }">
          <el-tag 
            :type="row.status === 'live' ? 'success' : 'info'" 
            size="small"
          >
            {{ row.status?.toUpperCase() || 'UNKNOWN' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="Actions"
        width="150"
        align="center"
      >
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            :disabled="!isConnected"
            @click="handleWatchClick(row)"
          >
            <el-icon><VideoPlay /></el-icon>
            Watch
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Video Player Dialog -->
    <el-dialog
      v-model="showPlayer"
      draggable
      :title="selectedStream?.title || 'Live Stream'"
      width="50%"
      :close-on-click-modal="false"
      @close="closePlayer"
      class="stream-dialog"
      center
    >
      <template #header>
        <div class="dialog-header" v-if="selectedStream">
          <div class="stream-title">
            <h3>{{ selectedStream.title }}</h3>
            <el-tag type="success" size="small">LIVE</el-tag>
          </div>
          <p class="stream-meta">Streamer: {{ selectedStream.streamerName || 'Unknown Streamer' }}</p>
        </div>
      </template>
      
      <div v-if="selectedStream" class="stream-content">
        <div class="video-container">
          <video
            ref="videoRef"
            :key="selectedStream?.streamId"
            autoplay
            muted
            playsinline
            controls
            class="stream-video"
            @click="handleVideoClick"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </el-dialog>
  </div>


  </el-card>

</template>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.connection-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-tag {
  font-weight: bold;
  min-width: 120px;
  justify-content: center;
}

.connection-hint {
  color: #e6a23c;
  font-size: 14px;
  font-weight: 500;
}

.debug-info {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

.debug-info p {
  margin: 5px 0;
  color: #606266;
}


.stream-player {
  max-width: 100%;
}

.stream-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.stream-info h3 {
  margin: 0;
  color: #409eff;
}

.stream-info p {
  margin: 0;
  color: #666;
}

.video-container {
  width: 100%;
  margin: 20px 0;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.stream-video {
  width: 100%;
  height: auto;
  max-height: 40vh;
  display: block;
}

/* Dialog styles */
.stream-dialog .dialog-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stream-dialog .stream-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stream-dialog .stream-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.stream-dialog .stream-meta {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stream-dialog .stream-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.stream-dialog .video-container {
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.stream-dialog .stream-video {
  width: 100%;
  height: 50vh;
  object-fit: contain;
}


@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .connection-controls {
    width: 100%;
    justify-content: flex-start;
  }
  
  .stream-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
