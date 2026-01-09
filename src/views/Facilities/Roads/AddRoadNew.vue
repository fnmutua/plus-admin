<script setup lang="ts">
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
import { getOneGeo } from '@/api/settlements'
import { CreateRecord } from '@/api/settlements'
import { countyOptions, settlementOptionsV2 } from './common/index'
import { useAppStoreWithOut } from '@/store/modules/app'

// Surface type options from mapping_tool_rennaisance_questions.json (CWSurf_Type_list)
const SurfaceTypeOtionsLocal = [
  { label: 'Asphalt', value: 'asphalt' },
  { label: 'Surface Dressing', value: 'surface_dressing' },
  { label: 'Gravel', value: 'gravel' },
  { label: 'Earth', value: 'earth' },
  { label: 'Jointed Concrete', value: 'concrete_jt' },
  { label: 'Concrete Blocks', value: 'concrete_bl' },
  { label: 'Reinforced Concrete', value: 'concrete_rein' },
  { label: 'Brick', value: 'brick' },
  { label: 'Cobble stone road', value: 'set_stone' },
  { label: 'Unimproved road with tyre tracks visible', value: 'track' },
  { label: 'Other(Rater to provide description and Photo)', value: 'other' }
]

// Condition options from mapping_tool_rennaisance_questions.json (condition_list)
const conditionOptionsLocal = [
  { label: 'Under construction ', value: 'Under construction ' },
  { label: 'Broken/not in use', value: 'Broken/not in use' },
  { label: 'Operational ', value: 'Operational ' },
  { label: 'Decomissioned', value: 'Decomissioned' }
]

// Drainage location options from mapping_tool_rennaisance_questions.json (draingae_side_list)
const drainageTypeOtionsLocal = [
  { label: 'One Side', value: 'One Side' },
  { label: 'Both Sides', value: 'Both Sides' }
]

// Traffic options from mapping_tool_rennaisance_questions.json (usage_list)
const trafficOptions = [
  { label: 'Busy', value: 'busy' },
  { label: 'Used', value: 'used' },
  { label: 'Rare', value: 'rare' }
]

// Direction options from mapping_tool_rennaisance_questions.json (direction_list)
const directionOptions = [
  { label: 'One Way', value: 'One Way' },
  { label: 'Two Way', value: 'Two Way' }
]
import { useCache } from '@/hooks/web/useCache'
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

const hasNationalAccess = computed(() => {
  return userInfo?.roles?.some((role: any) => 
    role.user_roles?.location_level === 'national'
  ) || false
})

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

// Handle query parameters on mount
onMounted(async () => {
  // Check route query params first (from Roads.vue AddFacility function)
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
  { title: 'Draw Road', description: 'Draw the road on the map' },
  { title: 'Complete Details', description: 'Fill in road information' }
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
const roadPolyline = ref<any>(null)
const settlementGeo = ref<any>(null)
const roadGeometry = ref<any>(null)
const mapContainer = ref<HTMLDivElement | null>(null)

// Step 3: Form Drawer
const drawerVisible = ref(false)
const formRef = ref<FormInstance>()
const roadForm = reactive({
  name: '',
  rdNum: '',
  rdClass: '',
  rdReserve: 0,
  surfaceType: '',
  surfaceCondition: '',
  traffic: '',
  direction: '',
  drainage: '',
  drainageCondition: '',
  width: 0,
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  geom: null
})

const formRules = reactive({
  name: [{ required: true, message: 'Road name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }],
  width: [{ required: true, message: 'Road width is required', trigger: 'blur' }],
  surfaceType: [{ required: true, message: 'Surface type is required', trigger: 'change' }]
})

// Check if settlement has valid geometry (Polygon/MultiPolygon, not Point)
const checkSettlementGeometry = async (settlementId: number): Promise<boolean> => {
  // Check cache first
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

      // Only allow Polygon or MultiPolygon, exclude Point and MultiPoint
      const hasValidGeometry = geometryType === 'Polygon' || geometryType === 'MultiPolygon'
      
      // Cache the result
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
    // Get all settlements for this county
    let countySettlements = (settlementOptionsV2.value || []).filter((item: any) => item.county_id === countyId)
    
    // If user is restricted to a specific settlement, filter to that settlement only
    if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
      countySettlements = countySettlements.filter((item: any) => item.value === userSettlementId.value)
    }
    
    // Check geometry for each settlement in parallel
    const geometryChecks = await Promise.all(
      countySettlements.map(async (settlement: any) => {
        const hasValidGeometry = await checkSettlementGeometry(settlement.value)
        return { settlement, hasValidGeometry }
      })
    )
    
    // Filter to only settlements with valid geometry
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

  // Get settlement geometry
  try {
    const formData = {
      model: 'settlement',
      id: settlementId
    }
    const res = await getOneGeo(formData)

    if (res.data[0]?.json_build_object?.features) {
      const feature = res.data[0].json_build_object.features[0]
      const geometryType = feature.geometry?.type

      // Verify it's not a Point
      if (geometryType === 'Point' || geometryType === 'MultiPoint') {
        ElMessage.error('This settlement has point geometry. Please select a settlement with boundary geometry (Polygon).')
        return
      }

      settlementGeo.value = res.data[0].json_build_object
      
      // Update form with selected values
      const settlement = (settlementOptionsV2.value || []).find((s: any) => s.value === settlementId)
      if (settlement) {
        roadForm.settlement_id = settlementId
        roadForm.county_id = settlement.county_id || ''
        roadForm.subcounty_id = settlement.subcounty_id || ''
        roadForm.ward_id = settlement.ward_id || ''
      }

      // Move to step 2: Map
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

  // Wait for DOM to be ready
  await nextTick()

  try {
    // Load Google Maps API
    const { Loader } = await import('@googlemaps/js-api-loader')
    const googleMapsApiKey = 'AIzaSyCrzbOkfG52zkAxYPkMvvRMlxE9qHK4uDk'
    
    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly',
      libraries: ['drawing', 'geometry', 'places'],
      region: 'KE',
      language: 'en'
    })

    await loader.load()

    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded properly')
    }

    // Get settlement bounds or default center
    let center = { lat: 1.137451, lng: 37.137343 }
    let zoom = 8

    if (settlementGeo.value) {
      const bounds = turf.bbox(settlementGeo.value)
      const sw = { lat: bounds[1], lng: bounds[0] }
      const ne = { lat: bounds[3], lng: bounds[2] }
      center = {
        lat: (bounds[1] + bounds[3]) / 2,
        lng: (bounds[0] + bounds[2]) / 2
      }
      zoom = 13
    }

    // Initialize map
    map.value = new window.google.maps.Map(mapContainer.value, {
      center: center,
      zoom: zoom,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    })

    // Add settlement boundary
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

          // Fit map to settlement bounds
          const bounds = new window.google.maps.LatLngBounds()
          paths.forEach((path: any) => {
            bounds.extend(path)
          })
          map.value.fitBounds(bounds)
        }
      }
    }

    // Initialize drawing manager for polylines (roads)
    drawingManager.value = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYLINE,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_LEFT,
        drawingModes: [window.google.maps.drawing.OverlayType.POLYLINE]
      },
      polylineOptions: {
        strokeColor: '#ff0000',
        strokeWeight: 4,
        strokeOpacity: 1.0
      }
    })

    drawingManager.value.setMap(map.value)

    // Listen for polyline completion
    window.google.maps.event.addListener(
      drawingManager.value,
      'overlaycomplete',
      (event: any) => {
        if (event.type === window.google.maps.drawing.OverlayType.POLYLINE) {
          const polyline = event.overlay
          roadPolyline.value = polyline

          // Convert Google Maps Polyline to GeoJSON LineString
          const path = polyline.getPath()
          const coordinates: number[][] = []
          
          path.forEach((latLng: any) => {
            coordinates.push([latLng.lng(), latLng.lat()])
          })

          const geometry = {
            type: 'LineString',
            coordinates: coordinates,
            crs: { type: 'name', properties: { name: 'EPSG:4326' } }
          }

          roadGeometry.value = geometry
          roadForm.geom = geometry

          // Calculate length
          const length = turf.length(geometry, { units: 'meters' })
          console.log('Road length:', length, 'meters')

          // Disable drawing mode
          drawingManager.value?.setDrawingMode(null)

          // Open drawer with form
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
      if (!roadForm.geom) {
        ElMessage.error('Please draw the road on the map')
        return
      }

      try {
        // Enforce county restriction for non-admin users
        if (isCountyRestricted.value && userCountyId.value) {
          if (roadForm.county_id && roadForm.county_id !== userCountyId.value) {
            ElMessage.error('You can only create facilities in your assigned county')
            return
          }
          // Force county_id to user's county
          roadForm.county_id = userCountyId.value
        }
        
        // Enforce settlement restriction for settlement-level users
        if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
          if (roadForm.settlement_id && roadForm.settlement_id !== userSettlementId.value) {
            ElMessage.error('You can only create facilities in your assigned settlement')
            return
          }
          // Force settlement_id to user's settlement
          roadForm.settlement_id = userSettlementId.value
          // Also ensure county matches
          if (userCountyId.value) {
            roadForm.county_id = userCountyId.value
          }
        }
        
        const formData = {
          ...roadForm,
          model: 'road',
          code: shortid.generate(),
          length: turf.length(roadForm.geom, { units: 'meters' }),
          isApproved: 'Pending',
          createdBy: userInfo.id
        }

        const res = await CreateRecord(formData)
        
        if (res.code === '0000') {
          ElMessage.success('Road created successfully')
          router.push({ name: 'Road' })
        } else {
          ElMessage.error('Failed to create road')
        }
      } catch (error) {
        console.error('Error creating road:', error)
        ElMessage.error('Failed to create road')
      }
    }
  })
}

// Go back to previous step
const goBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    if (currentStep.value === 0) {
      // Clean up map
      if (roadPolyline.value) {
        roadPolyline.value.setMap(null)
        roadPolyline.value = null
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
      roadGeometry.value = null
    }
  } else {
    router.back()
  }
}

// Close drawer and allow editing
const closeDrawer = () => {
  drawerVisible.value = false
}

// Reset drawing
const resetDrawing = () => {
  if (roadPolyline.value) {
    roadPolyline.value.setMap(null)
    roadPolyline.value = null
  }
  roadGeometry.value = null
  roadForm.geom = null
  if (drawingManager.value && window.google) {
    drawingManager.value.setDrawingMode(window.google.maps.drawing.OverlayType.POLYLINE)
  }
}
</script>

<template>
  <div class="add-road-container">
    <el-card>
      <!-- Header -->
      <template #header>
        <div class="header-content">
          <el-button :icon="ArrowLeft" @click="goBack" text>Back</el-button>
          <h2>Add New Road</h2>
        </div>
      </template>

      <!-- Steps Indicator -->
      <el-steps :active="currentStep" finish-status="success" align-center class="steps-indicator">
        <el-step
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
          :description="step.description"
        />
      </el-steps>

      <el-divider />

      <!-- Step 1: Location Selection - Only County and Settlement -->
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

      <!-- Step 2: Map with Drawing Tools -->
      <div v-if="currentStep === 1" class="step-content map-step">
        <div ref="mapContainer" class="map-container"></div>
        <div class="map-controls">
          <el-button type="warning" @click="resetDrawing" size="small">
            Reset Drawing
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Step 3: Form Drawer (opens after drawing) -->
    <el-drawer
      v-model="drawerVisible"
      title="Road Details"
      :size="isMobile ? '100%' : '500px'"
      direction="rtl"
      :before-close="closeDrawer"
    >
      <el-form
        ref="formRef"
        :model="roadForm"
        :rules="formRules"
        label-width="150px"
        label-position="left"
      >
        <el-divider content-position="left">Basic Information</el-divider>

        <el-form-item label="Road Name" prop="name">
          <el-input v-model="roadForm.name" placeholder="Enter road name" />
        </el-form-item>

        <el-form-item label="Road Number">
          <el-input v-model="roadForm.rdNum" placeholder="Enter road number" />
        </el-form-item>

        <el-form-item label="Road Class">
          <el-select v-model="roadForm.rdClass" placeholder="Select class" filterable style="width: 100%">
            <el-option
              v-for="item in RdClassOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Road Width (m)" prop="width">
          <el-input-number v-model="roadForm.width" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Road Reserve (m)">
          <el-input-number v-model="roadForm.rdReserve" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-divider content-position="left">Surface & Condition</el-divider>

        <el-form-item label="Surface Type" prop="surfaceType">
          <el-select v-model="roadForm.surfaceType" placeholder="Select surface type" filterable style="width: 100%">
            <el-option
              v-for="item in SurfaceTypeOtionsLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Surface Condition">
          <el-select v-model="roadForm.surfaceCondition" placeholder="Select condition" filterable style="width: 100%">
            <el-option
              v-for="item in conditionOptionsLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">Drainage</el-divider>

        <el-form-item label="Drainage Location">
          <el-select v-model="roadForm.drainage" placeholder="Select drainage location" filterable style="width: 100%">
            <el-option
              v-for="item in drainageTypeOtionsLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Drainage Condition">
          <el-select v-model="roadForm.drainageCondition" placeholder="Select condition" filterable style="width: 100%">
            <el-option
              v-for="item in conditionOptionsLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">Traffic</el-divider>

        <el-form-item label="Traffic">
          <el-select v-model="roadForm.traffic" placeholder="Select traffic level" filterable style="width: 100%">
            <el-option
              v-for="item in trafficOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Direction">
          <el-select v-model="roadForm.direction" placeholder="Select direction" filterable style="width: 100%">
            <el-option
              v-for="item in directionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="closeDrawer">Cancel</el-button>
          <el-button type="primary" @click="submitForm" :icon="Check">
            Save Road
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.add-road-container {
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
