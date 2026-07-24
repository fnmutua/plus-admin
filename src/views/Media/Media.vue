<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElButton, ElCol, ElRow, ElCard, ElDialog, ElEmpty, ElSkeleton } from 'element-plus'
import { getYoutubeVideos, type YoutubeVideoItem } from '@/api/media'

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }
  return new Date(date).toLocaleString('en-US', options)
}

const videos = ref<YoutubeVideoItem[]>([])
const loading = ref(true)
const loadError = ref('')
const playerVisible = ref(false)
const selectedVideoId = ref<string | null>(null)

const viewVideo = (videoId: string) => {
  selectedVideoId.value = videoId
  playerVisible.value = true
}

const fetchVideos = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const response = await getYoutubeVideos()
    videos.value = response?.videos || []
  } catch (error: any) {
    console.error('Error fetching YouTube videos:', error)
    videos.value = []
    loadError.value =
      error?.response?.data?.message ||
      error?.message ||
      'Could not load videos. Please try again later.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchVideos)
</script>

<template>
  <el-card>
    <div v-if="loading" class="video-grid">
      <el-col v-for="n in 6" :key="n" :span="8" :xs="24" :sm="12" :md="8">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="image" style="width: 100%; height: 200px" />
            <el-skeleton-item variant="text" style="margin-top: 12px" />
          </template>
        </el-skeleton>
      </el-col>
    </div>

    <el-empty
      v-else-if="loadError"
      :description="loadError"
    >
      <el-button type="primary" @click="fetchVideos">Retry</el-button>
    </el-empty>

    <el-empty
      v-else-if="!videos.length"
      description="No videos found for this channel."
    />

    <el-row v-else :gutter="20" justify="center">
      <el-col
        v-for="video in videos"
        :key="video.videoId"
        :span="8"
        :xs="24"
        :sm="12"
        :md="8"
      >
        <el-card class="video-card">
          <iframe
            :src="`https://www.youtube.com/embed/${video.videoId}`"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="video-embed"
            :title="video.title"
          ></iframe>
          <div class="video-meta">
            <p class="video-title">{{ video.title }}</p>
            <p class="video-date">{{ formatDate(video.publishedAt) }}</p>
          </div>
          <el-button type="primary" @click="viewVideo(video.videoId)">
            View Video
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="playerVisible" width="900px">
      <template #header>
        <span>Video Player</span>
      </template>
      <iframe
        v-if="selectedVideoId"
        :src="`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="video-dialog-embed"
      ></iframe>
      <template #footer>
        <el-button @click="playerVisible = false">Close</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.video-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.video-card {
  margin-bottom: 16px;
}

.video-embed {
  width: 100%;
  height: 200px;
  border: 0;
}

.video-dialog-embed {
  width: 100%;
  height: 600px;
  border: 0;
}

.video-meta {
  margin-top: 10px;
}

.video-title {
  margin: 0 0 4px;
  font-weight: 600;
  line-height: 1.35;
}

.video-date {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

@media (max-width: 768px) {
  .video-embed {
    height: 180px;
  }

  .video-dialog-embed {
    height: 240px;
  }
}
</style>
