<script setup lang="ts">
import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage, ElCard, ElTable, ElTableColumn, ElCol, ElPagination, ElEmpty, ElButton, ElRow, ElSelect, ElOption, ElDrawer } from 'element-plus'
import { useRouter } from 'vue-router'
import { getListWithoutGeo } from '@/api/counties'
import { DeleteRecord, getSettlementListByCounty, getOneGeo, getfilteredGeo, searchByKeyWord } from '@/api/settlements'
import TableActions from '@/views/Components/TableActions.vue'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import { Plus, Filter, Search, Back } from '@element-plus/icons-vue'
import { GOOGLE_MAPS_API_KEY as googleMapsApiKey } from '@/config/googleMaps'

const powerlineModel = 'powerline'
const actionButtons = ref<string[]>(['viewProfile', 'viewOnMap', 'delete'])
const tableDataList = ref<any[]>([])
const loading = ref(false)
const searchLoading = ref(false)
const page = ref(1)
const pSize = ref(10)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchString = ref('')
const selectedCounty = ref<any[]>([])
const selectedSettlement = ref<any[]>([])
const countyOptions = ref<any[]>([])
const settlementOptions = ref<any[]>([])
const mapDrawerVisible = ref(false)
const mapDrawerContainer = ref<HTMLElement | null>(null)
const mapDrawerFacility = ref<any>(null)
const googleMap = ref<any>(null)
const settlementPolygon = ref<any>(null)
const powerlineOverlays = ref<any[]>([])
const selectedPowerlineId = ref<number | string | null>(null)

const { push } = useRouter()
const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const showEditButtons = ref(appStore.getEditButtons)
const isMobile = computed(() => appStore.getMobile)

const isSuperAdmin = computed(() => userInfo?.roles?.some((role: any) => role.name === 'super_admin' || role.name === 'root_admin') || false)
const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles))
const userCountyRole = computed(() => userInfo?.roles?.find((role: any) => role.user_roles?.location_level === 'county'))
const userCountyId = computed(() => userCountyRole.value?.user_roles?.county_id || null)
const userSettlementRole = computed(() => userInfo?.roles?.find((role: any) => role.user_roles?.location_level === 'settlement'))
const userSettlementId = computed(() => userSettlementRole.value?.user_roles?.settlement_id || null)
const isCountyRestricted = computed(() => !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value)

const getCountyNames = async () => {
  const response: any = await getListWithoutGeo({
    params: { pageIndex: 1, limit: 100, curUser: 1, model: 'county', searchField: '', searchKeyword: '', sort: 'ASC' }
  })
  countyOptions.value = (response?.data || []).map((c: any) => ({ label: c.name, value: c.id }))
}

const getSettlementNames = async () => {
  const response: any = await getListWithoutGeo({
    params: {
      pageIndex: 1,
      limit: 2000,
      curUser: 1,
      model: 'settlement',
      searchField: selectedCounty.value?.length ? 'county_id' : '',
      searchKeyword: selectedCounty.value?.length ? selectedCounty.value : '',
      sort: 'ASC'
    }
  })
  settlementOptions.value = (response?.data || []).map((s: any) => ({ label: s.name, value: s.id }))
}

const buildFilters = () => {
  const filters: string[] = []
  const filterValues: any[] = []
  if (isCountyRestricted.value && userCountyId.value) {
    filters.push('county_id')
    filterValues.push([userCountyId.value])
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    filters.push('settlement_id')
    filterValues.push([userSettlementId.value])
  }
  if (selectedCounty.value?.length) {
    filters.push('county_id')
    filterValues.push(selectedCounty.value)
  }
  if (selectedSettlement.value?.length) {
    filters.push('settlement_id')
    filterValues.push(selectedSettlement.value)
  }
  return { filters, filterValues }
}

const getFilteredData = async () => {
  loading.value = true
  const { filters, filterValues } = buildFilters()
  const formData: any = {
    limit: pSize.value,
    page: page.value,
    curUser: 1,
    model: powerlineModel,
    searchField: 'name',
    searchKeyword: searchString.value || '',
    filters,
    filterValues,
    associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward']
  }
  const res: any = await getSettlementListByCounty(formData)
  tableDataList.value = res?.data || []
  total.value = res?.total || tableDataList.value.length || 0
  currentPage.value = page.value
  pageSize.value = pSize.value
  loading.value = false
}

const getFilteredBySearchData = async () => {
  searchLoading.value = true
  page.value = 1
  currentPage.value = 1
  const { filters, filterValues } = buildFilters()
  const formData: any = {
    limit: pSize.value,
    page: page.value,
    curUser: 1,
    model: powerlineModel,
    searchField: 'name',
    searchKeyword: searchString.value || '',
    filters,
    filterValues,
    associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward']
  }
  const res: any = await searchByKeyWord(formData)
  tableDataList.value = res?.data || []
  total.value = res?.total || tableDataList.value.length || 0
  searchLoading.value = false
}

const handleClear = async () => {
  selectedCounty.value = []
  selectedSettlement.value = []
  searchString.value = ''
  pSize.value = 10
  pageSize.value = 10
  page.value = 1
  currentPage.value = 1
  await getSettlementNames()
  await getFilteredData()
}

const onPageChange = async (selPage: number) => {
  page.value = selPage
  currentPage.value = selPage
  await getFilteredData()
}
const onPageSizeChange = async (size: number) => {
  pSize.value = size
  pageSize.value = size
  page.value = 1
  currentPage.value = 1
  await getFilteredData()
}

const AddFacility = () => {
  push({ name: 'AddFacility' })
}
const viewProfile = (row: any) => {
  push({
    name: 'OtherFacilityDetails',
    params: { id: row.id },
    query: { model: powerlineModel, title: 'Powerline' }
  })
}
const flyTo = async (row: any) => {
  selectedPowerlineId.value = row?.id ?? null
  mapDrawerFacility.value = row
  mapDrawerVisible.value = true
  await nextTick()
  await initializeMapDrawer(row)
}
const DeleteFacility = async (row: any) => {
  try {
    const formData: Record<string, any> = { id: row.id, model: powerlineModel }
    await DeleteRecord(formData as any)
    ElMessage.success('Record deleted successfully')
    await getFilteredData()
  } catch {
    ElMessage.error('Failed to delete record')
  }
}

const goBack = () => window.history.back()

const getPointCoords = (geom: any): [number, number] | null => {
  if (!geom) return null
  if (geom.type === 'Point' && Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
    return [Number(geom.coordinates[0]), Number(geom.coordinates[1])]
  }
  if (geom.type === 'MultiPoint' && Array.isArray(geom.coordinates) && geom.coordinates.length > 0) {
    const first = geom.coordinates[0]
    if (Array.isArray(first) && first.length >= 2) return [Number(first[0]), Number(first[1])]
  }
  return null
}

const onCountyChange = async () => {
  selectedSettlement.value = []
  page.value = 1
  currentPage.value = 1
  await getSettlementNames()
  await getFilteredData()
}
const onSettlementChange = async () => {
  page.value = 1
  currentPage.value = 1
  await getFilteredData()
}

const initializeMapDrawer = async (facility: any) => {
  if (!mapDrawerContainer.value) await nextTick()
  if (!mapDrawerContainer.value) return
  const settlementId = facility?.settlement_id || facility?.settlement?.id
  if (!settlementId) return

  await loadGoogleMapsApi()

  googleMap.value = new window.google.maps.Map(mapDrawerContainer.value, {
    center: { lat: 1.137451, lng: 37.137343 },
    zoom: 11,
    mapTypeId: window.google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true
  })

  try {
    const geoForm: any = { model: 'settlement', id: settlementId }
    const geoRes: any = await getOneGeo(geoForm as any)
    const feature = geoRes?.data?.[0]?.json_build_object?.features?.[0]
    if (feature?.geometry?.type === 'Polygon' || feature?.geometry?.type === 'MultiPolygon') {
      const paths = feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates[0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))
        : feature.geometry.coordinates[0][0].map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }))
      settlementPolygon.value = new window.google.maps.Polygon({
        paths,
        strokeColor: '#FF0000',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillOpacity: 0,
        map: googleMap.value
      })
      const bounds = new window.google.maps.LatLngBounds()
      paths.forEach((p: any) => bounds.extend(p))
      googleMap.value.fitBounds(bounds)
    }
  } catch (e) {
    // keep map usable even if settlement boundary fails
  }

  await loadPowerlinesOnMap(settlementId)
  await loadPowerlineAssetsOnMap(settlementId)
}

const loadPowerlinesOnMap = async (settlementId: number) => {
  powerlineOverlays.value.forEach((o: any) => o.setMap(null))
  powerlineOverlays.value = []

  const geoFilterForm: any = {
    model: powerlineModel,
    columnFilterField: 'settlement_id',
    selectedParents: settlementId,
    filtredGeoIds: [settlementId]
  }
  const res: any = await getfilteredGeo(geoFilterForm as any)
  const geoJsonData = res?.data?.[0]?.json_build_object || res?.data?.[0]?.[0]?.json_build_object || res?.[0]?.json_build_object
  const features = geoJsonData?.features || []
  features.forEach((feature: any) => {
    const geomType = feature?.geometry?.type
    if (!['LineString', 'MultiLineString'].includes(geomType)) return
    const coords = feature.geometry.coordinates
    const path = geomType === 'LineString'
      ? coords.map((c: number[]) => ({ lat: c[1], lng: c[0] }))
      : (coords[0] || []).map((c: number[]) => ({ lat: c[1], lng: c[0] }))
    const featureId = feature?.properties?.id ?? feature?.properties?.powerline_id
    const isCurrent = selectedPowerlineId.value !== null && String(featureId) === String(selectedPowerlineId.value)
    const polyline = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: isCurrent ? '#22c55e' : '#9ca3af',
      strokeOpacity: isCurrent ? 1 : 0.75,
      strokeWeight: isCurrent ? 6 : 4,
      map: googleMap.value
    })
    powerlineOverlays.value.push(polyline)
  })
}

const assetMarkers = ref<any[]>([])

const loadPowerlineAssetsOnMap = async (settlementId: number) => {
  assetMarkers.value.forEach((m: any) => m.setMap(null))
  assetMarkers.value = []

  try {
    const geoFilterForm: any = {
      model: 'powerline_asset',
      columnFilterField: 'settlement_id',
      selectedParents: settlementId,
      filtredGeoIds: [settlementId]
    }
    const res: any = await getfilteredGeo(geoFilterForm as any)
    const geoJsonData = res?.data?.[0]?.json_build_object || res?.data?.[0]?.[0]?.json_build_object || res?.[0]?.json_build_object
    const features = geoJsonData?.features || []

    const assetColorMap: Record<string, string> = {
      transformer: '#f59e0b',
      pylon: '#6366f1',
      substation: '#ef4444'
    }

    features.forEach((feature: any) => {
      const point = getPointCoords(feature?.geometry)
      if (!point) return
      const [lng, lat] = point
      const assetType = feature?.properties?.PA_Type || feature?.properties?.asset_type || ''
      const markerColor = assetColorMap[assetType] || '#3b82f6'
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMap.value,
        title: feature?.properties?.PA_Name || feature?.properties?.name || `Powerline Asset (${assetType})`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: markerColor,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        zIndex: 600
      })

      marker.addListener('click', () => {
        const props = feature?.properties || {}
        const infoContent = `
          <div style="padding:6px;min-width:180px">
            <strong>${props.PA_Name || props.name || 'Asset'}</strong><br/>
            <span>Type: ${props.PA_Type || props.asset_type || 'N/A'}</span><br/>
            <span>Condition: ${props.PA_Condition || props.condition || 'N/A'}</span><br/>
            <span>Rating: ${props.PA_Rating || 'N/A'}</span><br/>
            <span>ID: ${props.PA_Identifier || props.identifier || 'N/A'}</span>
          </div>
        `
        const infoWindow = new window.google.maps.InfoWindow({ content: infoContent })
        infoWindow.open(googleMap.value, marker)
      })

      assetMarkers.value.push(marker)
    })
  } catch (e) {
    console.error('Failed to load powerline assets:', e)
  }
}

const handleMapDrawerClose = () => {
  mapDrawerVisible.value = false
  powerlineOverlays.value.forEach((o: any) => o.setMap(null))
  powerlineOverlays.value = []
  assetMarkers.value.forEach((m: any) => m.setMap(null))
  assetMarkers.value = []
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
  }
  googleMap.value = null
  mapDrawerFacility.value = null
  selectedPowerlineId.value = null
}

watch(mapDrawerVisible, (v) => {
  if (v && googleMap.value) {
    setTimeout(() => {
      window.google.maps.event.trigger(googleMap.value, 'resize')
    }, 300)
  }
})

getCountyNames()
getSettlementNames()
getFilteredData()
</script>

<template>
  <el-card>
    <el-row :gutter="10" style="margin-bottom: 10px;">
      <el-col :xs="24" :sm="24" :md="2" :lg="2">
        <el-button type="primary" plain :icon="Back" @click="goBack">Back</el-button>
      </el-col>
      <el-col :xs="24" :sm="24" :md="6" :lg="5">
        <el-select v-model="selectedCounty" multiple clearable filterable collapse-tags placeholder="By County" @change="onCountyChange">
          <el-option v-for="item in countyOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>
      <el-col :xs="24" :sm="24" :md="6" :lg="5">
        <el-select v-model="selectedSettlement" multiple clearable filterable collapse-tags placeholder="By Settlement" @change="onSettlementChange">
          <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8" :lg="6">
        <el-input v-model="searchString" clearable placeholder="Search by name" @change="getFilteredBySearchData">
          <template #append>
            <el-button v-loading="searchLoading" :icon="Search" @click="getFilteredBySearchData" />
          </template>
        </el-input>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8" :lg="6">
        <div style="display: flex; align-items: center; gap: 10px;">
          <PermissionWrapper :permissions="'powerline:create'">
            <el-button @click="AddFacility" type="primary" :icon="Plus" />
          </PermissionWrapper>
          <el-button @click="handleClear" type="primary" :icon="Filter" />
          <DownloadCustom v-if="showEditButtons" :data="tableDataList" :model="powerlineModel" :associated_models="['settlement', 'county', 'subcounty', 'ward']"
                      :total="total"
/>
        </div>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="tableDataList" border :size="isMobile ? 'small' : 'default'" style="width: 100%;">
      <el-table-column label="Name" min-width="180" show-overflow-tooltip>
        <template #default="scope">{{ scope?.row?.PL_Name || scope?.row?.name || 'N/A' }}</template>
      </el-table-column>
      <el-table-column label="Location" min-width="260">
        <template #default="scope">
          {{ scope?.row?.settlement?.name || 'N/A' }}, {{ scope?.row?.ward?.name || 'N/A' }} ward, {{ scope?.row?.subcounty?.name || 'N/A' }} subcounty, {{ scope?.row?.county?.name || 'N/A' }} County
        </template>
      </el-table-column>
      <el-table-column label="Phases" min-width="130">
        <template #default="scope">{{ scope?.row?.PL_Phases || scope?.row?.phases || 'N/A' }}</template>
      </el-table-column>
      <el-table-column label="Supply Type" min-width="160">
        <template #default="scope">{{ scope?.row?.PL_Type_of_Supply || scope?.row?.type_of_supply || 'N/A' }}</template>
      </el-table-column>
      <el-table-column label="Actions" :min-width="isMobile ? 72 : 160" align="center" fixed="right">
        <template #default="scope">
          <TableActions
            :item="scope?.row || {}"
            :buttons="actionButtons"
            @view-profile="viewProfile"
            @view-on-map="flyTo"
            @delete="DeleteFacility"
          />
        </template>
      </el-table-column>
    </el-table>

    <div v-if="!tableDataList.length" class="no-data-message">
      <el-empty description="No powerline facilities found" />
    </div>

    <el-pagination
      v-if="tableDataList.length"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      :page-sizes="[10, 25, 50, 100]"
      :total="total"
      :background="true"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4 facility-pagination"
    />
    <el-drawer
      v-model="mapDrawerVisible"
      title="Settlement Map with Powerlines"
      direction="rtl"
      :size="isMobile ? '100%' : '60%'"
      :before-close="handleMapDrawerClose"
      class="map-drawer"
    >
      <template #header>
        <div class="drawer-header-mobile">
          <span class="drawer-title">{{ mapDrawerFacility?.name || mapDrawerFacility?.PL_Name || 'Powerline Map' }}</span>
          <el-button type="danger" size="default" @click="handleMapDrawerClose" class="close-btn-mobile">Close</el-button>
        </div>
      </template>
      <div class="map-container-wrapper">
        <div ref="mapDrawerContainer" class="map-container"></div>
        <!-- Legend -->
        <div class="map-legend">
          <h4 class="legend-title">Map Legend</h4>
          <div class="legend-section">Powerlines</div>
          <div class="legend-item">
            <span class="legend-line" style="background:#22c55e;"></span>
            <span class="legend-label">Selected powerline</span>
          </div>
          <div class="legend-item">
            <span class="legend-line" style="background:#9ca3af;"></span>
            <span class="legend-label">Other powerlines</span>
          </div>
          <div class="legend-section">Powerline Assets</div>
          <div class="legend-item">
            <span class="legend-dot" style="background:#f59e0b;"></span>
            <span class="legend-label">Transformer</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background:#6366f1;"></span>
            <span class="legend-label">Pylon</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background:#ef4444;"></span>
            <span class="legend-label">Substation</span>
          </div>
          <div class="legend-section">Boundary</div>
          <div class="legend-item">
            <div class="legend-line legend-line-dashed" style="background-color: transparent; border-bottom: 3px dashed #FF0000;"></div>
            <span class="legend-label">Settlement boundary</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </el-card>
</template>

<style scoped>
.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}
.map-container-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 120px);
}
.map-container {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}
.map-drawer :deep(.el-drawer__body) {
  padding: 0;
}
.map-legend { position: absolute; bottom: 20px; right: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.2); z-index: 1000; max-width: 280px; max-height: 60vh; overflow-y: auto; }
.legend-title { margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #333; }
.legend-section { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; margin: 10px 0 6px 0; border-top: 1px solid #eee; padding-top: 8px; }
.legend-section:first-of-type { border-top: none; margin-top: 4px; padding-top: 0; }
.legend-item { display: flex; align-items: center; margin-bottom: 6px; }
.legend-dot { width: 14px; height: 14px; border-radius: 50%; margin-right: 10px; flex-shrink: 0; border: 2px solid #fff; box-shadow: 0 0 2px rgba(0,0,0,0.3); }
.legend-line { width: 24px; height: 4px; border-radius: 2px; margin-right: 10px; flex-shrink: 0; }
.legend-line-dashed { height: 0; }
.legend-arrow { font-size: 14px; margin-right: 10px; flex-shrink: 0; width: 14px; text-align: center; }
.legend-label { font-size: 12px; color: #333; line-height: 1.4; }
.drawer-header-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.drawer-title {
  font-size: 16px;
  font-weight: 600;
}
.close-btn-mobile {
  padding: 8px 16px;
}
</style>
