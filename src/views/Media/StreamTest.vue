<template>
  <div class="stream-test-page">
    <h1>Video Streams Test Page</h1>
    
    <!-- Test API Connection -->
    <el-card class="test-section">
      <h3>API Connection Test</h3>
      <el-button @click="testAPI" :loading="testingAPI" type="primary">
        Test Video Streams API
      </el-button>
      <div v-if="apiResult" class="api-result">
        <h4>API Response:</h4>
        <pre>{{ JSON.stringify(apiResult, null, 2) }}</pre>
      </div>
    </el-card>

    <!-- Stream List -->
    <el-card class="streams-section">
      <h3>Live Streams</h3>
      <VideoStreams />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElCard, ElButton, ElMessage } from 'element-plus'
import VideoStreams from './VideoStreams.vue'
import { getActiveStreams } from '@/api/videoStreams'

const testingAPI = ref(false)
const apiResult = ref(null)

const testAPI = async () => {
  testingAPI.value = true
  try {
    const response = await getActiveStreams()
    apiResult.value = response
    ElMessage.success('API test successful!')
  } catch (error) {
    console.error('API test failed:', error)
    ElMessage.error('API test failed: ' + error.message)
    apiResult.value = { error: error.message }
  } finally {
    testingAPI.value = false
  }
}
</script>

<style scoped>
.stream-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
}

.api-result {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.api-result pre {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
}

.streams-section {
  margin-bottom: 30px;
}
</style>
