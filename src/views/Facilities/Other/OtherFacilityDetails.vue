<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElCard,
  ElTabs,
  ElTabPane,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElAlert,
  ElTable,
  ElTableColumn,
  ElMessage,
  ElPopconfirm
} from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { GoogleMap, Polygon, Marker, Polyline, InfoWindow } from 'vue3-google-map'
import { getSettlementListByCounty, getOneGeo, getLinkedDocuments, unlinkDocument, DeleteRecord, deleteDocument } from '@/api/settlements'
import { getFile } from '@/api/summary'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import { canUnlinkDocumentFromFacility, canPermanentlyDeleteFacilityLinkedDocument } from '@/utils/documentPermissions'

const route = useRoute()
const router = useRouter()

const id = route.params.id
const model = computed(() => route.query.model || 'other_facility')
const pageTitle = computed(() => (route.query.title as string) || 'Facility Profile')

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const canUnlinkFacilityDoc = computed(() => canUnlinkDocumentFromFacility(userInfo))
const canRemoveFacilityDoc = computed(() => canPermanentlyDeleteFacilityLinkedDocument(userInfo))

const loading = ref(true)
const error = ref('')
const activeTab = ref('profile')
const record = ref<any>({})

const GOOGLE_MAPS_API_KEY = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'

const mapRef = ref()
const mapLoading = ref(false)
const mapCenter = ref({ lat: -1.286389, lng: 36.817223 })
const settlementPolygons = ref<any[]>([])
const facilityMarker = ref<any | null>(null)
const facilityLine = ref<any | null>(null)
const showInfoWindow = ref(false)
const mapDataLoaded = ref(false)

const fmt = (val: any) =>
  val === null || val === undefined || val === '' ? '–' : val

const loadProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getSettlementListByCounty({
      limit: 1,
      page: 1,
      curUser: 1,
      model: model.value,
      searchField: 'id',
      searchKeyword: String(id),
      filters: ['id'],
      filterValues: [[id]],
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward']
    })
    record.value = res?.data?.[0] || {}
  } catch (e: any) {
    error.value = e?.message || 'Failed to load facility profile'
  } finally {
    loading.value = false
  }
}

const loadMapData = async () => {
  if (mapDataLoaded.value) return
  mapLoading.value = true
  try {
    facilityMarker.value = null
    facilityLine.value = null
    settlementPolygons.value = []

    // Facility geometry
    try {
      const geoRes = await getOneGeo({ model: model.value, id })
      const features = geoRes.data?.[0]?.json_build_object?.features
      if (features?.length) {
        const geom = features[0].geometry
        let firstPt: any = null
        const makePath = (coords: any[]) => coords.map(([lng, lat]: number[]) => ({ lat, lng }))

        if (geom.type === 'Point') {
          if (Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
            firstPt = geom.coordinates
            facilityMarker.value = {
              position: { lat: geom.coordinates[1], lng: geom.coordinates[0] },
              title: record.value.name || 'Facility'
            }
          }
        } else if (geom.type === 'MultiPoint') {
          const first = geom.coordinates?.[0]
          if (Array.isArray(first) && first.length >= 2) {
            firstPt = first
            facilityMarker.value = {
              position: { lat: first[1], lng: first[0] },
              title: record.value.name || 'Facility'
            }
          }
        } else if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
          const coordsArr = geom.type === 'LineString' ? geom.coordinates : geom.coordinates?.[0]
          if (Array.isArray(coordsArr) && coordsArr.length) {
            facilityLine.value = {
              path: makePath(coordsArr),
              strokeColor: '#22c55e',
              strokeOpacity: 0.9,
              strokeWeight: 4
            }
            firstPt = coordsArr[0]
          }
        }

        if (firstPt && Array.isArray(firstPt) && firstPt.length >= 2) {
          mapCenter.value = { lat: firstPt[1], lng: firstPt[0] }
        }
      }
    } catch (e) {
      // keep map usable even if facility geometry fails
      console.warn('Failed to load facility geometry', e)
    }

    // Settlement boundary
    try {
      const settlementId = record.value.settlement_id || record.value.settlement?.id
      if (settlementId) {
        const sRes = await getOneGeo({ model: 'settlement', id: settlementId })
        const sGeo = sRes?.data?.[0]?.json_build_object
        const feats = sGeo?.features
        if (feats?.length) {
          feats.forEach((f: any, fi: number) => {
            let coords = f.geometry.coordinates
            if (f.geometry.type === 'MultiPolygon') coords = coords.flat()
            coords.forEach((ring: any, ri: number) => {
              settlementPolygons.value.push({
                id: `s-${fi}-${ri}`,
                paths: ring.map(([lng, lat]: number[]) => ({ lat, lng })),
                strokeColor: '#FF0000',
                strokeOpacity: 0.6,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0
              })
            })
          })
        }
      }
    } catch (e) {
      console.warn('Failed to load settlement geometry', e)
    }

    // Fit bounds
    if (mapRef.value?.map && window.google?.maps) {
      const bounds = new google.maps.LatLngBounds()
      settlementPolygons.value.forEach(p => p.paths.forEach((pt: any) => bounds.extend(pt)))
      if (facilityLine.value) {
        facilityLine.value.path.forEach((pt: any) => bounds.extend(pt))
      }
      if (facilityMarker.value) {
        bounds.extend(facilityMarker.value.position)
      }
      if (!bounds.isEmpty()) {
        mapRef.value.map.fitBounds(bounds, 40)
      }
    }

    mapDataLoaded.value = true
  } catch (e) {
    console.error('Map error', e)
  } finally {
    mapLoading.value = false
  }
}

const facilityDocuments = ref<any[]>([])
const docsLoading = ref(false)
const downloadingDocId = ref<number | null>(null)

const loadDocuments = async () => {
  docsLoading.value = true
  try {
    const res: any = await getLinkedDocuments({ entity_type: model.value, entity_id: Number(id) })
    facilityDocuments.value = res?.data || []
  } catch { facilityDocuments.value = [] }
  finally { docsLoading.value = false }
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
  } catch { ElMessage.error('Failed to download document') }
  finally { downloadingDocId.value = null }
}

const handleUnlinkDocument = async (row: any) => {
  if (!canUnlinkFacilityDoc.value) {
    ElMessage.warning('You do not have permission to unlink documents.')
    return
  }
  try {
    await unlinkDocument({ document_id: row.id, entity_type: model.value, entity_id: Number(id) })
    facilityDocuments.value = facilityDocuments.value.filter(d => d.id !== row.id)
    ElMessage.success('Document unlinked')
  } catch { ElMessage.error('Failed to unlink document') }
}

const handleRemoveDocument = async (row: any) => {
  if (!canRemoveFacilityDoc.value) {
    ElMessage.warning('You do not have permission to delete documents.')
    return
  }
  try {
    try { await unlinkDocument({ document_id: row.id, entity_type: model.value, entity_id: Number(id) }) } catch { /* ignore */ }
    await deleteDocument({ id: row.id, model: 'document', filesToDelete: [row.name] } as any)
    facilityDocuments.value = facilityDocuments.value.filter(d => d.id !== row.id)
    ElMessage.success('Document deleted')
  } catch { ElMessage.error('Failed to delete document') }
}

const onTabChange = (tab: string) => {
  if (tab === 'map') loadMapData()
  if (tab === 'documents' && !facilityDocuments.value.length) loadDocuments()
}

const basicFields = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'type', label: 'Type' },
  { key: 'condition', label: 'Condition' },
  { key: 'ownership_type', label: 'Ownership Type' },
  { key: 'owner', label: 'Owner' }
]

const locationFields = [
  { key: 'settlement.name', label: 'Settlement' },
  { key: 'ward.name', label: 'Ward' },
  { key: 'subcounty.name', label: 'Subcounty' },
  { key: 'county.name', label: 'County' }
]

const getNested = (obj: any, path: string) =>
  path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj)

onMounted(loadProfile)
</script>

<template>
  <div style="padding: 16px;">
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom: 16px;"
    />

    <el-card v-loading="loading">
      <template #header>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <el-button :icon="Back" size="small" @click="router.back()">Back</el-button>
          <span style="font-size:18px;font-weight:600;">
            {{ record.name || pageTitle }}
          </span>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="Profile" name="profile">
          <el-descriptions :column="2" border>
            <el-descriptions-item
              v-for="field in basicFields"
              :key="field.key"
              :label="field.label"
            >
              {{ fmt(record[field.key]) }}
            </el-descriptions-item>
          </el-descriptions>

          <el-descriptions :column="2" border style="margin-top:16px;">
            <el-descriptions-item
              v-for="field in locationFields"
              :key="field.key"
              :label="field.label"
            >
              {{ fmt(getNested(record, field.key)) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="Location" name="map">
          <div
            v-loading="mapLoading"
            style="height: 520px; width: 100%; border-radius: 6px; overflow: hidden;"
          >
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
            >
              <Polygon
                v-for="poly in settlementPolygons"
                :key="poly.id"
                :options="poly"
              />
              <Polyline
                v-if="facilityLine"
                :options="facilityLine"
              />
              <Marker
                v-if="facilityMarker"
                :options="facilityMarker"
                @click="showInfoWindow = true"
              >
                <InfoWindow v-model="showInfoWindow">
                  <div style="padding:4px 8px;font-weight:600;">{{ record.name }}</div>
                  <div style="font-size:12px;color:#666;">
                    {{ fmt(getNested(record, 'settlement.name')) }}
                  </div>
                </InfoWindow>
              </Marker>
            </GoogleMap>
          </div>
        </el-tab-pane>
        <el-tab-pane label="Documents" name="documents">
          <div v-loading="docsLoading" style="min-height: 120px;">
            <el-alert v-if="!docsLoading && !facilityDocuments.length" title="No documents linked to this facility." type="info" :closable="false" show-icon style="margin-bottom: 12px;" />
            <el-table v-if="facilityDocuments.length" :data="facilityDocuments" style="width: 100%;">
              <el-table-column type="index" width="50" />
              <el-table-column label="Name" prop="name" />
              <el-table-column label="Type" prop="document_type.type" width="160" />
              <el-table-column label="Format" prop="format" width="90" />
              <el-table-column label="Uploaded" prop="createdAt" width="180" />
              <el-table-column fixed="right" label="" min-width="200">
                <template #default="scope">
                  <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;">
                    <el-button plain :loading="downloadingDocId === scope.row.id" @click="downloadFile(scope.row)">
                      <Icon icon="fa-solid:download" style="margin-right:5px;" /> Download
                    </el-button>
                    <el-popconfirm v-if="canUnlinkFacilityDoc" title="Unlink this document from this facility? The document will not be deleted." confirm-button-text="Unlink" cancel-button-text="Cancel" @confirm="handleUnlinkDocument(scope.row)">
                      <template #reference>
                        <el-button plain type="warning">
                          <Icon icon="mdi:link-off" style="margin-right:5px;" /> Unlink
                        </el-button>
                      </template>
                    </el-popconfirm>
                    <el-popconfirm v-if="canRemoveFacilityDoc" title="Delete this document permanently? This cannot be undone." confirm-button-text="Delete" cancel-button-text="Cancel" confirm-button-type="danger" @confirm="handleRemoveDocument(scope.row)">
                      <template #reference>
                        <el-button plain type="danger">
                          <Icon icon="material-symbols-light:delete-outline" style="margin-right:5px;" /> Remove
                        </el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

 
