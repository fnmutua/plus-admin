<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElTabs, ElTabPane, ElButton, ElDescriptions, ElDescriptionsItem, ElTag, ElAlert, ElCollapseTransition, ElTable, ElTableColumn, ElMessage, ElPopconfirm } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { GoogleMap, Polygon, Marker, InfoWindow } from 'vue3-google-map'
import { useDesign } from '@/hooks/web/useDesign'
import { getSettlementListByCounty, getOneGeo, getSettlementMapData, getLinkedDocuments, unlinkDocument, DeleteRecord, deleteDocument } from '@/api/settlements'
import { getFile } from '@/api/summary'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const GOOGLE_MAPS_API_KEY = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('descriptions')
const collapsed = reactive({ general: false, details: false })
const loading = ref(true); const error = ref(''); const activeTab = ref('profile')
const d = ref<any>({})
const mapRef = ref(); const mapLoading = ref(false)
const mapCenter = ref({ lat: -1.286389, lng: 36.817223 })
const facilityMarker = ref<any>(null); const showInfoWindow = ref(false)
const settlementPolygons = ref<any[]>([]); const mapDataLoaded = ref(false)
const fmt = (val: any) => (val === null || val === undefined || val === '') ? '–' : val

const loadProfile = async () => {
  loading.value = true; error.value = ''
  try {
    const res = await getSettlementListByCounty({ limit: 1, page: 1, curUser: 1, model: 'water_point', searchField: 'name', searchKeyword: '', filters: ['id'], filterValues: [[id]], associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward'] })
    d.value = res.data[0] || {}
  } catch (e: any) { error.value = e?.message || 'Failed to load profile' }
  finally { loading.value = false }
}

const loadMapData = async () => {
  if (mapDataLoaded.value) return
  mapLoading.value = true
  try {
    const geoRes = await getOneGeo({ model: 'water_point', id })
    const features = geoRes.data?.[0]?.json_build_object?.features
    if (features?.length) {
      const [lng, lat] = features[0].geometry.coordinates
      facilityMarker.value = { position: { lat, lng }, title: d.value.name }
      mapCenter.value = { lat, lng }
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
          if (facilityMarker.value) bounds.extend(facilityMarker.value.position)
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
    const res: any = await getLinkedDocuments({ entity_type: 'water_point', entity_id: Number(id) })
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
    await unlinkDocument({ document_id: row.id, entity_type: 'water_point', entity_id: Number(id) })
    facilityDocuments.value = facilityDocuments.value.filter(d => d.id !== row.id)
    ElMessage.success('Document unlinked')
  } catch { ElMessage.error('Failed to unlink document') }
}

const handleRemoveDocument = async (row: any) => {
  try {
    try { await unlinkDocument({ document_id: row.id, entity_type: 'water_point', entity_id: Number(id) }) } catch { /* ignore */ }
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
          <span style="font-size: 18px; font-weight: 600;">{{ d.name || 'Water Point' }}</span>
          <el-tag v-if="d.type" size="small" type="info">{{ d.type }}</el-tag>
          <el-tag v-if="d.condition" size="small">{{ d.condition }}</el-tag>
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
                <el-descriptions-item label="Type">{{ fmt(d.type) }}</el-descriptions-item>
                <el-descriptions-item label="Ownership Type">{{ fmt(d.ownership_type) }}</el-descriptions-item>
                <el-descriptions-item label="Owner">{{ fmt(d.owner) }}</el-descriptions-item>
                <el-descriptions-item label="Provider">{{ fmt(d.name_of_provider) }}</el-descriptions-item>
                <el-descriptions-item label="Settlement">{{ fmt(d.settlement?.name) }}</el-descriptions-item>
                <el-descriptions-item label="County">{{ fmt(d.settlement?.county?.name) }}</el-descriptions-item>
                <el-descriptions-item label="Approval Status">{{ fmt(d.isApproved) }}</el-descriptions-item>
              </el-descriptions>
            </div></ElCollapseTransition>
          </div>

          <div :class="prefixCls">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.details = !collapsed.details">
              <span style="font-weight:600;">Details</span><Icon :icon="collapsed.details ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition><div v-show="!collapsed.details" style="padding: 12px;">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="Capacity">{{ fmt(d.capacity) }}</el-descriptions-item>
                <el-descriptions-item label="Depth">{{ fmt(d.depth) }}</el-descriptions-item>
                <el-descriptions-item label="Condition">{{ fmt(d.condition) }}</el-descriptions-item>
                <el-descriptions-item label="Availability">{{ fmt(d.availability) }}</el-descriptions-item>
                <el-descriptions-item label="Catchment">{{ fmt(d.catchment) }}</el-descriptions-item>
                <el-descriptions-item label="Price">{{ fmt(d.price) }}</el-descriptions-item>
                <el-descriptions-item label="Cost per 20L Jerrican">{{ fmt(d.cost_of_20_litre_jerrican) }}</el-descriptions-item>
              </el-descriptions>
            </div></ElCollapseTransition>
          </div>

        </el-tab-pane>
        <el-tab-pane label="Location" name="map">
          <div v-loading="mapLoading" style="height: 520px; width: 100%; border-radius: 6px; overflow: hidden;">
            <GoogleMap v-if="activeTab === 'map'" ref="mapRef" :api-key="GOOGLE_MAPS_API_KEY" style="width:100%;height:100%;" :center="mapCenter" :zoom="15" map-type-id="satellite" :map-type-control="true" :street-view-control="false">
              <Polygon v-for="poly in settlementPolygons" :key="poly.id" :options="poly" />
              <Marker v-if="facilityMarker" :options="facilityMarker" @click="showInfoWindow = true">
                <InfoWindow v-model="showInfoWindow">
                  <div style="padding:4px 8px;font-weight:600;">{{ d.name }}</div>
                  <div style="font-size:12px;color:#666;">{{ d.settlement?.name }}</div>
                </InfoWindow>
              </Marker>
            </GoogleMap>
          </div>
          <div style="display:flex;gap:20px;margin-top:10px;font-size:13px;color:#606266;align-items:center;">
            <span style="display:flex;align-items:center;gap:6px;"><img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" style="height:18px;" />{{ d.name }}</span>
            <span v-if="d.settlement?.name" style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:16px;height:4px;background:#1a73e8;border-radius:2px;"></span>{{ d.settlement.name }} boundary</span>
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
                    <el-popconfirm title="Unlink this document from this facility? The document will not be deleted." confirm-button-text="Unlink" cancel-button-text="Cancel" @confirm="handleUnlinkDocument(scope.row)">
                      <template #reference>
                        <el-button plain type="warning">
                          <Icon icon="mdi:link-off" style="margin-right:5px;" /> Unlink
                        </el-button>
                      </template>
                    </el-popconfirm>
                    <el-popconfirm title="Delete this document permanently? This cannot be undone." confirm-button-text="Delete" cancel-button-text="Cancel" confirm-button-type="danger" @confirm="handleRemoveDocument(scope.row)">
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
