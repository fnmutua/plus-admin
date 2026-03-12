<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElCard, ElTabs, ElTabPane, ElButton, ElDescriptions, ElDescriptionsItem, ElTag, ElAlert, ElCollapseTransition } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import { GoogleMap, Polygon, Marker, InfoWindow } from 'vue3-google-map'
import { useDesign } from '@/hooks/web/useDesign'
import { getSettlementListByCounty, getOneGeo, getSettlementMapData } from '@/api/settlements'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const GOOGLE_MAPS_API_KEY = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('descriptions')

const collapsed = reactive({ general: false })

const loading = ref(true)
const error = ref('')
const activeTab = ref('profile')
const d = ref<any>({})

const mapRef = ref()
const mapLoading = ref(false)
const mapCenter = ref({ lat: -1.286389, lng: 36.817223 })
const facilityMarker = ref<any>(null)
const showInfoWindow = ref(false)
const settlementPolygons = ref<any[]>([])
const mapDataLoaded = ref(false)

const fmt = (val: any) => (val === null || val === undefined || val === '') ? '–' : val

const loadProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await getSettlementListByCounty({
      limit: 1, page: 1, curUser: 1,
      model: 'community_hall',
      searchField: 'community_hall_name', searchKeyword: '',
      filters: ['id'], filterValues: [[id]],
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward']
    })
    d.value = res.data[0] || {}
  } catch (e: any) {
    error.value = e?.message || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

const loadMapData = async () => {
  if (mapDataLoaded.value) return
  mapLoading.value = true
  try {
    const geoRes = await getOneGeo({ model: 'community_hall', id })
    const features = geoRes.data?.[0]?.json_build_object?.features
    if (features?.length) {
      const [lng, lat] = features[0].geometry.coordinates
      facilityMarker.value = { position: { lat, lng }, title: d.value.community_hall_name }
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
        if (mapRef.value?.map && window.google?.maps) {
          const bounds = new google.maps.LatLngBounds()
          settlementPolygons.value.forEach(p => p.paths.forEach((pt: any) => bounds.extend(pt)))
          if (facilityMarker.value) bounds.extend(facilityMarker.value.position)
          mapRef.value.map.fitBounds(bounds, 40)
        }
      }
    }
    mapDataLoaded.value = true
  } catch (e) { console.error('Map data error', e) }
  finally { mapLoading.value = false }
}

const onMapReady = () => {}
const onTabChange = (tab: string) => { if (tab === 'map') loadMapData() }

onMounted(loadProfile)
</script>

<template>
  <div style="padding: 16px;">
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon style="margin-bottom: 16px;" />
    <el-card v-loading="loading">
      <template #header>
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <el-button :icon="Back" size="small" @click="router.back()">Back</el-button>
          <span style="font-size: 18px; font-weight: 600;">{{ d.community_hall_name || 'Community Hall' }}</span>
          <el-tag v-if="d.isApproved" size="small" :type="d.isApproved === 'Approved' ? 'success' : d.isApproved === 'Rejected' ? 'danger' : ''">{{ d.isApproved }}</el-tag>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="Profile" name="profile">

          <div :class="prefixCls">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.general = !collapsed.general">
              <span style="font-weight:600;">General</span>
              <Icon :icon="collapsed.general ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsed.general" style="padding: 12px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="Name">{{ fmt(d.community_hall_name) }}</el-descriptions-item>
                  <el-descriptions-item label="Code">{{ fmt(d.code) }}</el-descriptions-item>
                  <el-descriptions-item label="Use">{{ fmt(d.use) }}</el-descriptions-item>
                  <el-descriptions-item label="Usage Fee">{{ fmt(d.usage_fee) }}</el-descriptions-item>
                  <el-descriptions-item label="Condition">{{ fmt(d.condition) }}</el-descriptions-item>
                  <el-descriptions-item label="Ownership">{{ fmt(d.ownership) }}</el-descriptions-item>
                  <el-descriptions-item label="Owner">{{ fmt(d.owner) }}</el-descriptions-item>
                  <el-descriptions-item label="Reference Name">{{ fmt(d.reference_name) }}</el-descriptions-item>
                  <el-descriptions-item label="Settlement">{{ fmt(d.settlement?.name) }}</el-descriptions-item>
                  <el-descriptions-item label="County">{{ fmt(d.county?.name) }}</el-descriptions-item>
                  <el-descriptions-item label="Approval Status">{{ fmt(d.isApproved) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </ElCollapseTransition>
          </div>

        </el-tab-pane>

        <el-tab-pane label="Location" name="map">
          <div v-loading="mapLoading" style="height: 520px; width: 100%; border-radius: 6px; overflow: hidden;">
            <GoogleMap v-if="activeTab === 'map'" ref="mapRef" :api-key="GOOGLE_MAPS_API_KEY"
              style="width: 100%; height: 100%;" :center="mapCenter" :zoom="16"
              map-type-id="satellite" :map-type-control="true" :street-view-control="false">
              <Polygon v-for="poly in settlementPolygons" :key="poly.id" :options="poly" />
              <Marker v-if="facilityMarker" :options="facilityMarker" @click="showInfoWindow = true">
                <InfoWindow v-model="showInfoWindow">
                  <div style="padding: 4px 8px; font-weight: 600;">{{ d.community_hall_name }}</div>
                  <div style="font-size: 12px; color: #666;">{{ d.settlement?.name }}</div>
                </InfoWindow>
              </Marker>
            </GoogleMap>
          </div>
          <div style="display:flex;gap:20px;margin-top:10px;font-size:13px;color:#606266;align-items:center;">
            <span style="display:flex;align-items:center;gap:6px;">
              <img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" style="height:18px;" />
              {{ d.community_hall_name }}
            </span>
            <span v-if="d.settlement?.name" style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:16px;height:4px;background:#1a73e8;border-radius:2px;"></span>
              {{ d.settlement.name }} boundary
            </span>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>
