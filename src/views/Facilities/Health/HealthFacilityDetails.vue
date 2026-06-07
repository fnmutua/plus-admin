<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted, computed } from 'vue'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import { canUnlinkDocumentFromFacility, canPermanentlyDeleteFacilityLinkedDocument } from '@/utils/documentPermissions'
import { useRoute, useRouter } from 'vue-router'
import {
  ElCard, ElTabs, ElTabPane, ElButton,
  ElTag, ElAlert, ElMessage
} from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { GoogleMap, Polygon, Marker, InfoWindow } from 'vue3-google-map'
import { getSettlementListByCounty, getOneGeo, getSettlementMapData, getLinkedDocuments, unlinkDocument, DeleteRecord, deleteDocument } from '@/api/settlements'
import { getFile } from '@/api/summary'
import { GOOGLE_MAPS_API_KEY } from '@/config/googleMaps'
import FacilityDetailsDocuments from '@/views/Facilities/components/FacilityDetailsDocuments.vue'
import FacilityProfileInlineSections from '@/views/Facilities/components/FacilityProfileInlineSections.vue'
import { useFacilityDetailsMobile } from '@/views/Facilities/composables/useFacilityDetailsMobile'

const { pageStyle, mapContainerStyle } = useFacilityDetailsMobile()

const route = useRoute()
const router = useRouter()
const id = route.params.id

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const canUnlinkFacilityDoc = computed(() => canUnlinkDocumentFromFacility(userInfo))
const canRemoveFacilityDoc = computed(() => canPermanentlyDeleteFacilityLinkedDocument(userInfo))

// ── State ─────────────────────────────────────────────────────────────────────
const loading = ref(true)
const error = ref('')
const activeTab = ref('profile')

const d = ref<any>({})  // raw API record — all fields available in template

// ── Map state ─────────────────────────────────────────────────────────────────
const mapRef = ref()
const mapLoading = ref(false)
const mapCenter = ref({ lat: -1.286389, lng: 36.817223 })
const facilityMarker = ref<any>(null)
const showInfoWindow = ref(false)
const settlementPolygons = ref<any[]>([])
const mapDataLoaded = ref(false)

// ── Profile loading ───────────────────────────────────────────────────────────
const loadProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getSettlementListByCounty({
      limit: 1, page: 1, curUser: 1,
      model: 'health_facility',
      searchField: 'name', searchKeyword: '',
      filters: ['id'], filterValues: [[id]],
      associated_multiple_models: ['settlement'],
      nested_models: ['settlement', 'county']
    })
    d.value = res.data[0] || {}
  } catch (e: any) {
    error.value = e?.message || 'Failed to load facility profile'
  } finally {
    loading.value = false
  }
}

// ── Map loading ───────────────────────────────────────────────────────────────
const loadMapData = async () => {
  if (mapDataLoaded.value) return
  mapLoading.value = true
  try {
    const geoRes = await getOneGeo({ model: 'health_facility', id })
    const features = geoRes.data?.[0]?.json_build_object?.features
    if (features?.length) {
      const [lng, lat] = features[0].geometry.coordinates
      facilityMarker.value = { position: { lat, lng }, title: d.value.name }
      mapCenter.value = { lat, lng }
    }

    const settlementId = d.value.settlement_id || d.value.settlement?.id
    if (settlementId) {
      const mapData = await getSettlementMapData({ settlementId: String(settlementId) })
      const settlementGeo = (mapData as any)?.data?.settlement
      if (settlementGeo?.features?.length) {
        settlementGeo.features.forEach((feature: any, fi: number) => {
          let coords = feature.geometry.coordinates
          if (feature.geometry.type === 'MultiPolygon') coords = coords.flat()
          coords.forEach((ring: number[][], ri: number) => {
            settlementPolygons.value.push({
              id: `sett-${fi}-${ri}`,
              paths: ring.map(([lng, lat]) => ({ lat, lng })),
              strokeColor: '#1a73e8', strokeOpacity: 1, strokeWeight: 2,
              fillColor: '#1a73e8', fillOpacity: 0.08
            })
          })
        })
        fitMapBounds()
      }
    }
    mapDataLoaded.value = true
  } catch (e) {
    console.error('Map data error', e)
  } finally {
    mapLoading.value = false
  }
}

const fitMapBounds = () => {
  if (!mapRef.value?.map || !window.google?.maps) return
  const bounds = new google.maps.LatLngBounds()
  settlementPolygons.value.forEach(p => p.paths.forEach((pt: any) => bounds.extend(pt)))
  if (facilityMarker.value) bounds.extend(facilityMarker.value.position)
  mapRef.value.map.fitBounds(bounds, 40)
}

const onMapReady = () => { if (activeTab.value === 'map') fitMapBounds() }

const fmt = (val: any) => (val === null || val === undefined || val === '') ? '–' : val

// ── Documents ────────────────────────────────────────────────────────────────
const facilityDocuments = ref<any[]>([])
const docsLoading = ref(false)
const downloadingDocId = ref<number | null>(null)

const loadDocuments = async () => {
  docsLoading.value = true
  try {
    const res: any = await getLinkedDocuments({ entity_type: 'health_facility', entity_id: Number(id) })
    facilityDocuments.value = res?.data || []
  } catch {
    facilityDocuments.value = []
  } finally {
    docsLoading.value = false
  }
}

const downloadFile = async (row: any) => {
  downloadingDocId.value = row.id
  try {
    const res = await getFile({ filename: row.location || row.name, doc_id: row.id, responseType: 'blob' } as any)
    const blob = new Blob([res as any])
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', row.name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(link.href)
  } catch {
    ElMessage.error('Failed to download document')
  } finally {
    downloadingDocId.value = null
  }
}

const handleUnlinkDocument = async (row: any) => {
  try {
    await unlinkDocument({ document_id: row.id, entity_type: 'health_facility', entity_id: Number(id) })
    facilityDocuments.value = facilityDocuments.value.filter(d => d.id !== row.id)
    ElMessage.success('Document unlinked')
  } catch {
    ElMessage.error('Failed to unlink document')
  }
}

const handleRemoveDocument = async (row: any) => {
  if (!canRemoveFacilityDoc.value) {
    ElMessage.warning('You do not have permission to delete documents.')
    return
  }
  try {
    try { await unlinkDocument({ document_id: row.id, entity_type: 'health_facility', entity_id: Number(id) }) } catch { /* ignore */ }
    await deleteDocument({ id: row.id, model: 'document', filesToDelete: [row.name] } as any)
    facilityDocuments.value = facilityDocuments.value.filter(d => d.id !== row.id)
    ElMessage.success('Document deleted')
  } catch {
    ElMessage.error('Failed to delete document')
  }
}

const onTabChange = (tab: string) => {
  if (tab === 'map') loadMapData()
  if (tab === 'documents' && !facilityDocuments.value.length) loadDocuments()
}

onMounted(loadProfile)
</script>

<template>
  <div :style="pageStyle">
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon style="margin-bottom: 16px;" />

    <el-card v-loading="loading" >
      <template #header>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <el-button :icon="Back" size="small" @click="router.back()">Back</el-button>
          <span style="font-size: 18px; font-weight: 600;">{{ d.name || 'Health Facility' }}</span>
          <el-tag v-if="d.level" size="small" type="info">{{ d.level }}</el-tag>
          <el-tag v-if="d.registration_status" size="small" :type="d.registration_status === 'Registered' ? 'success' : 'warning'">
            {{ d.registration_status }}
          </el-tag>
          <el-tag v-if="d.isApproved" size="small" :type="d.isApproved === 'Approved' ? 'success' : d.isApproved === 'Rejected' ? 'danger' : ''">
            {{ d.isApproved }}
          </el-tag>
        </div>
      </template>

      <el-tabs v-model="activeTab"  @tab-change="onTabChange">

        <!-- ── Profile tab ──────────────────────────────────────────────────── -->
        <el-tab-pane label="Profile" name="profile">
          <FacilityProfileInlineSections feature-type="health_facility" :record="d" />
        </el-tab-pane>

        <!-- ── Location tab ─────────────────────────────────────────────────── -->
        <el-tab-pane label="Location" name="map">
          <div v-loading="mapLoading" :style="mapContainerStyle">
            <GoogleMap
              v-if="activeTab === 'map'"
              ref="mapRef"
              :api-key="GOOGLE_MAPS_API_KEY"
              style="width: 100%; height: 100%;"
              :center="mapCenter"
              :zoom="15"
              map-type-id="satellite"
              :map-type-control="true"
              :street-view-control="false"
              @ready="onMapReady"
            >
              <Polygon v-for="poly in settlementPolygons" :key="poly.id" :options="poly" />
              <Marker v-if="facilityMarker" :options="facilityMarker" @click="showInfoWindow = true">
                <InfoWindow v-model="showInfoWindow">
                  <div style="padding: 4px 8px; font-weight: 600;">{{ d.name }}</div>
                  <div style="font-size: 12px; color: #666;">{{ d.settlement?.name }}, {{ d.settlement?.county?.name }}</div>
                </InfoWindow>
              </Marker>
            </GoogleMap>
          </div>
          <div style="display:flex;gap:20px;margin-top:10px;font-size:13px;color:#606266;align-items:center;">
            <span style="display:flex;align-items:center;gap:6px;">
              <img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" style="height:18px;" />
              {{ d.name }}
            </span>
            <span v-if="d.settlement?.name" style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:16px;height:4px;background:#1a73e8;border-radius:2px;"></span>
              {{ d.settlement.name }} boundary
            </span>
          </div>
        </el-tab-pane>

        <!-- ── Documents tab ────────────────────────────────────────────────── -->
        <el-tab-pane label="Documents" name="documents">
          <FacilityDetailsDocuments
            :documents="facilityDocuments"
            :loading="docsLoading"
            :downloading-id="downloadingDocId"
            :can-unlink="canUnlinkFacilityDoc"
            :can-remove="canRemoveFacilityDoc"
            @download="downloadFile"
            @unlink="handleUnlinkDocument"
            @remove="handleRemoveDocument"
          />
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>
