<script setup lang="ts">
import { loadGoogleMapsApi } from '@/composables/useGoogleMapsLoader'
// @ts-nocheck
import { ref, reactive, nextTick, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

declare global {
  interface Window {
    google: any
  }
}
import {
  ElButton,
  ElSelect,
  ElOption,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElDrawer,
  ElMessage,
  ElSteps,
  ElStep,
  ElRow,
  ElCol,
  ElDivider
} from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import * as turf from '@turf/turf'
import { GOOGLE_MAPS_API_KEY as googleMapsApiKey } from '@/config/googleMaps'
import { getOneGeo } from '@/api/settlements'
import { CreateRecord } from '@/api/settlements'
import { countyOptions, settlementOptionsV2 } from './common/index'
import { useAppStoreWithOut } from '@/store/modules/app'

// Condition options from mapping_tool_rennaisance_questions.json (condition_list)
const conditionOptionsLocal = [
  { label: 'Under construction ', value: 'Under construction ' },
  { label: 'Broken/not in use', value: 'Broken/not in use' },
  { label: 'Operational ', value: 'Operational ' },
  { label: 'Decomissioned', value: 'Decomissioned' }
]

// Ownership options from mapping_tool_rennaisance_questions.json (sponsor_type)
const generalOwnershipLocal = [
  { label: 'Government', value: 'government' },
  { label: 'CBO/NGO', value: 'ngo' },
  { label: 'Individual', value: 'individual' },
  { label: 'Community', value: 'community' }
]

// Pipe type options (from common/index - keeping existing for now as not in JSON)
const pipeOptionsLocal = [
  { label: 'Plastic', value: 'plastic' },
  { label: 'Concrete', value: 'concrete' },
  { label: 'Cast-Iron', value: 'cast_iron' }
]
import { useCache } from '@/hooks/web/useCache'
import { userHasPrivilegedNationalLocation } from '@/utils/roleScope'
import type { FormInstance } from 'element-plus'
import shortid from 'shortid'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const isMobile = computed(() => appStore.getMobile)

// User location-based filtering
const isSuperAdmin = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.name === 'super_admin' || role.name === 'root_admin'
  ) || false
})

const hasNationalAccess = computed(() => userHasPrivilegedNationalLocation(userInfo?.roles))

const userCountyRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'county'
  )
})

const userCountyId = computed(() => {
  return userCountyRole.value?.user_roles?.county_id || null
})

const userSettlementRole = computed(() => {
  return userInfo?.roles?.find((role: any) => 
    role.user_roles?.location_level === 'settlement'
  )
})

const userSettlementId = computed(() => {
  return userSettlementRole.value?.user_roles?.settlement_id || null
})

// Check if user should be restricted to their county
const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

// Filtered county options based on user's location restriction
const filteredCountyOptions = computed(() => {
  if (!isCountyRestricted.value || !userCountyId.value) {
    // No restriction - show all counties
    return countyOptions.value || []
  }
  
  // User is restricted to their county - filter to show only their county
  return (countyOptions.value || []).filter((county: any) => 
    county.value === userCountyId.value
  )
})

const router = useRouter()
const route = useRoute()

// Initialize user county on mount
onMounted(async () => {
  // Check route query params first (from Sewer.vue AddFacility function)
  const routeCountyId = route.query.county_id
  const routeSettlementId = route.query.settlement_id
  
  if (routeCountyId) {
    selectedCounty.value = Array.isArray(routeCountyId) ? parseInt(routeCountyId[0]) : parseInt(routeCountyId as string)
    // Trigger county change to load settlements
    await handleCountyChange(selectedCounty.value)
    if (routeSettlementId) {
      selectedSettlement.value = Array.isArray(routeSettlementId) ? parseInt(routeSettlementId[0]) : parseInt(routeSettlementId as string)
      // Trigger settlement change to proceed to map
      await handleSettlementChange(selectedSettlement.value)
    }
  } else if (isCountyRestricted.value && userCountyId.value) {
    // Pre-select user's county if restricted
    selectedCounty.value = userCountyId.value
    await handleCountyChange(userCountyId.value)
  } else if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
    // User restricted to settlement - find county from settlement
    const settlement = (settlementOptionsV2.value || []).find((s: any) => s.value === userSettlementId.value)
    if (settlement && settlement.county_id) {
      selectedCounty.value = settlement.county_id
      await handleCountyChange(settlement.county_id)
      selectedSettlement.value = userSettlementId.value
      await handleSettlementChange(userSettlementId.value)
    }
  }
})

// Step management
const currentStep = ref(0)
const steps = [
  { title: 'Select Location', description: 'Choose county and settlement' },
  { title: 'Draw Sewer Line', description: 'Draw the sewer line on the map' },
  { title: 'Complete Details', description: 'Fill in sewer information' }
]

// Step 1: Location Selection - Only County and Settlement
const selectedCounty = ref<any>(null)
const selectedSettlement = ref<any>(null)
const filteredSettlements = ref<any[]>([])
const checkingGeometry = ref(false)
const settlementGeometryCache = ref<Map<number, boolean>>(new Map())

// Step 2: Map
const map = ref<any>(null)
const drawingManager = ref<any>(null)
const settlementPolygon = ref<any>(null)
const sewerPolyline = ref<any>(null)
const settlementGeo = ref<any>(null)
const sewerGeometry = ref<any>(null)
const mapContainer = ref<HTMLDivElement | null>(null)

// Step 3: Form Drawer
const drawerVisible = ref(false)
const formRef = ref<FormInstance>()
const sewerForm = reactive({
  name: '',
  pipe_type: '',
  pipe_size: '',
  provider: '',
  provider_category: '',
  condition: '',
  number_of_connections: 0,
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  geom: null
})

const formRules = reactive({
  name: [{ required: true, message: 'Sewer name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }]
})

// Check if settlement has valid geometry (Polygon/MultiPolygon, not Point)
const checkSettlementGeometry = async (settlementId: number): Promise<boolean> => {
  if (settlementGeometryCache.value.has(settlementId)) {
    return settlementGeometryCache.value.get(settlementId) || false
  }

  try {
    const formData = {
      model: 'settlement',
      id: settlementId
    }
    const res = await getOneGeo(formData)

    if (res.data[0]?.json_build_object?.features?.length > 0) {
      const feature = res.data[0].json_build_object.features[0]
      const geometryType = feature.geometry?.type

      const hasValidGeometry = geometryType === 'Polygon' || geometryType === 'MultiPolygon'
      
      settlementGeometryCache.value.set(settlementId, hasValidGeometry)
      return hasValidGeometry
    }
    
    settlementGeometryCache.value.set(settlementId, false)
    return false
  } catch (error) {
    console.error(`Error checking geometry for settlement ${settlementId}:`, error)
    settlementGeometryCache.value.set(settlementId, false)
    return false
  }
}

// Handle county selection - filter settlements with valid geometry
const handleCountyChange = async (countyId: any) => {
  selectedSettlement.value = null
  filteredSettlements.value = []
  
  if (!countyId) return

  // Enforce county restriction
  if (isCountyRestricted.value && userCountyId.value && countyId !== userCountyId.value) {
    ElMessage.error('You can only select facilities in your assigned county')
    selectedCounty.value = userCountyId.value
    return
  }

  checkingGeometry.value = true
  
  try {
    let countySettlements = (settlementOptionsV2.value || []).filter((item: any) => item.county_id === countyId)
    
    // If user is restricted to a specific settlement, filter to that settlement only
    if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
      countySettlements = countySettlements.filter((item: any) => item.value === userSettlementId.value)
    }
    
    const geometryChecks = await Promise.all(
      countySettlements.map(async (settlement: any) => {
        const hasValidGeometry = await checkSettlementGeometry(settlement.value)
        return { settlement, hasValidGeometry }
      })
    )
    
    filteredSettlements.value = geometryChecks
      .filter(({ hasValidGeometry }) => hasValidGeometry)
      .map(({ settlement }) => settlement)
    
    if (filteredSettlements.value.length === 0) {
      ElMessage.warning('No settlements with boundary geometry found for this county')
    }
  } catch (error) {
    console.error('Error filtering settlements:', error)
    ElMessage.error('Failed to filter settlements')
  } finally {
    checkingGeometry.value = false
  }
}

// Handle settlement selection and proceed to map
const handleSettlementChange = async (settlementId: any) => {
  if (!settlementId) return

  try {
    const formData = {
      model: 'settlement',
      id: settlementId
    }
    const res = await getOneGeo(formData)

    if (res.data[0]?.json_build_object?.features) {
      const feature = res.data[0].json_build_object.features[0]
      const geometryType = feature.geometry?.type

      if (geometryType === 'Point' || geometryType === 'MultiPoint') {
        ElMessage.error('This settlement has point geometry. Please select a settlement with boundary geometry (Polygon).')
        return
      }

      settlementGeo.value = res.data[0].json_build_object
      
      const settlement = (settlementOptionsV2.value || []).find((s: any) => s.value === settlementId)
      if (settlement) {
        sewerForm.settlement_id = settlementId
        sewerForm.county_id = settlement.county_id || ''
        sewerForm.subcounty_id = settlement.subcounty_id || ''
        sewerForm.ward_id = settlement.ward_id || ''
      }

      currentStep.value = 1
      await nextTick()
      initializeMap()
    } else {
      ElMessage.error('Settlement has no boundary geometry')
    }
  } catch (error) {
    console.error('Error loading settlement geometry:', error)
    ElMessage.error('Failed to load settlement boundary')
  }
}

// Initialize Google Maps with settlement boundary
const initializeMap = async () => {
  if (!mapContainer.value) return

  await nextTick()

  try {
  await loadGoogleMapsApi()

    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded properly')
    }

    let center = { lat: 1.137451, lng: 37.137343 }
    let zoom = 8

    if (settlementGeo.value) {
      const bounds = turf.bbox(settlementGeo.value)
      center = {
        lat: (bounds[1] + bounds[3]) / 2,
        lng: (bounds[0] + bounds[2]) / 2
      }
      zoom = 13
    }

    map.value = new window.google.maps.Map(mapContainer.value, {
      center: center,
      zoom: zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    })

    if (settlementGeo.value) {
      const features = settlementGeo.value.features
      if (features && features.length > 0) {
        const feature = features[0]
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          const paths = feature.geometry.type === 'Polygon'
            ? feature.geometry.coordinates[0].map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0]
              }))
            : feature.geometry.coordinates[0][0].map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0]
              }))

          settlementPolygon.value = new window.google.maps.Polygon({
            paths: paths,
            strokeColor: '#3388ff',
            strokeOpacity: 1.0,
            strokeWeight: 3,
            fillColor: '#3388ff',
            fillOpacity: 0.1,
            map: map.value
          })

          const bounds = new window.google.maps.LatLngBounds()
          paths.forEach((path: any) => {
            bounds.extend(path)
          })
          map.value.fitBounds(bounds)
        }
      }
    }

    drawingManager.value = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYLINE,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_LEFT,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYLINE]
      },
      polylineOptions: {
        strokeColor: '#8B4513',
        strokeWeight: 4,
        strokeOpacity: 1.0
      }
    })

    drawingManager.value.setMap(map.value)

    window.google.maps.event.addListener(
      drawingManager.value,
      'overlaycomplete',
      (event: any) => {
        if (event.type === window.google.maps.drawing.OverlayType.POLYLINE) {
          const polyline = event.overlay
          sewerPolyline.value = polyline

          const path = polyline.getPath()
          const coordinates: number[][] = []
          
          path.forEach((latLng: any) => {
            coordinates.push([latLng.lng(), latLng.lat()])
          })

          // Convert to MultiLineString for sewer model
          const geometry = {
            type: 'MultiLineString',
            coordinates: [coordinates],
            crs: { type: 'name', properties: { name: 'EPSG:4326' } }
          }

          sewerGeometry.value = geometry
          sewerForm.geom = geometry

          const length = turf.length({ type: 'LineString', coordinates }, { units: 'meters' })
          console.log('Sewer line length:', length, 'meters')

          drawingManager.value?.setDrawingMode(null)

          drawerVisible.value = true
        }
      }
    )
  } catch (error) {
    console.error('Error initializing Google Maps:', error)
    ElMessage.error('Failed to load map')
  }
}

// Submit form
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!sewerForm.geom) {
        ElMessage.error('Please draw the sewer line on the map')
        return
      }

      try {
        // Enforce county restriction for non-admin users
        if (isCountyRestricted.value && userCountyId.value) {
          if (sewerForm.county_id && sewerForm.county_id !== userCountyId.value) {
            ElMessage.error('You can only create facilities in your assigned county')
            return
          }
          // Force county_id to user's county
          sewerForm.county_id = userCountyId.value
        }
        
        // Enforce settlement restriction for settlement-level users
        if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
          if (sewerForm.settlement_id && sewerForm.settlement_id !== userSettlementId.value) {
            ElMessage.error('You can only create facilities in your assigned settlement')
            return
          }
          // Force settlement_id to user's settlement
          sewerForm.settlement_id = userSettlementId.value
          // Also ensure county matches
          if (userCountyId.value) {
            sewerForm.county_id = userCountyId.value
          }
        }
        
        const formData = {
          ...sewerForm,
          model: 'sewer',
          code: shortid.generate(),
          length: turf.length({ type: 'LineString', coordinates: sewerForm.geom.coordinates[0] }, { units: 'meters' }),
          isApproved: 'Pending',
          createdBy: userInfo.id
        }

        const res = await CreateRecord(formData)
        
        if (res.code === '0000') {
          ElMessage.success('Sewer line created successfully')
          router.push({ name: 'Sewer' })
        } else {
          ElMessage.error('Failed to create sewer line')
        }
      } catch (error) {
        console.error('Error creating sewer line:', error)
        ElMessage.error('Failed to create sewer line')
      }
    }
  })
}

// Go back to previous step
const goBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    if (currentStep.value === 0) {
      if (sewerPolyline.value) {
        sewerPolyline.value.setMap(null)
        sewerPolyline.value = null
      }
      if (settlementPolygon.value) {
        settlementPolygon.value.setMap(null)
        settlementPolygon.value = null
      }
      if (drawingManager.value) {
        drawingManager.value.setMap(null)
        drawingManager.value = null
      }
      map.value = null
      settlementGeo.value = null
      sewerGeometry.value = null
    }
  } else {
    router.back()
  }
}

// Close drawer
const closeDrawer = () => {
  drawerVisible.value = false
}

// Reset drawing
const resetDrawing = () => {
  if (sewerPolyline.value) {
    sewerPolyline.value.setMap(null)
    sewerPolyline.value = null
  }
  sewerGeometry.value = null
  sewerForm.geom = null
  if (drawingManager.value && window.google) {
    drawingManager.value.setDrawingMode(window.google.maps.drawing.OverlayType.POLYLINE)
  }
}
</script>

<template>
  <div class="add-sewer-container">
    <el-card>
      <template #header>
        <div class="header-content">
          <el-button :icon="ArrowLeft" @click="goBack" text>Back</el-button>
          <h2>Add New Sewer Line</h2>
        </div>
      </template>

      <el-steps :active="currentStep" finish-status="success" align-center class="steps-indicator">
        <el-step
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
          :description="step.description"
        />
      </el-steps>

      <el-divider />

      <div v-if="currentStep === 0" class="step-content">
        <el-form label-width="150px" label-position="left">
          <el-row :gutter="20">
            <el-col :span="24" :md="12">
              <el-form-item label="County" required>
                <el-select
                  v-model="selectedCounty"
                  placeholder="Select County"
                  filterable
                  clearable
                  @change="handleCountyChange"
                  :disabled="isCountyRestricted"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in filteredCountyOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <div v-if="isCountyRestricted" style="font-size: 12px; color: #909399; margin-top: 5px;">
                  You are restricted to your assigned county
                </div>
              </el-form-item>
            </el-col>

            <el-col :span="24" :md="12">
              <el-form-item label="Settlement" required>
                <el-select
                  v-model="selectedSettlement"
                  placeholder="Select Settlement"
                  filterable
                  clearable
                  :disabled="!selectedCounty || checkingGeometry"
                  :loading="checkingGeometry"
                  @change="handleSettlementChange"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in filteredSettlements"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
                <div v-if="checkingGeometry" style="font-size: 12px; color: #909399; margin-top: 5px;">
                  Checking settlements with boundary geometry...
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div v-if="currentStep === 1" class="step-content map-step">
        <div ref="mapContainer" class="map-container"></div>
        <div class="map-controls">
          <el-button type="warning" @click="resetDrawing" size="small">
            Reset Drawing
          </el-button>
        </div>
      </div>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      title="Sewer Line Details"
      :size="isMobile ? '100%' : '500px'"
      direction="rtl"
      :before-close="closeDrawer"
    >
      <el-form
        ref="formRef"
        :model="sewerForm"
        :rules="formRules"
        label-width="150px"
        label-position="left"
      >
        <el-divider content-position="left">Basic Information</el-divider>

        <el-form-item label="Name" prop="name">
          <el-input v-model="sewerForm.name" placeholder="Enter sewer line name" />
        </el-form-item>

        <el-form-item label="Pipe Type">
          <el-select v-model="sewerForm.pipe_type" placeholder="Select pipe type" filterable style="width: 100%">
            <el-option
              v-for="item in pipeOptionsLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Pipe Size">
          <el-input v-model="sewerForm.pipe_size" placeholder="Enter pipe size" />
        </el-form-item>

        <el-form-item label="Provider Category">
          <el-select v-model="sewerForm.provider_category" placeholder="Select provider" filterable style="width: 100%">
            <el-option
              v-for="item in generalOwnershipLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Service Provider">
          <el-input v-model="sewerForm.provider" placeholder="Enter service provider" />
        </el-form-item>

        <el-form-item label="Condition">
          <el-select v-model="sewerForm.condition" placeholder="Select condition" filterable style="width: 100%">
            <el-option
              v-for="item in conditionOptionsLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Number of Connections">
          <el-input-number v-model="sewerForm.number_of_connections" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="closeDrawer">Cancel</el-button>
          <el-button type="primary" @click="submitForm" :icon="Check">
            Save Sewer Line
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.add-sewer-container {
  padding: 20px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-content h2 {
  margin: 0;
  font-size: 24px;
}

.steps-indicator {
  margin: 20px 0;
}

.step-content {
  padding: 20px 0;
  min-height: 400px;
}

.map-step {
  position: relative;
}

.map-container {
  width: 100%;
  height: 600px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.map-controls {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .map-container {
    height: 400px;
  }

  .step-content {
    min-height: 300px;
  }
}
</style>

