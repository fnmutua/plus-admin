<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'

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
  ElDivider,
  ElAlert,
  ElDatePicker
} from 'element-plus'
import { ArrowLeft, Check, Plus, Delete } from '@element-plus/icons-vue'
import * as turf from '@turf/turf'
import { getOneGeo, getSettlementListByCounty } from '@/api/settlements'
import { CreateRecord, updateOneRecord } from '@/api/settlements'
import { countyOptions, settlementOptionsV2 } from './common/index'

// Ownership options from mapping_tool_rennaisance_questions.json (sponsor_type)
const generalOwnershipLocal = [
  { label: 'Government', value: 'government' },
  { label: 'CBO/NGO', value: 'ngo' },
  { label: 'Individual', value: 'individual' },
  { label: 'Community', value: 'community' }
]

// Condition options from mapping_tool_rennaisance_questions.json (condition_facility)
const conditionFacilityOptions = [
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Critical', value: 'Critical' }
]
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const isMobile = computed(() => appStore.getMobile)

const router = useRouter()

// Step management
const currentStep = ref(0)
const steps = [
  { title: 'County', description: '' },
  { title: 'Mark on Map', description: '' },
  { title: 'Submit', description: '' }
]

// Step 1: Location Selection - Only County and Settlement
const selectedCounty = ref<any>(null)
const selectedSettlement = ref<any>(null)
const filteredSettlements = ref<any[]>([])
const checkingGeometry = ref(false)
const settlementGeometryCache = ref<Map<number, boolean>>(new Map())

// Step 2: Map
const map = ref<any>(null)
const settlementPolygon = ref<any>(null)
const facilityMarker = ref<any>(null)
const existingFacilityMarkers = ref<Map<number, any>>(new Map())
const settlementGeo = ref<any>(null)
const facilityGeometry = ref<any>(null)
const mapContainer = ref<HTMLDivElement | null>(null)
const markerPlacementMode = ref(false)
const mapClickListener = ref<any>(null)
const existingFacilities = ref<any[]>([])
const loadingFacilities = ref(false)
const isEditMode = ref(false)
const editingFacilityId = ref<number | null>(null)

// Step 3: Form Drawer
const drawerVisible = ref(false)
const formRef = ref<FormInstance>()
const facilityForm = reactive({
  name: '',
  type: '',
  condition: '',
  frequency: '',
  type_waste: '',
  cost_per_use: null,
  number_stances: null,
  number_staff: null,
  number_phases: '',
  size_reserve: null,
  rating: '',
  number_vehicles: null,
  date_install: null,
  height: null,
  ownership_type: '',
  hazard: '',
  owner: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  geom: null
})

const formRules = reactive({
  name: [{ required: true, message: 'Facility name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }]
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

  checkingGeometry.value = true
  
  try {
    // Get all settlements for this county
    const countySettlements = (settlementOptionsV2.value || []).filter((item: any) => item.county_id === countyId)
    
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
        facilityForm.settlement_id = settlementId
        facilityForm.county_id = settlement.county_id || ''
        facilityForm.subcounty_id = settlement.subcounty_id || ''
        facilityForm.ward_id = settlement.ward_id || ''
      }

      // Move to step 2: Map
      currentStep.value = 1
      await nextTick()
      await initializeMap()
      // Load existing facilities for this settlement
      await loadExistingFacilities(settlementId)
    } else {
      ElMessage.error('Settlement has no boundary geometry')
    }
  } catch (error) {
    console.error('Error loading settlement geometry:', error)
    ElMessage.error('Failed to load settlement boundary')
  }
}

// Load existing facilities for the settlement
const loadExistingFacilities = async (settlementId: number) => {
  loadingFacilities.value = true
  existingFacilities.value = []
  
  // Clear existing markers
  existingFacilityMarkers.value.forEach((marker) => {
    marker.setMap(null)
  })
  existingFacilityMarkers.value.clear()

  try {
    const formData = {
      model: 'other_facility',
      filters: ['settlement_id'],
      filterValues: [[settlementId]],
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward']
    }

    const res = await getSettlementListByCounty(formData)
    
    if (res.data && res.data.length > 0) {
      existingFacilities.value = res.data
      
      // Add markers for existing facilities
      existingFacilities.value.forEach((facility: any) => {
        if (facility.geom && facility.geom.type === 'Point' && facility.geom.coordinates) {
          const position = {
            lat: facility.geom.coordinates[1],
            lng: facility.geom.coordinates[0]
          }

          const marker = new window.google.maps.Marker({
            position: position,
            map: map.value,
            draggable: false,
            title: facility.name || 'Facility',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(35, 35)
            },
            zIndex: 1
          })

          // Add click listener to edit facility
          marker.addListener('click', () => {
            editFacility(facility)
          })

          // Store marker with facility ID
          existingFacilityMarkers.value.set(facility.id, marker)
        }
      })

      if (existingFacilities.value.length > 0) {
        ElMessage.success(`Loaded ${existingFacilities.value.length} existing facility(ies)`)
      }
    }
  } catch (error) {
    console.error('Error loading existing facilities:', error)
    ElMessage.warning('Failed to load existing facilities')
  } finally {
    loadingFacilities.value = false
  }
}

// Edit existing facility
const editFacility = (facility: any) => {
  isEditMode.value = true
  editingFacilityId.value = facility.id

  // Populate form with facility data
  facilityForm.name = facility.name || ''
  facilityForm.type = facility.type || ''
  facilityForm.condition = facility.condition || ''
  facilityForm.frequency = facility.frequency || ''
  facilityForm.type_waste = facility.type_waste || ''
  facilityForm.cost_per_use = facility.cost_per_use || null
  facilityForm.number_stances = facility.number_stances || null
  facilityForm.number_staff = facility.number_staff || null
  facilityForm.number_phases = facility.number_phases || ''
  facilityForm.size_reserve = facility.size_reserve || null
  facilityForm.rating = facility.rating || ''
  facilityForm.number_vehicles = facility.number_vehicles || null
  facilityForm.date_install = facility.date_install || null
  facilityForm.height = facility.height || null
  facilityForm.ownership_type = facility.ownership_type || ''
  facilityForm.hazard = facility.hazard || ''
  facilityForm.owner = facility.owner || ''
  facilityForm.settlement_id = facility.settlement_id || ''
  facilityForm.county_id = facility.county_id || ''
  facilityForm.subcounty_id = facility.subcounty_id || ''
  facilityForm.ward_id = facility.ward_id || ''
  facilityForm.geom = facility.geom || null

  // Update marker to show it's being edited
  const marker = existingFacilityMarkers.value.get(facility.id)
  if (marker) {
    marker.setIcon({
      url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      scaledSize: new window.google.maps.Size(40, 40)
    })
    marker.setZIndex(1000)
  }

  // Center map on facility
  if (facility.geom && facility.geom.coordinates) {
    map.value.setCenter({
      lat: facility.geom.coordinates[1],
      lng: facility.geom.coordinates[0]
    })
    map.value.setZoom(16)
  }

  // Open drawer
  drawerVisible.value = true
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
      fullscreenControl: true,
      disableDoubleClickZoom: true
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
            map: map.value,
            clickable: false, // Allow clicks to pass through to map
            draggable: false
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

    // Function to place marker at clicked location
    const placeMarker = (event: any) => {
      if (!markerPlacementMode.value) return

      const position = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      }

      // Check if point is inside settlement polygon (if polygon exists)
      if (settlementPolygon.value && settlementGeo.value) {
        let isInside = false
        
        // Try using Google Maps geometry library first
        if (window.google?.maps?.geometry?.poly?.containsLocation) {
          isInside = window.google.maps.geometry.poly.containsLocation(
            event.latLng,
            settlementPolygon.value
          )
        } else {
          // Fallback to turf.js for point-in-polygon check
          const point = turf.point([position.lng, position.lat])
          const polygon = turf.polygon(
            settlementGeo.value.features[0].geometry.coordinates
          )
          isInside = turf.booleanPointInPolygon(point, polygon)
        }
        
        if (!isInside) {
          ElMessage.warning('Please place the marker inside the settlement boundary')
          return
        }
      }

      // Remove existing marker if any
      if (facilityMarker.value) {
        facilityMarker.value.setMap(null)
      }

      // Create new marker (different color for new vs existing)
      facilityMarker.value = new window.google.maps.Marker({
        position: position,
        map: map.value,
        draggable: true,
        title: 'New Facility Location - Click to edit',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        },
        zIndex: 1000
      })

      // Create Point geometry
      const geometry = {
        type: 'Point',
        coordinates: [position.lng, position.lat],
        crs: { type: 'name', properties: { name: 'EPSG:4326' } }
      }

      facilityGeometry.value = geometry
      facilityForm.geom = geometry

      // Add click listener to open form drawer
      facilityMarker.value.addListener('click', () => {
        // Ensure we're not in edit mode for existing facility
        if (!isEditMode.value) {
          // Ensure geometry is synced with marker position
          const position = facilityMarker.value.getPosition()
          if (position) {
            facilityForm.geom = {
              type: 'Point',
              coordinates: [position.lng(), position.lat()],
              crs: { type: 'name', properties: { name: 'EPSG:4326' } }
            }
            facilityGeometry.value = facilityForm.geom
          }
          drawerVisible.value = true
        }
      })

      // Listen for marker drag to update geometry
      facilityMarker.value.addListener('dragend', (dragEvent: any) => {
        const newPosition = {
          lat: dragEvent.latLng.lat(),
          lng: dragEvent.latLng.lng()
        }
        
        // Check if dragged position is still inside polygon
        if (settlementPolygon.value && settlementGeo.value) {
          let isInside = false
          
          // Try using Google Maps geometry library first
          if (window.google?.maps?.geometry?.poly?.containsLocation) {
            isInside = window.google.maps.geometry.poly.containsLocation(
              dragEvent.latLng,
              settlementPolygon.value
            )
          } else {
            // Fallback to turf.js for point-in-polygon check
            const point = turf.point([newPosition.lng, newPosition.lat])
            const polygon = turf.polygon(
              settlementGeo.value.features[0].geometry.coordinates
            )
            isInside = turf.booleanPointInPolygon(point, polygon)
          }
          
          if (!isInside) {
            ElMessage.warning('Marker must remain inside the settlement boundary')
            // Reset to previous position
            facilityMarker.value.setPosition({
              lat: facilityGeometry.value.coordinates[1],
              lng: facilityGeometry.value.coordinates[0]
            })
            return
          }
        }
        
        const newGeometry = {
          type: 'Point',
          coordinates: [newPosition.lng, newPosition.lat],
          crs: { type: 'name', properties: { name: 'EPSG:4326' } }
        }
        facilityGeometry.value = newGeometry
        facilityForm.geom = newGeometry
      })

      // Disable placement mode after placing marker
      markerPlacementMode.value = false

      // Open drawer with form
      drawerVisible.value = true
    }

    // Listen for map clicks to place marker (only when in placement mode)
    mapClickListener.value = map.value.addListener('click', placeMarker)
    map.value.addListener('dblclick', placeMarker)
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
      // Check if marker exists or geometry is set
      if (!facilityMarker.value && !facilityForm.geom) {
        ElMessage.error('Please mark the facility location on the map')
        return
      }
      
      // If marker exists but geometry is not set, get it from marker
      if (facilityMarker.value && !facilityForm.geom) {
        const position = facilityMarker.value.getPosition()
        facilityForm.geom = {
          type: 'Point',
          coordinates: [position.lng(), position.lat()],
          crs: { type: 'name', properties: { name: 'EPSG:4326' } }
        }
      }

      try {
        if (isEditMode.value && editingFacilityId.value) {
          // Update existing facility
          const formData = {
            ...facilityForm,
            id: editingFacilityId.value,
            model: 'other_facility'
          }

          const res = await updateOneRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Other facility updated successfully')
            // Reload facilities to reflect changes
            await loadExistingFacilities(facilityForm.settlement_id)
            // Reset form
            resetForm()
            drawerVisible.value = false
          } else {
            ElMessage.error('Failed to update other facility')
          }
        } else {
          // Create new facility
          const formData = {
            ...facilityForm,
            model: 'other_facility',
            code: uuid.v4(),
            isApproved: 'Pending',
            createdBy: userInfo.id
          }

          const res = await CreateRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Other facility created successfully')
            // Reload facilities to show the new one
            await loadExistingFacilities(facilityForm.settlement_id)
            // Reset form
            resetForm()
            drawerVisible.value = false
          } else {
            ElMessage.error('Failed to create other facility')
          }
        }
      } catch (error) {
        console.error('Error saving other facility:', error)
        ElMessage.error('Failed to save other facility')
      }
    }
  })
}

// Reset form to create mode
const resetForm = () => {
  isEditMode.value = false
  editingFacilityId.value = null
  
  // Remove new marker if exists
  if (facilityMarker.value) {
    facilityMarker.value.setMap(null)
    facilityMarker.value = null
  }
  
  // Reset form fields
  facilityForm.name = ''
  facilityForm.type = ''
  facilityForm.condition = ''
  facilityForm.frequency = ''
  facilityForm.type_waste = ''
  facilityForm.cost_per_use = null
  facilityForm.number_stances = null
  facilityForm.number_staff = null
  facilityForm.number_phases = ''
  facilityForm.size_reserve = null
  facilityForm.rating = ''
  facilityForm.number_vehicles = null
  facilityForm.date_install = null
  facilityForm.height = null
  facilityForm.ownership_type = ''
  facilityForm.hazard = ''
  facilityForm.owner = ''
  facilityForm.geom = null
  
  // Reset existing markers to blue
  existingFacilityMarkers.value.forEach((marker) => {
    marker.setIcon({
      url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      scaledSize: new window.google.maps.Size(35, 35)
    })
    marker.setZIndex(1)
  })
  
  markerPlacementMode.value = false
}

// Go back to previous step
const goBack = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    if (currentStep.value === 0) {
      // Clean up map
      if (mapClickListener.value) {
        window.google.maps.event.removeListener(mapClickListener.value)
        mapClickListener.value = null
      }
      if (facilityMarker.value) {
        facilityMarker.value.setMap(null)
        facilityMarker.value = null
      }
      if (settlementPolygon.value) {
        settlementPolygon.value.setMap(null)
        settlementPolygon.value = null
      }
      map.value = null
      settlementGeo.value = null
      facilityGeometry.value = null
      facilityForm.geom = null
      markerPlacementMode.value = false
      // Clear existing facilities
      existingFacilityMarkers.value.forEach((marker) => {
        marker.setMap(null)
      })
      existingFacilityMarkers.value.clear()
      existingFacilities.value = []
      isEditMode.value = false
      editingFacilityId.value = null
    }
  } else {
    router.back()
  }
}

// Close drawer and reset if not in edit mode
const closeDrawer = () => {
  drawerVisible.value = false
  // If not in edit mode, reset the new marker
  if (!isEditMode.value && facilityMarker.value) {
    facilityMarker.value.setMap(null)
    facilityMarker.value = null
    facilityGeometry.value = null
    facilityForm.geom = null
  }
  // If in edit mode, just close - don't reset
}

// Enable marker placement mode
const enableMarkerPlacement = () => {
  markerPlacementMode.value = true
  ElMessage.info('Click on the map to place the marker inside the settlement boundary')
}

// Delete marker (only for new marker, not existing facilities)
const deleteMarker = () => {
  if (facilityMarker.value) {
    facilityMarker.value.setMap(null)
    facilityMarker.value = null
  }
  facilityGeometry.value = null
  facilityForm.geom = null
  drawerVisible.value = false
  markerPlacementMode.value = false
  
  // If in edit mode, reset to create mode
  if (isEditMode.value) {
    resetForm()
  }
  
  ElMessage.success('Marker removed')
}

// Reset marker (alias for deleteMarker for consistency)
const resetMarker = () => {
  deleteMarker()
}
</script>

<template>
  <div class="add-other-container">
    <el-card>
      <!-- Header -->
      <template #header>
        <div class="header-content">
          <div class="header-top">
            <el-button :icon="ArrowLeft" @click="goBack" text>Back</el-button>
            <h2>Add New Other Facility</h2>
          </div>
          <el-steps :active="currentStep" finish-status="success" align-center class="header-steps">
            <el-step
              v-for="(step, index) in steps"
              :key="index"
              :title="step.title"
              :description="step.description"
            />
          </el-steps>
        </div>
      </template>

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
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in countyOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
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

      <!-- Step 2: Map with Click to Place Marker -->
      <div v-if="currentStep === 1" class="step-content map-step">
        <div ref="mapContainer" class="map-container"></div>
        <div class="map-controls">
          <el-button 
            type="primary" 
            @click="enableMarkerPlacement" 
            size="small" 
            :disabled="markerPlacementMode">
            <el-icon style="margin-right: 5px;"><Plus /></el-icon>
            Add Marker
          </el-button>
          <el-button 
            type="danger" 
            @click="deleteMarker" 
            size="small" 
            :disabled="!facilityMarker">
            <el-icon style="margin-right: 5px;"><Delete /></el-icon>
            Delete Marker
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Step 3: Form Drawer (opens after placing marker or clicking existing facility) -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEditMode ? 'Edit Other Facility' : 'New Other Facility Details'"
      :size="isMobile ? '100%' : '600px'"
      direction="rtl"
      :before-close="closeDrawer"
    >
      <el-form
        ref="formRef"
        :model="facilityForm"
        :rules="formRules"
        label-width="180px"
        label-position="left"
      >
        <el-divider content-position="left">Basic Information</el-divider>

        <el-form-item label="Facility Name" prop="name">
          <el-input v-model="facilityForm.name" placeholder="Enter facility name" />
        </el-form-item>

        <el-form-item label="Facility Type">
          <el-input v-model="facilityForm.type" placeholder="Enter facility type" />
        </el-form-item>

        <el-form-item label="Condition">
          <el-select v-model="facilityForm.condition" placeholder="Select condition" filterable style="width: 100%">
            <el-option
              v-for="item in conditionFacilityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Frequency">
          <el-input v-model="facilityForm.frequency" placeholder="Enter frequency" />
        </el-form-item>

        <el-form-item label="Type of Waste">
          <el-input v-model="facilityForm.type_waste" placeholder="Enter type of waste" />
        </el-form-item>

        <el-form-item label="Cost per Use">
          <el-input-number v-model="facilityForm.cost_per_use" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Number of Stances">
          <el-input-number v-model="facilityForm.number_stances" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Number of Staff">
          <el-input-number v-model="facilityForm.number_staff" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Number of Phases">
          <el-input v-model="facilityForm.number_phases" placeholder="Enter number of phases" />
        </el-form-item>

        <el-form-item label="Size Reserve">
          <el-input-number v-model="facilityForm.size_reserve" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Rating">
          <el-input v-model="facilityForm.rating" placeholder="Enter rating" />
        </el-form-item>

        <el-form-item label="Number of Vehicles">
          <el-input-number v-model="facilityForm.number_vehicles" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Date Installed">
          <el-date-picker
            v-model="facilityForm.date_install"
            type="date"
            placeholder="Select date"
            style="width: 100%"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="Height">
          <el-input-number v-model="facilityForm.height" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Ownership Type">
          <el-select v-model="facilityForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
            <el-option
              v-for="item in generalOwnershipLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Hazard">
          <el-input v-model="facilityForm.hazard" placeholder="Enter hazard information" />
        </el-form-item>

        <el-form-item label="Owner/Operator">
          <el-input v-model="facilityForm.owner" placeholder="Enter owner/operator" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="closeDrawer">Cancel</el-button>
          <el-button 
            v-if="isEditMode" 
            type="warning" 
            @click="resetForm" 
            style="margin-right: 10px;">
            Cancel Edit
          </el-button>
          <el-button type="primary" @click="submitForm" :icon="Check">
            {{ isEditMode ? 'Update Other Facility' : 'Save Other Facility' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.add-other-container {
  padding: 20px;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.header-top {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-content h2 {
  margin: 0;
  font-size: 24px;
}

.header-steps {
  width: 100%;
}

.step-content {
  padding: 20px 0;
  min-height: 400px;
}

.map-step {
  position: relative;
}

.map-instructions {
  margin-bottom: 10px;
}

.map-container {
  width: 100%;
  height: 520px;
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
    height: 340px;
  }

  .step-content {
    min-height: 300px;
  }
}
</style>
