<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted, computed } from 'vue'
import { useCache } from '@/hooks/web/useCache'
import { useAppStoreWithOut } from '@/store/modules/app'
import { canUnlinkDocumentFromFacility, canPermanentlyDeleteFacilityLinkedDocument } from '@/utils/documentPermissions'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElTabs, ElTabPane, ElButton, ElDescriptions, ElDescriptionsItem, ElTag, ElAlert, ElCollapseTransition, ElTable, ElTableColumn, ElMessage, ElPopconfirm } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { GoogleMap, Polygon, Polyline } from 'vue3-google-map'
import { useDesign } from '@/hooks/web/useDesign'
import { getSettlementListByCounty, getOneGeo, getSettlementMapData, getLinkedDocuments, unlinkDocument, DeleteRecord, deleteDocument } from '@/api/settlements'
import { getFile } from '@/api/summary'
import { GOOGLE_MAPS_API_KEY } from '@/config/googleMaps'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const canUnlinkFacilityDoc = computed(() => canUnlinkDocumentFromFacility(userInfo))
const canRemoveFacilityDoc = computed(() => canPermanentlyDeleteFacilityLinkedDocument(userInfo))

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('descriptions')

const collapsed = reactive({ general: false, geometry: false, drainage: false })

const loading = ref(true)
const error = ref('')
const activeTab = ref('profile')
const d = ref<any>({})

const mapRef = ref()
const mapLoading = ref(false)
const mapCenter = ref({ lat: -1.286389, lng: 36.817223 })
const settlementPolygons = ref<any[]>([])
const roadLines = ref<any[]>([])
const mapDataLoaded = ref(false)

const fmt = (val: any) => (val === null || val === undefined || val === '') ? '–' : val

const loadProfile = async () => {
  loading.value = true; error.value = ''
  try {
    roadLines.value = []
    const res = await getSettlementListByCounty({ limit: 1, page: 1, curUser: 1, model: 'road', searchField: 'name', searchKeyword: '', filters: ['id'], filterValues: [[id]], associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward'] })
    d.value = res.data[0] || {}
  } catch (e: any) { error.value = e?.message || 'Failed to load profile' }
  finally { loading.value = false }
}

const loadMapData = async () => {
  if (mapDataLoaded.value) return
  mapLoading.value = true
  try {
    const geoRes = await getOneGeo({ model: 'road', id })
    const features = geoRes.data?.[0]?.json_build_object?.features
    if (features?.length) {
      const geom = features[0].geometry
      let firstPt = null
      const makePath = (coords: any[]) => coords.map(([lng, lat]: number[]) => ({ lat, lng }))

      if (geom.type === 'MultiLineString') {
        geom.coordinates.forEach((line: any[], idx: number) => {
          if (!Array.isArray(line) || !line.length) return
          roadLines.value.push({
            id: `road-${idx}`,
            path: makePath(line),
            strokeColor: '#8B4513',
            strokeOpacity: 0.9,
            strokeWeight: 5
          })
        })
        firstPt = geom.coordinates?.[0]?.[0]
      } else if (geom.type === 'LineString') {
        roadLines.value.push({
          id: 'road-0',
          path: makePath(geom.coordinates),
          strokeColor: '#8B4513',
          strokeOpacity: 0.9,
          strokeWeight: 5
        })
        firstPt = geom.coordinates?.[0]
      }

      if (firstPt) mapCenter.value = { lat: firstPt[1], lng: firstPt[0] }
    }
    const settlementId = d.value.settlement_id || d.value.settlement?.id
    if (settlementId) {
      const mapData = await getSettlementMapData({ settlementId: String(settlementId) })
      const sGeo = (mapData as any)?.data?.settlement
      if (sGeo?.features?.length) {
        sGeo.features.forEach((f: any, fi: number) => {
          let coords = f.geometry.coordinates
          if (f.geometry.type === 'MultiPolygon') coords = coords.flat()
          coords.forEach((ring: any, ri: number) => {
            settlementPolygons.value.push({ id: `s-${fi}-${ri}`, paths: ring.map(([lng, lat]) => ({ lat, lng })), strokeColor: '#1a73e8', strokeOpacity: 1, strokeWeight: 2, fillColor: '#1a73e8', fillOpacity: 0.08 })
          })
        })
        if (mapRef.value?.map && window.google?.maps) {
          const bounds = new google.maps.LatLngBounds()
          settlementPolygons.value.forEach(p => p.paths.forEach((pt: any) => bounds.extend(pt)))
          roadLines.value.forEach(l => l.path.forEach((pt: any) => bounds.extend(pt)))
          mapRef.value.map.fitBounds(bounds, 40)
        }
      }
    }
    mapDataLoaded.value = true
  } catch (e) { console.error('Map error', e) }
  finally { mapLoading.value = false }
}

const facilityDocuments = ref<any[]>([])
const docsLoading = ref(false)
const downloadingDocId = ref<number | null>(null)

const loadDocuments = async () => {
  docsLoading.value = true
  try {
    const res: any = await getLinkedDocuments({ entity_type: 'road', entity_id: Number(id) })
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
  try {
    await unlinkDocument({ document_id: row.id, entity_type: 'road', entity_id: Number(id) })
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
    try { await unlinkDocument({ document_id: row.id, entity_type: 'road', entity_id: Number(id) }) } catch { /* ignore */ }
    await deleteDocument({ id: row.id, model: 'document', filesToDelete: [row.name] } as any)
    facilityDocuments.value = facilityDocuments.value.filter(d => d.id !== row.id)
    ElMessage.success('Document deleted')
  } catch { ElMessage.error('Failed to delete document') }
}

const onTabChange = (tab: string) => {
  if (tab === 'map') loadMapData()
  if (tab === 'documents' && !facilityDocuments.value.length) loadDocuments()
}
onMounted(loadProfile)
</script>

<template>
  <div style="padding: 16px;">
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon style="margin-bottom: 16px;" />
    <el-card v-loading="loading">
      <template #header>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <el-button :icon="Back" size="small" @click="router.back()">Back</el-button>
          <span style="font-size: 18px; font-weight: 600;">{{ d.name || 'Road' }}</span>
          <el-tag v-if="d.rd_class" size="small" type="info">{{ d.rd_class }}</el-tag>
          <el-tag v-if="d.surface_type" size="small">{{ d.surface_type }}</el-tag>
          <el-tag v-if="d.isApproved" size="small" :type="d.isApproved === 'Approved' ? 'success' : d.isApproved === 'Rejected' ? 'danger' : ''">{{ d.isApproved }}</el-tag>
        </div>
      </template>
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="Profile" name="profile">

          <div :class="prefixCls" style="margin-bottom: 2px;">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.general = !collapsed.general">
              <span style="font-weight:600;">General</span><Icon :icon="collapsed.general ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition><div v-show="!collapsed.general" style="padding: 12px;">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="Name">{{ fmt(d.name) }}</el-descriptions-item>
                <el-descriptions-item label="Code">{{ fmt(d.code) }}</el-descriptions-item>
                <el-descriptions-item label="Road Number">{{ fmt(d.rd_num) }}</el-descriptions-item>
                <el-descriptions-item label="Road Class">{{ fmt(d.rd_class) }}</el-descriptions-item>
                <el-descriptions-item label="Surface Type">{{ fmt(d.surface_type) }}</el-descriptions-item>
                <el-descriptions-item label="Surface Condition">{{ fmt(d.surface_condition) }}</el-descriptions-item>
                <el-descriptions-item label="Traffic">{{ fmt(d.rd_traffic) }}</el-descriptions-item>
                <el-descriptions-item label="Direction">{{ fmt(d.rd_direction) }}</el-descriptions-item>
                <el-descriptions-item label="Settlement">{{ fmt(d.settlement?.name) }}</el-descriptions-item>
                <el-descriptions-item label="County">{{ fmt(d.settlement?.county?.name) }}</el-descriptions-item>
                <el-descriptions-item label="Approval Status">{{ fmt(d.isApproved) }}</el-descriptions-item>
              </el-descriptions>
            </div></ElCollapseTransition>
          </div>

          <div :class="prefixCls" style="margin-bottom: 2px;">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.geometry = !collapsed.geometry">
              <span style="font-weight:600;">Geometry &amp; Reserve</span><Icon :icon="collapsed.geometry ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition><div v-show="!collapsed.geometry" style="padding: 12px;">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="Length">{{ fmt(d.length) }}</el-descriptions-item>
                <el-descriptions-item label="Width (m)">{{ fmt(d.rd_width_m) }}</el-descriptions-item>
                <el-descriptions-item label="Reserve Encroachment">{{ fmt(d.rd_reserve_encroachment) }}</el-descriptions-item>
              </el-descriptions>
            </div></ElCollapseTransition>
          </div>

          <div :class="prefixCls">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.drainage = !collapsed.drainage">
              <span style="font-weight:600;">Drainage</span><Icon :icon="collapsed.drainage ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition><div v-show="!collapsed.drainage" style="padding: 12px;">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="Drainage Location">{{ fmt(d.rd_drainage_location) }}</el-descriptions-item>
                <el-descriptions-item label="Drainage Condition">{{ fmt(d.rd_drainage_condition) }}</el-descriptions-item>
              </el-descriptions>
            </div></ElCollapseTransition>
          </div>

        </el-tab-pane>
        <el-tab-pane label="Location" name="map">
          <div v-loading="mapLoading" style="height: 520px; width: 100%; border-radius: 6px; overflow: hidden;">
            <GoogleMap
              v-if="activeTab === 'map'"
              ref="mapRef"
              :api-key="GOOGLE_MAPS_API_KEY"
              style="width:100%;height:100%;"
              :center="mapCenter"
              :zoom="15"
              map-type-id="satellite"
              :map-type-control="true"
              :street-view-control="false"
            >
              <Polygon v-for="poly in settlementPolygons" :key="poly.id" :options="poly" />
              <Polyline
                v-for="line in roadLines"
                :key="line.id"
                :options="line"
              />
            </GoogleMap>
          </div>
          <div v-if="d.settlement?.name" style="display:flex;gap:20px;margin-top:10px;font-size:13px;color:#606266;align-items:center;">
            <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:16px;height:4px;background:#1a73e8;border-radius:2px;"></span>{{ d.settlement.name }} boundary</span>
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
