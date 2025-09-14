<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getCountyListApi } from '@/api/counties'

import { getGrievances } from '@/api/grievance'

import { ElButton, ElSelect, ElCheckbox, ElCol, ElIcon, ElTag } from 'element-plus'
import {
  Plus, Download, Filter, More, ArrowLeft, ArrowRight, Upload, UploadFilled,
  Edit,
  Back,
  InfoFilled, Position,
  Delete
} from '@element-plus/icons-vue'

import { ref, computed, onMounted } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDialog, ElForm, ElDropdown, ElDropdownItem, ElDropdownMenu, ElTour, ElTourStep, ElUpload,
  ElFormItem, ElRow, ElInput, FormRules, ElStep, ElSteps, ElTable, ElTableColumn, ElCard, ElDrawer, ElMessage, ElTabPane, ElSwitch
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import xlsx from "json-as-xlsx"
import { uploadToGeoServer, deleteLayer, EditLayerDetails } from '@/api/geoserver'

import writeXlsxFile from 'write-excel-file';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import type { UploadProps, UploadUserFile } from 'element-plus'

import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { uploadGrievanceDocuments, generateGrievance, logGrievanceAction, batchImportGrievances, getByKeyword } from '@/api/grievance'
import { getModelSpecs } from '@/api/fields'
import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';
import axios from 'axios';

import { XMLParser } from 'fast-xml-parser';

import '@mapbox/mapbox-gl-geocoder/lib/mapbox-gl-geocoder.css';
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()


const apiKey = import.meta.env.VITE_APP_YOUTUBE_API; // Replace with your API key



function formatDate(date) {
  const options = {
    year: "numeric",
    month: "long", // e.g., January
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true // For AM/PM
  };

  return new Date(date).toLocaleString("en-US", options);
}



const videos = ref([]); // Reactive state for storing videos
const playerVisible = ref(false); // State for dialog visibility
const selectedVideoId = ref(null); // State for selected video ID

// Function to view a video in fullscreen
const viewVideo = (videoId) => {
  selectedVideoId.value = videoId;
  playerVisible.value = true;
};





 
const fetchVideos = async () => {
  const channelId = "UC0hCUWeDllvva19KGJfTz4w"; // Replace with your channel ID
 
   
  const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=100`



  try {
    const response = await axios.get(url);
    console.log(response)
    videos.value = response.data.items;
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
  }
};

onMounted(fetchVideos);


</script>

<template>
  <el-card>

      <div>
  <el-row :gutter="20" justify="center">
    <el-col
      :span="8"
      xs="24"
      sm="12"
      md="8"
      v-for="video in videos"
      :key="video.id.videoId"
    >
      <el-card>
        <!-- Embedded YouTube Player -->
        <iframe
          :src="`https://www.youtube.com/embed/${video.id.videoId}`"
          frameborder="0"
          allowfullscreen
          style="width: 100%; height: 200px; "
        ></iframe>
        <!-- Video Info -->
        <div style="margin-top: 10px;  ">
          <!-- <h3>{{ video.snippet.title }}</h3> -->
          <p>{{ formatDate (video.snippet.publishedAt) }}</p>
        </div>
        <!-- View Button -->
        <el-button
          type="primary"
          @click="viewVideo(video.id.videoId)"
          style="margin-top: 10px;"
        >
          View Video
        </el-button>
      </el-card>
    </el-col>
  </el-row>

  <!-- Fullscreen Video Player -->
  <el-dialog v-model="playerVisible" width="900px">
    <template #header>
      <span>Video Player</span>
    </template>
    <iframe
      v-if="selectedVideoId"
      :src="`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`"
      frameborder="0"
      allowfullscreen
      style="width: 100%; height: 600px;"
    ></iframe>
    <template #footer>
      <el-button @click="playerVisible = false">Close</el-button>
    </template>
  </el-dialog>
</div>
  </el-card>



 
 

 

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