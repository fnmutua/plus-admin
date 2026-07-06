<script setup lang="ts">
import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, ElCard, ElTable, ElTableColumn, ElCol, ElInput, ElPagination, ElEmpty, ElButton, ElRow, ElSelect, ElOption, ElDrawer, ElForm, ElFormItem, ElDivider, type FormInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import { getListWithoutGeo } from '@/api/counties'
import { DeleteRecord, getSettlementListByCounty, getOneGeo, getfilteredGeo, searchByKeyWord, updateOneRecord } from '@/api/settlements'
import TableActions from '@/views/Components/TableActions.vue'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import { Plus, Filter, Search, Back, Check } from '@element-plus/icons-vue'
import { GOOGLE_MAPS_API_KEY as googleMapsApiKey } from '@/config/googleMaps'

const pageTitle = 'Telecom Mast'
const facilityModel = 'mast'
const createPermission = 'mast:create'

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
const overlays = ref<any[]>([])
const selectedId = ref<number | string | null>(null)

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
    model: facilityModel,
    searchField: 'TC_Name',
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
    model: facilityModel,
    searchField: 'TC_Name',
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

const flyTo = async (row: any) => {
  selectedId.value = row?.id ?? null
  mapDrawerFacility.value = row
  mapDrawerVisible.value = true
  await nextTick()
  await initializeMapDrawer(row)
}

const DeleteFacility = async (row: any) => {
  try {
    const formData: Record<string, any> = { id: row.id, model: facilityModel }
    await DeleteRecord(formData as any)
    ElMessage.success('Record deleted successfully')
    await getFilteredData()
  } catch {
    ElMessage.error('Failed to delete record')
  }
}

const getName = (row: any) => row?.name || row?.TC_Name || 'N/A'
const getType = (row: any) => row?.TC_Type || row?.type || 'N/A'
const getCondition = (row: any) => row?.TC_Condition || row?.condition || row?.Condition || 'N/A'

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

const goBack = () => window.history.back()

const viewProfile = (row: any) => {
  push({
    name: 'OtherFacilityDetails',
    params: { id: row.id },
    query: { model: facilityModel, title: pageTitle }
  })
}

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

const initializeMapDrawer = async (facility: any) => {
  if (!mapDrawerContainer.value) await nextTick()
  if (!mapDrawerContainer.value) return
  const settlementId = facility?.settlement_id || facility?.settlement?.id
  if (!settlementId) return

  await loadGoogleMapsApi()

  googleMap.value = new window.google.maps.Map(mapDrawerContainer.value, {
    center: { lat: 1.137451, lng: 37.137343 },
    zoom: 12,
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
    // continue without boundary
  }

  let features: any[] = []
  try {
    const geoFilterForm: any = {
      model: facilityModel,
      columnFilterField: 'settlement_id',
      selectedParents: settlementId,
      filtredGeoIds: [settlementId]
    }
    const res: any = await getfilteredGeo(geoFilterForm as any)
    const geoJsonData = res?.data?.[0]?.json_build_object || res?.data?.[0]?.[0]?.json_build_object || res?.[0]?.json_build_object
    features = geoJsonData?.features || []
  } catch (e) {
    console.error('Failed to load mast geo data:', e)
  }

  overlays.value.forEach((o: any) => o.setMap(null))
  overlays.value = []

  features.forEach((feature: any) => {
    const point = getPointCoords(feature?.geometry)
    if (!point) return
    const [lng, lat] = point
    const featureId = feature?.properties?.id
    const isCurrent = selectedId.value !== null && String(featureId) === String(selectedId.value)
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: googleMap.value,
      draggable: true,
      title: feature?.properties?.TC_Name || feature?.properties?.name || 'Telecom Mast',
      icon: {
        url: 'icons/tower.png',
        scaledSize: new window.google.maps.Size(30, 30),
        anchor: new window.google.maps.Point(15, 15)
      },
      opacity: isCurrent ? 1 : 0.25,
      zIndex: isCurrent ? 700 : 500
    })
    marker.addListener('click', () => {
      openEditForm(feature?.properties || {})
    })
    marker.addListener('dragend', (dragEvent: any) => {
      const newLat = dragEvent.latLng.lat()
      const newLng = dragEvent.latLng.lng()
      const updatedGeom = {
        type: 'Point',
        coordinates: [newLng, newLat],
        crs: { type: 'name', properties: { name: 'EPSG:4326' } }
      }
      openEditForm({ ...(feature?.properties || {}), geom: updatedGeom })
    })
    overlays.value.push(marker)
  })
}

const handleMapDrawerClose = () => {
  mapDrawerVisible.value = false
  overlays.value.forEach((o: any) => o.setMap(null))
  overlays.value = []
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
  }
  googleMap.value = null
  mapDrawerFacility.value = null
  selectedId.value = null
}

watch(mapDrawerVisible, (v) => {
  if (v && googleMap.value) {
    setTimeout(() => {
      window.google.maps.event.trigger(googleMap.value, 'resize')
    }, 300)
  }
})

// ---- Edit Drawer State ----
const editDrawerVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editingId = ref<number | null>(null)
const isEditMode = ref(false)

const conditionOptions = [
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Critical', value: 'Critical' }
]

const editForm = reactive({
  name: '',
  tc_type: '',
  tc_condition: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  geom: null as any
})

const editFormRules = reactive({
  name: [{ required: true, message: 'Name is required', trigger: 'blur' }]
})

const openEditForm = (facilityData: any) => {
  isEditMode.value = true
  editingId.value = facilityData.id || null

  editForm.name = facilityData.name || facilityData.TC_Name || ''
  editForm.tc_type = facilityData.TC_Type || facilityData.tc_type || ''
  editForm.tc_condition = facilityData.TC_Condition || facilityData.tc_condition || ''
  editForm.settlement_id = facilityData.settlement_id || ''
  editForm.county_id = facilityData.county_id || ''
  editForm.subcounty_id = facilityData.subcounty_id || ''
  editForm.ward_id = facilityData.ward_id || ''
  editForm.geom = facilityData.geom || null

  editDrawerVisible.value = true
}

const submitEditForm = async () => {
  if (!editFormRef.value) return

  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const formData: any = {
          model: facilityModel,
          name: editForm.name,
          TC_Name: editForm.name,
          TC_Type: editForm.tc_type,
          TC_Condition: editForm.tc_condition,
          settlement_id: editForm.settlement_id,
          county_id: editForm.county_id,
          subcounty_id: editForm.subcounty_id,
          ward_id: editForm.ward_id
        }
        if (editForm.geom) {
          formData.geom = editForm.geom
        }

        if (isEditMode.value && editingId.value) {
          formData.id = editingId.value
          const res: any = await updateOneRecord(formData)

          if (res && (res.code === '0000' || res.status === 'success')) {
            ElMessage.success(`${pageTitle} updated successfully`)
            await getFilteredData()
            editDrawerVisible.value = false
          } else {
            ElMessage.error(`Failed to update ${pageTitle.toLowerCase()}`)
          }
        }
      } catch (error) {
        console.error('Error submitting form:', error)
        ElMessage.error(`Failed to save ${pageTitle.toLowerCase()}`)
      }
    }
  })
}

const resetEditForm = () => {
  Object.keys(editForm).forEach(key => {
    if (typeof editForm[key as keyof typeof editForm] === 'string') {
      (editForm as any)[key] = ''
    } else {
      (editForm as any)[key] = undefined
    }
  })
  isEditMode.value = false
  editingId.value = null
}

const closeEditDrawer = () => {
  resetEditForm()
  editDrawerVisible.value = false
}

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
          <PermissionWrapper :permissions="createPermission">
            <el-button @click="AddFacility" type="primary" :icon="Plus" />
          </PermissionWrapper>
          <el-button @click="handleClear" type="primary" :icon="Filter" />
          <DownloadCustom v-if="showEditButtons" :data="tableDataList" :model="facilityModel" :associated_models="['settlement', 'county', 'subcounty', 'ward']"
                      :total="total"
/>
        </div>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="tableDataList" border :size="isMobile ? 'small' : 'default'" style="width: 100%;">
      <el-table-column label="Name" min-width="180" show-overflow-tooltip>
        <template #default="scope">{{ getName(scope?.row || {}) }}</template>
      </el-table-column>
      <el-table-column label="Location" min-width="260">
        <template #default="scope">
          {{ scope?.row?.settlement?.name || 'N/A' }}, {{ scope?.row?.ward?.name || 'N/A' }} ward, {{ scope?.row?.subcounty?.name || 'N/A' }} subcounty, {{ scope?.row?.county?.name || 'N/A' }} County
        </template>
      </el-table-column>
      <el-table-column label="Type" min-width="160">
        <template #default="scope">{{ getType(scope?.row || {}) }}</template>
      </el-table-column>
      <el-table-column label="Condition" min-width="140">
        <template #default="scope">{{ getCondition(scope?.row || {}) }}</template>
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
      <el-empty :description="`No ${pageTitle.toLowerCase()}s found`" />
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
      :title="`Settlement Map with ${pageTitle}s`"
      direction="rtl"
      :size="isMobile ? '100%' : '60%'"
      :before-close="handleMapDrawerClose"
      class="map-drawer"
    >
      <template #header>
        <div class="drawer-header-mobile">
          <span class="drawer-title">{{ mapDrawerFacility?.TC_Name || mapDrawerFacility?.name || 'Telecom Mast Map' }}</span>
          <el-button type="danger" size="default" @click="handleMapDrawerClose" class="close-btn-mobile">Close</el-button>
        </div>
      </template>
      <div class="map-container-wrapper">
        <div ref="mapDrawerContainer" class="map-container"></div>
        <!-- Legend -->
        <div class="map-legend">
          <h4 class="legend-title">Map Legend</h4>
          <div class="legend-item">
            <img src="/icons/tower.png" style="width:22px;height:22px;margin-right:10px;opacity:1;" />
            <span class="legend-label">Selected mast</span>
          </div>
          <div class="legend-item">
            <img src="/icons/tower.png" style="width:22px;height:22px;margin-right:10px;opacity:0.25;" />
            <span class="legend-label">Other masts</span>
          </div>
          <div class="legend-item">
            <div class="legend-line legend-line-dashed" style="background-color: transparent; border-bottom: 3px dashed #FF0000;"></div>
            <span class="legend-label">Settlement boundary</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </el-card>

  <!-- Edit Form Drawer -->
  <el-drawer
    v-model="editDrawerVisible"
    :title="isEditMode ? `Edit ${pageTitle}` : `${pageTitle} Details`"
    direction="rtl"
    :size="isMobile ? '100%' : '600px'"
    :before-close="closeEditDrawer"
    class="edit-form-drawer"
  >
    <el-form
      ref="editFormRef"
      :model="editForm"
      :rules="editFormRules"
      :label-width="isMobile ? '0px' : '180px'"
      :label-position="isMobile ? 'top' : 'left'"
    >
      <el-divider content-position="left">Mast Information</el-divider>

      <el-form-item label="Name" prop="name">
        <el-input v-model="editForm.name" placeholder="Enter mast name" />
      </el-form-item>

      <el-form-item label="Type">
        <el-input v-model="editForm.tc_type" placeholder="Enter mast type" />
      </el-form-item>

      <el-form-item label="Condition">
        <el-select v-model="editForm.tc_condition" placeholder="Select condition" filterable style="width: 100%">
          <el-option
            v-for="item in conditionOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="closeEditDrawer">Cancel</el-button>
        <el-button type="primary" @click="submitEditForm" :icon="Check">
          {{ isEditMode ? `Update ${pageTitle}` : `Save ${pageTitle}` }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped>
.no-data-message { display: flex; justify-content: center; align-items: center; min-height: 180px; }
.map-container-wrapper { position: relative; width: 100%; height: calc(100vh - 120px); }
.map-container { width: 100%; height: 100%; border-radius: 4px; }
.map-drawer :deep(.el-drawer__body) { padding: 0; }
.map-legend { position: absolute; bottom: 20px; right: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.2); z-index: 1000; max-width: 280px; }
.legend-title { margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #333; }
.legend-item { display: flex; align-items: center; margin-bottom: 10px; }
.legend-line { width: 30px; height: 4px; margin-right: 12px; border-radius: 2px; flex-shrink: 0; }
.legend-line-dashed { height: 0; }
.legend-label { font-size: 12px; color: #333; line-height: 1.4; }
.drawer-header-mobile { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.drawer-title { font-size: 16px; font-weight: 600; }
.close-btn-mobile { padding: 8px 16px; }
.drawer-footer { display: flex; justify-content: flex-end; gap: 10px; }
</style>
