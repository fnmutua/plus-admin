<script setup lang="ts">
// @ts-nocheck
import { ref } from 'vue'
import { ElCard, ElRow, ElCol, ElInput, ElButton, ElDescriptions, ElDescriptionsItem, ElAlert, ElMessage } from 'element-plus'
import { GoogleMap, Marker, InfoWindow } from 'vue3-google-map'
import { Back, Location, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { locateAdminUnitsByPointApi } from '@/api/adminunits'

const router = useRouter()

const GOOGLE_MAPS_API_KEY = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

const mapCenter = ref({ lat: -0.0236, lng: 37.9062 }) // Approx centre of Kenya
const mapZoom = ref(7)
const mapRef = ref()

const loading = ref(false)
const statusMessage = ref('')
const fetchingLocation = ref(false)

const clickMarker = ref<{ lat: number; lng: number } | null>(null)
const adminInfo = ref<any | null>(null)

const flyDialogCoords = ref('')
const showInfoWindow = ref(false)

const goBack = () => {
  router.back()
}

const setStatus = (msg: string) => {
  statusMessage.value = msg
}

const clearStatus = () => {
  statusMessage.value = ''
}

const locateByPoint = async (lat: number, lng: number) => {
  try {
    fetchingLocation.value = true
    setStatus('Locating county, subcounty and ward for this point...')
    adminInfo.value = null

    const res = await locateAdminUnitsByPointApi({ lat, lng })
    adminInfo.value = res.data
    clearStatus()
  } catch (error: any) {
    console.error('Locate admin units error:', error)
    adminInfo.value = null
    if (error?.response?.status === 404) {
      setStatus('No administrative unit found at this location.')
    } else {
      setStatus('Failed to locate administrative units for this point.')
    }
  } finally {
    fetchingLocation.value = false
  }
}

const handleMapClick = (event: any) => {
  if (!event || !event.latLng) return
  const lat = event.latLng.lat()
  const lng = event.latLng.lng()

  clickMarker.value = { lat, lng }
  mapCenter.value = { lat, lng }
  mapZoom.value = 11
  showInfoWindow.value = true
  locateByPoint(lat, lng)
}

// Fly-to-coordinates helper (lat, lon)
const flyToCoordinates = () => {
  const raw = (flyDialogCoords.value || '').trim()
  if (!raw) {
    ElMessage.error('Enter coordinates as "lat, lon"')
    return
  }

  const parts = raw.replace(/[\s;]+/g, ',').split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length < 2) {
    ElMessage.error('Enter coordinates as "lat, lon" (e.g., -1.2921, 36.8219)')
    return
  }

  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    ElMessage.error('Invalid numbers. Use "lat, lon" (e.g., -1.2921, 36.8219)')
    return
  }

  clickMarker.value = { lat, lng }
  mapCenter.value = { lat, lng }
  mapZoom.value = 11
  showInfoWindow.value = true
  locateByPoint(lat, lng)
}
</script>

<template>
  <el-card>
    <template #header>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <el-button type="primary" plain :icon="Back" @click="goBack">
            Back
          </el-button>
          <div>
            <h3 style="margin:0;">Admin Unit Locator</h3>
            <p style="margin:0;font-size:12px;color:#909399;">
              Click on the map or enter coordinates to identify the county, subcounty and ward.
            </p>
          </div>
        </div>
      </div>
    </template>

    <el-row :gutter="16" style="margin-bottom: 10px;">
      <el-col :xs="24">
        <div style="display:flex;align-items:center;gap:8px;">
          <el-input
            v-model="flyDialogCoords"
            placeholder='Enter coordinates as "lat, lon" (e.g., -1.2921, 36.8219)'
            clearable
            style="flex: 1; width: 100%;"
          >
            <template #prefix>
              <el-icon><Location /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" :icon="Search" @click="flyToCoordinates">
            Locate
          </el-button>
        </div>
      </el-col>
    </el-row>

    <el-alert
      v-if="statusMessage"
      :title="statusMessage"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 10px;"
    />

    <el-row :gutter="16">
      <el-col :xs="24">
        <div
          v-loading="loading || fetchingLocation"
          style="height: 600px; width: 100%; border-radius: 6px; overflow: hidden;"
        >
          <GoogleMap
            ref="mapRef"
            :api-key="GOOGLE_MAPS_API_KEY"
            style="width: 100%; height: 100%;"
            :center="mapCenter"
            :zoom="mapZoom"
            map-type-id="roadmap"
            :street-view-control="false"
            :fullscreen-control="true"
            :map-type-control="true"
            @click="handleMapClick"
          >
            <Marker v-if="clickMarker" :options="{ position: clickMarker }">
              <InfoWindow v-model="showInfoWindow">
                <div style="min-width:220px;">
                  <div style="font-weight:600;margin-bottom:4px;">Clicked location</div>
                  <div style="font-size:12px;color:#606266;margin-bottom:6px;">
                    Lat: {{ clickMarker.lat.toFixed(6) }}, Lng: {{ clickMarker.lng.toFixed(6) }}
                  </div>
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="County">
                      {{ adminInfo?.county_name || 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="County ID">
                      {{ adminInfo?.county_id ?? 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Subcounty">
                      {{ adminInfo?.subcounty_name || 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Subcounty ID">
                      {{ adminInfo?.subcounty_id ?? 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Ward">
                      {{ adminInfo?.ward_name || 'N/A' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="Ward ID">
                      {{ adminInfo?.ward_id ?? 'N/A' }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </InfoWindow>
            </Marker>
          </GoogleMap>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

