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

const collapsed = reactive({ general: false, land: false, students: false, staff: false, infrastructure: false, welfare: false, other: false, contact: false })

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
      model: 'education_facility',
      searchField: 'name', searchKeyword: '',
      filters: ['id'], filterValues: [[id]],
      associated_multiple_models: ['settlement', 'county']
    })
    d.value = res.data[0] || {}
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
    const geoRes = await getOneGeo({ model: 'education_facility', id })
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
  } catch (e) { console.error('Map data error', e) }
  finally { mapLoading.value = false }
}

const fitMapBounds = () => {
  if (!mapRef.value?.map || !window.google?.maps) return
  const bounds = new google.maps.LatLngBounds()
  settlementPolygons.value.forEach(p => p.paths.forEach((pt: any) => bounds.extend(pt)))
  if (facilityMarker.value) bounds.extend(facilityMarker.value.position)
  mapRef.value.map.fitBounds(bounds, 40)
}

const onMapReady = () => { if (activeTab.value === 'map') fitMapBounds() }
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
          <span style="font-size: 18px; font-weight: 600;">{{ d.name || 'Education Facility' }}</span>
          <el-tag v-if="d.education_category" size="small" type="info">{{ d.education_category }}</el-tag>
          <el-tag v-if="d.registration_status" size="small" :type="d.registration_status === 'Registered' ? 'success' : 'warning'">{{ d.registration_status }}</el-tag>
          <el-tag v-if="d.isApproved" size="small" :type="d.isApproved === 'Approved' ? 'success' : d.isApproved === 'Rejected' ? 'danger' : ''">{{ d.isApproved }}</el-tag>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="Profile" name="profile">

          <!-- General -->
          <div :class="prefixCls" style="margin-bottom: 2px;">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.general = !collapsed.general">
              <span style="font-weight:600;">General</span>
              <Icon :icon="collapsed.general ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsed.general" style="padding: 12px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="Name">{{ fmt(d.name) }}</el-descriptions-item>
                  <el-descriptions-item label="Code">{{ fmt(d.code) }}</el-descriptions-item>
                  <el-descriptions-item label="Category">{{ fmt(d.education_category) }}</el-descriptions-item>
                  <el-descriptions-item label="Registration Status">{{ fmt(d.registration_status) }}</el-descriptions-item>
                  <el-descriptions-item label="Registration Number">{{ fmt(d.registration_number) }}</el-descriptions-item>
                  <el-descriptions-item label="Ownership Type">{{ fmt(d.ownership_type) }}</el-descriptions-item>
                  <el-descriptions-item label="Ownership Details">{{ fmt(d.ownership_details) }}</el-descriptions-item>
                  <el-descriptions-item label="Boarding Type">{{ fmt(d.boarding_type) }}</el-descriptions-item>
                  <el-descriptions-item label="Settlement">{{ fmt(d.settlement?.name) }}</el-descriptions-item>
                  <el-descriptions-item label="County">{{ fmt(d.settlement?.county?.name) }}</el-descriptions-item>
                  <el-descriptions-item label="Distance to Settlement (m)">{{ fmt(d.distance_in_meters) }}</el-descriptions-item>
                  <el-descriptions-item label="Approval Status">{{ fmt(d.isApproved) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </ElCollapseTransition>
          </div>

          <!-- Land -->
          <div :class="prefixCls" style="margin-bottom: 2px;">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.land = !collapsed.land">
              <span style="font-weight:600;">Land</span>
              <Icon :icon="collapsed.land ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsed.land" style="padding: 12px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="Land Ownership Status">{{ fmt(d.land_ownership_status) }}</el-descriptions-item>
                  <el-descriptions-item label="Parcel Has Title">{{ fmt(d.parcel_has_title) }}</el-descriptions-item>
                  <el-descriptions-item label="Parcel Size (ha)">{{ fmt(d.parcel_size_hectares) }}</el-descriptions-item>
                  <el-descriptions-item label="Compound Fence Status">{{ fmt(d.compound_fence_status) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </ElCollapseTransition>
          </div>

          <!-- Students -->
          <div :class="prefixCls" style="margin-bottom: 2px;">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.students = !collapsed.students">
              <span style="font-weight:600;">Students</span>
              <Icon :icon="collapsed.students ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsed.students" style="padding: 12px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="Enrolled Boys">{{ fmt(d.enrolled_boys_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Enrolled Girls">{{ fmt(d.enrolled_girls_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Student Source">{{ fmt(d.student_source) }}</el-descriptions-item>
                  <el-descriptions-item label="Dropout Count">{{ fmt(d.dropout_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Dropout Reasons" :span="2">{{ fmt(d.dropout_reasons) }}</el-descriptions-item>
                  <el-descriptions-item label="Retention Efforts" :span="2">{{ fmt(d.retention_efforts) }}</el-descriptions-item>
                  <el-descriptions-item label="Retention Efforts Reasons" :span="2">{{ fmt(d.retention_efforts_reasons) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </ElCollapseTransition>
          </div>

          <!-- Staff -->
          <div :class="prefixCls" style="margin-bottom: 2px;">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.staff = !collapsed.staff">
              <span style="font-weight:600;">Staff</span>
              <Icon :icon="collapsed.staff ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsed.staff" style="padding: 12px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="Male Teachers">{{ fmt(d.male_teachers_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Female Teachers">{{ fmt(d.female_teachers_count) }}</el-descriptions-item>
                  <el-descriptions-item label="BOM Teachers">{{ fmt(d.bom_teachers_count) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </ElCollapseTransition>
          </div>

          <!-- Infrastructure -->
          <div :class="prefixCls" style="margin-bottom: 2px;">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.infrastructure = !collapsed.infrastructure">
              <span style="font-weight:600;">Infrastructure</span>
              <Icon :icon="collapsed.infrastructure ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsed.infrastructure" style="padding: 12px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="Classrooms">{{ fmt(d.classroom_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Permanent Classrooms">{{ fmt(d.permanent_classrooms_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Classroom Condition">{{ fmt(d.classroom_condition) }}</el-descriptions-item>
                  <el-descriptions-item label="Boys Toilets">{{ fmt(d.boys_toilets_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Girls Toilets">{{ fmt(d.girls_toilets_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Toilet Condition">{{ fmt(d.toilet_condition) }}</el-descriptions-item>
                  <el-descriptions-item label="Handwashing Stations">{{ fmt(d.handwashing_stations_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Boreholes">{{ fmt(d.boreholes_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Water Tanks">{{ fmt(d.water_tanks_count) }}</el-descriptions-item>
                  <el-descriptions-item label="Teaching Aids Available">{{ fmt(d.teaching_aids_available) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </ElCollapseTransition>
          </div>

          <!-- Welfare & Fees -->
          <div :class="prefixCls" style="margin-bottom: 2px;">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.welfare = !collapsed.welfare">
              <span style="font-weight:600;">Welfare &amp; Fees</span>
              <Icon :icon="collapsed.welfare ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsed.welfare" style="padding: 12px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="Fees Paid by Students">{{ fmt(d.fees_paid_by_students) }}</el-descriptions-item>
                  <el-descriptions-item label="Term 1 Fees">{{ fmt(d.term_1_fees_amount) }}</el-descriptions-item>
                  <el-descriptions-item label="Term 2 Fees">{{ fmt(d.term_2_fees_amount) }}</el-descriptions-item>
                  <el-descriptions-item label="Term 3 Fees">{{ fmt(d.term_3_fees_amount) }}</el-descriptions-item>
                  <el-descriptions-item label="Sanitary Pads Provision">{{ fmt(d.sanitary_pads_provision) }}</el-descriptions-item>
                  <el-descriptions-item label="Sanitary Pads Provider">{{ fmt(d.sanitary_pads_provider) }}</el-descriptions-item>
                  <el-descriptions-item label="Sanitary Pads Bins">{{ fmt(d.sanitary_pads_bins) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </ElCollapseTransition>
          </div>

          <!-- Other -->
          <div :class="prefixCls" style="margin-bottom: 2px;">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.other = !collapsed.other">
              <span style="font-weight:600;">Other</span>
              <Icon :icon="collapsed.other ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsed.other" style="padding: 12px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="School Challenges" :span="2">{{ fmt(d.school_challenges) }}</el-descriptions-item>
                  <el-descriptions-item label="Additional Comments" :span="2">{{ fmt(d.additional_comments) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </ElCollapseTransition>
          </div>

          <!-- Contact -->
          <div :class="prefixCls">
            <div :class="`${prefixCls}-header`" style="height:50px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;cursor:pointer;border-bottom:1px solid var(--el-border-color-lighter);" @click="collapsed.contact = !collapsed.contact">
              <span style="font-weight:600;">Contact</span>
              <Icon :icon="collapsed.contact ? 'ep:arrow-down' : 'ep:arrow-up'" />
            </div>
            <ElCollapseTransition>
              <div v-show="!collapsed.contact" style="padding: 12px;">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="Respondent Name">{{ fmt(d.respondent_name) }}</el-descriptions-item>
                  <el-descriptions-item label="Respondent Phone">{{ fmt(d.respondent_phone) }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </ElCollapseTransition>
          </div>

        </el-tab-pane>

        <!-- Location tab -->
        <el-tab-pane label="Location" name="map">
          <div v-loading="mapLoading" style="height: 520px; width: 100%; border-radius: 6px; overflow: hidden;">
            <GoogleMap v-if="activeTab === 'map'" ref="mapRef" :api-key="GOOGLE_MAPS_API_KEY"
              style="width: 100%; height: 100%;" :center="mapCenter" :zoom="15"
              map-type-id="satellite" :map-type-control="true" :street-view-control="false" @ready="onMapReady">
              <Polygon v-for="poly in settlementPolygons" :key="poly.id" :options="poly" />
              <Marker v-if="facilityMarker" :options="facilityMarker" @click="showInfoWindow = true">
                <InfoWindow v-model="showInfoWindow">
                  <div style="padding: 4px 8px; font-weight: 600;">{{ d.name }}</div>
                  <div style="font-size: 12px; color: #666;">{{ d.settlement?.name }}</div>
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
      </el-tabs>
    </el-card>
  </div>
</template>
