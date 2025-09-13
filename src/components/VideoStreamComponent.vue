<template>
  <div class="video-stream-container">
    <div v-if="!isStreaming" class="stream-controls">
      <h3>Start Live Stream</h3>
      <ion-item>
        <ion-label position="floating">Stream Title</ion-label>
        <ion-input v-model="streamConfig.title" placeholder="Enter stream title"></ion-input>
      </ion-item>
      
      <ion-item>
        <ion-label position="floating">Description</ion-label>
        <ion-textarea v-model="streamConfig.description" placeholder="Enter stream description"></ion-textarea>
      </ion-item>
      
      <ion-item>
        <ion-label position="floating">Resolution</ion-label>
        <ion-select v-model="streamConfig.resolution">
          <ion-select-option value="480p">480p</ion-select-option>
          <ion-select-option value="720p">720p</ion-select-option>
          <ion-select-option value="1080p">1080p</ion-select-option>
        </ion-select>
      </ion-item>
      
      <ion-item>
        <ion-label position="floating">Bitrate (kbps)</ion-label>
        <ion-input v-model="streamConfig.bitrate" type="number" placeholder="1000"></ion-input>
      </ion-item>
      
      <ion-item>
        <ion-label position="floating">Framerate</ion-label>
        <ion-input v-model="streamConfig.framerate" type="number" placeholder="30"></ion-input>
      </ion-item>
      
      <ion-item>
        <ion-label position="floating">Camera</ion-label>
        <ion-select v-model="streamConfig.camera">
          <ion-select-option value="front">Front</ion-select-option>
          <ion-select-option value="back">Back</ion-select-option>
        </ion-select>
      </ion-item>
      
      <ion-item>
        <ion-checkbox v-model="streamConfig.audio"></ion-checkbox>
        <ion-label>Enable Audio</ion-label>
      </ion-item>
      
      <div class="button-group">
        <ion-button @click="startStream" :disabled="isConnecting" color="primary" expand="block">
          <ion-icon :icon="videocam" slot="start"></ion-icon>
          {{ isConnecting ? 'Starting...' : 'Start Stream' }}
        </ion-button>
      </div>
    </div>
    
    <div v-else class="streaming-container">
      <div class="stream-info">
        <h3>{{ currentStream?.title || 'Live Stream' }}</h3>
        <p>{{ currentStream?.description || 'No description' }}</p>
        <div class="stream-stats">
          <ion-chip color="primary">
            <ion-icon :icon="people"></ion-icon>
            <ion-label>{{ viewerCount }} viewers</ion-label>
          </ion-chip>
          <ion-chip color="success">
            <ion-icon :icon="time"></ion-icon>
            <ion-label>{{ formatDuration(streamDuration) }}</ion-label>
          </ion-chip>
        </div>
      </div>
      
      <div class="video-container">
        <video ref="videoElement" autoplay muted playsinline></video>
        <div v-if="!isVideoReady" class="video-placeholder">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Preparing video...</p>
        </div>
      </div>
      
      <div class="stream-controls-bottom">
        <ion-button @click="toggleMute" :color="isMuted ? 'danger' : 'primary'" fill="outline">
          <ion-icon :icon="isMuted ? volumeOff : volumeHigh"></ion-icon>
        </ion-button>
        
        <ion-button @click="toggleCamera" :color="isCameraOff ? 'danger' : 'primary'" fill="outline">
          <ion-icon :icon="isCameraOff ? videocamOff : videocam"></ion-icon>
        </ion-button>
        
        <ion-button @click="stopStream" color="danger" fill="outline">
          <ion-icon :icon="stop" slot="start"></ion-icon>
          Stop Stream
        </ion-button>
      </div>
      
    </div>
    
    <!-- Error Display -->
    <ion-toast
      :is-open="showError"
      :message="errorMessage"
      :duration="3000"
      @didDismiss="showError = false"
      color="danger"
    ></ion-toast>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  IonButton, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
  IonCheckbox, IonChip, IonIcon, IonSpinner, IonToast
} from '@ionic/vue';
import { 
  videocam, videocamOff, volumeHigh, volumeOff, stop, time
} from 'ionicons/icons';

// Props
const props = defineProps({
  streamUrl: {
    type: String,
    default: 'ws://localhost:3002/video-stream'
  },
  autoStart: {
    type: Boolean,
    default: false
  },
  showSettings: {
    type: Boolean,
    default: true
  },
  resolution: {
    type: String,
    default: '720p'
  },
  bitrate: {
    type: Number,
    default: 1000
  },
  framerate: {
    type: Number,
    default: 30
  },
  camera: {
    type: String,
    default: 'back'
  },
  audio: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['start', 'stop', 'error']);

// Reactive data
const isStreaming = ref(false);
const isConnecting = ref(false);
const isVideoReady = ref(false);
const isMuted = ref(false);
const isCameraOff = ref(false);
const currentStream = ref(null);
const viewerCount = ref(0);
const streamDuration = ref(0);
const showError = ref(false);
const errorMessage = ref('');

// WebSocket and Media
let ws = null;
let mediaStream = null;
let videoElement = null;
let streamInterval = null;
let durationInterval = null;

// Stream configuration
const streamConfig = ref({
  title: 'My Live Stream',
  description: '',
  resolution: props.resolution,
  bitrate: props.bitrate,
  framerate: props.framerate,
  camera: props.camera,
  audio: props.audio,
  location: null,
  county: null
});

// Current user (you might want to get this from your auth store)
const currentUser = ref({
  id: 1,
  name: 'Streamer'
});

// Methods
const startStream = async () => {
  try {
    isConnecting.value = true;
    
    // Get user media
    await getUserMedia();
    
    // Connect to WebSocket
    await connectWebSocket();
    
    // Start streaming
    isStreaming.value = true;
    isVideoReady.value = true;
    
    // Start duration counter
    startDurationCounter();
    
    emit('start', currentStream.value);
    
  } catch (error) {
    console.error('Error starting stream:', error);
    showErrorMessage('Failed to start stream: ' + error.message);
    emit('error', error);
  } finally {
    isConnecting.value = false;
  }
};

const stopStream = () => {
  try {
    // Stop media stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    
    // Close WebSocket
    if (ws) {
      ws.close();
      ws = null;
    }
    
    // Clear intervals
    if (streamInterval) {
      clearInterval(streamInterval);
      streamInterval = null;
    }
    
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
    
    // Reset state
    isStreaming.value = false;
    isVideoReady.value = false;
    currentStream.value = null;
    viewerCount.value = 0;
    streamDuration.value = 0;
    
    emit('stop');
    
  } catch (error) {
    console.error('Error stopping stream:', error);
    showErrorMessage('Error stopping stream: ' + error.message);
  }
};

const getUserMedia = async () => {
  try {
    const constraints = {
      video: {
        facingMode: streamConfig.value.camera,
        width: { ideal: getResolutionWidth(streamConfig.value.resolution) },
        height: { ideal: getResolutionHeight(streamConfig.value.resolution) },
        frameRate: { ideal: streamConfig.value.framerate }
      },
      audio: streamConfig.value.audio
    };
    
    mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Set video element source
    videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.srcObject = mediaStream;
    }
    
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw new Error('Unable to access camera/microphone. Please check permissions.');
  }
};

const connectWebSocket = () => {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(props.streamUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      
      // Send start stream message
      ws.send(JSON.stringify({
        type: 'start_stream',
        user: currentUser.value,
        streamConfig: streamConfig.value
      }));
      
      resolve();
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      reject(new Error('WebSocket connection failed'));
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (isStreaming.value) {
        showErrorMessage('Connection lost. Stream ended.');
        stopStream();
      }
    };
  });
};

const handleWebSocketMessage = (message) => {
  switch (message.type) {
    case 'stream_started':
      currentStream.value = message.stream;
      console.log('Stream started:', message.streamId);
      break;
      
    case 'stream_info':
      currentStream.value = message.stream;
      break;
      
    case 'viewer_joined':
      viewerCount.value = message.viewerCount;
      break;
      
    case 'viewer_left':
      viewerCount.value = message.viewerCount;
      break;
      
    case 'stream_ended':
      showErrorMessage('Stream ended: ' + (message.reason || 'Unknown reason'));
      stopStream();
      break;
      
      
    case 'error':
      showErrorMessage(message.message);
      break;
  }
};


const toggleMute = () => {
  if (mediaStream) {
    const audioTracks = mediaStream.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = isMuted.value;
    });
    isMuted.value = !isMuted.value;
  }
};

const toggleCamera = () => {
  if (mediaStream) {
    const videoTracks = mediaStream.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = isCameraOff.value;
    });
    isCameraOff.value = !isCameraOff.value;
  }
};

const startDurationCounter = () => {
  durationInterval = setInterval(() => {
    streamDuration.value++;
  }, 1000);
};


const getResolutionWidth = (resolution) => {
  switch (resolution) {
    case '480p': return 640;
    case '720p': return 1280;
    case '1080p': return 1920;
    default: return 1280;
  }
};

const getResolutionHeight = (resolution) => {
  switch (resolution) {
    case '480p': return 480;
    case '720p': return 720;
    case '1080p': return 1080;
    default: return 720;
  }
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString();
};

const showErrorMessage = (message) => {
  errorMessage.value = message;
  showError.value = true;
};

// Lifecycle
onMounted(() => {
  if (props.autoStart) {
    startStream();
  }
});

onUnmounted(() => {
  stopStream();
});
</script>

<style scoped>
.video-stream-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.stream-controls {
  background: var(--ion-color-light);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.stream-controls h3 {
  margin-top: 0;
  color: var(--ion-color-primary);
}

.button-group {
  margin-top: 20px;
}

.streaming-container {
  background: var(--ion-color-light);
  border-radius: 12px;
  overflow: hidden;
}

.stream-info {
  padding: 15px;
  background: var(--ion-color-primary);
  color: white;
}

.stream-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.2em;
}

.stream-info p {
  margin: 0 0 10px 0;
  opacity: 0.9;
}

.stream-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.video-container {
  position: relative;
  background: black;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container video {
  width: 100%;
  height: auto;
  max-height: 400px;
}

.video-placeholder {
  text-align: center;
  color: white;
}

.video-placeholder ion-spinner {
  margin-bottom: 10px;
}

.stream-controls-bottom {
  padding: 15px;
  display: flex;
  gap: 10px;
  justify-content: center;
  background: var(--ion-color-light);
}



@media (max-width: 768px) {
  .video-stream-container {
    padding: 10px;
  }
  
  .stream-controls-bottom {
    flex-wrap: wrap;
  }
  
  .chat-message.own-message {
    margin-left: 10px;
  }
}
</style>
