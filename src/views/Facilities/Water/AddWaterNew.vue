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
  ElDivider,
  ElAlert
} from 'element-plus'
import { ArrowLeft, Check, Plus, Delete } from '@element-plus/icons-vue'
import * as turf from '@turf/turf'
import { getOneGeo, getSettlementListByCounty } from '@/api/settlements'
import { CreateRecord, updateOneRecord } from '@/api/settlements'
import { countyOptions, settlementOptionsV2 } from '../common/index'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import type { FormInstance } from 'element-plus'
import { uuid } from 'vue-uuid'

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

// Options from mapping_tool_rennaisance_questions.json
// WP_Type (wp_type)
const waterPointTypeOptions = [
  { value: 'kiosk', label: 'Water Kiosk' },
  { value: 'public_tap', label: 'Public Tap' },
  { value: 'borehole', label: 'Borehole' },
  { value: 'spring', label: 'Spring' },
  { value: 'well', label: 'Dug Well' }
]

// Condition options from mapping_tool_rennaisance_questions.json (condition_list)
const conditionOptions = [
  { value: 'Under construction ', label: 'Under construction ' },
  { value: 'Broken/not in use', label: 'Broken/not in use' },
  { value: 'Operational ', label: 'Operational ' },
  { value: 'Decomissioned', label: 'Decomissioned' }
]

// Availability options from mapping_tool_rennaisance_questions.json (frequency_list2)
const availabilityOptions = [
  { value: 'Daily', label: 'Daily' },
  { value: 'Twice_a_week', label: 'Twice a week' },
  { value: 'Once_a_week', label: 'Once a week' },
  { value: 'Rarely', label: 'Rarely' }
]

// Ownership options from mapping_tool_rennaisance_questions.json (sponsor_type)
const ownershipOptions = [
  { value: 'government', label: 'Government' },
  { value: 'ngo', label: 'CBO/NGO' },
  { value: 'individual', label: 'Individual' },
  { value: 'community', label: 'Community' }
]

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
const waterMarker = ref<any>(null)
const existingWaterMarkers = ref<Map<number, any>>(new Map())
const settlementGeo = ref<any>(null)
const waterGeometry = ref<any>(null)
const mapContainer = ref<HTMLDivElement | null>(null)
const markerPlacementMode = ref(false)
const mapClickListener = ref<any>(null)
const existingWaterPoints = ref<any[]>([])
const loadingWaterPoints = ref(false)
const isEditMode = ref(false)
const editingWaterPointId = ref<number | null>(null)

// Step 3: Form Drawer
const drawerVisible = ref(false)
const formRef = ref<FormInstance>()
const waterForm = reactive({
  name: '',
  type: '',
  capacity: '',
  depth: null,
  ownership_type: '',
  owner: '',
  catchment: '',
  price: null,
  condition: '',
  availability: '',
  name_of_provider: '',
  cost_of_20_litre_jerrican: null,
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  geom: null
})

const formRules = reactive({
  name: [{ required: true, message: 'Water point name is required', trigger: 'blur' }],
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
        waterForm.settlement_id = settlementId
        waterForm.county_id = settlement.county_id || ''
        waterForm.subcounty_id = settlement.subcounty_id || ''
        waterForm.ward_id = settlement.ward_id || ''
      }

      // Move to step 2: Map
      currentStep.value = 1
      await nextTick()
      await initializeMap()
      // Load existing schools for this settlement
      await loadExistingWaterPoints(settlementId)
    } else {
      ElMessage.error('Settlement has no boundary geometry')
    }
  } catch (error) {
    console.error('Error loading settlement geometry:', error)
    ElMessage.error('Failed to load settlement boundary')
  }
}

// Load existing schools for the settlement
const loadExistingWaterPoints = async (settlementId: number) => {
  loadingWaterPoints.value = true
  existingWaterPoints.value = []
  
  // Clear existing markers
  existingWaterMarkers.value.forEach((marker) => {
    marker.setMap(null)
  })
  existingWaterMarkers.value.clear()

  try {
    const formData = {
      model: 'water_point',
      filters: ['settlement_id'],
      filterValues: [[settlementId]],
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward']
    }

    const res = await getSettlementListByCounty(formData)
    
    if (res.data && res.data.length > 0) {
      existingWaterPoints.value = res.data
      
      // Add markers for existing water points
      existingWaterPoints.value.forEach((waterPoint: any) => {
        if (waterPoint.geom && waterPoint.geom.type === 'Point' && waterPoint.geom.coordinates) {
          const position = {
            lat: waterPoint.geom.coordinates[1],
            lng: waterPoint.geom.coordinates[0]
          }

          const marker = new window.google.maps.Marker({
            position: position,
            map: map.value,
            draggable: false,
            title: waterPoint.name || 'Water Point',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(35, 35)
            },
            zIndex: 1
          })

          // Add click listener to edit water point
          marker.addListener('click', () => {
            editWaterPoint(waterPoint)
          })

          // Store marker with water point ID
          existingWaterMarkers.value.set(waterPoint.id, marker)
        }
      })

      if (existingWaterPoints.value.length > 0) {
        ElMessage.success(`Loaded ${existingWaterPoints.value.length} existing water point(s)`)
      }
    }
  } catch (error) {
    console.error('Error loading existing water points:', error)
    ElMessage.warning('Failed to load existing water points')
  } finally {
    loadingWaterPoints.value = false
  }
}

// Edit existing water point
const editWaterPoint = (waterPoint: any) => {
  isEditMode.value = true
  editingWaterPointId.value = waterPoint.id

  // Populate form with water point data
  waterForm.name = waterPoint.name || ''
  waterForm.type = waterPoint.type || ''
  waterForm.capacity = waterPoint.capacity || ''
  waterForm.depth = waterPoint.depth || null
  waterForm.ownership_type = waterPoint.ownership_type || ''
  waterForm.owner = waterPoint.owner || ''
  waterForm.catchment = waterPoint.catchment || ''
  waterForm.price = waterPoint.price || null
  waterForm.condition = waterPoint.condition || ''
  waterForm.availability = waterPoint.availability || ''
  waterForm.name_of_provider = waterPoint.name_of_provider || ''
  waterForm.cost_of_20_litre_jerrican = waterPoint.cost_of_20_litre_jerrican || null
  waterForm.settlement_id = waterPoint.settlement_id || ''
  waterForm.county_id = waterPoint.county_id || ''
  waterForm.subcounty_id = waterPoint.subcounty_id || ''
  waterForm.ward_id = waterPoint.ward_id || ''
  waterForm.geom = waterPoint.geom || null

  // Update marker to show it's being edited
  const marker = existingWaterMarkers.value.get(waterPoint.id)
  if (marker) {
    marker.setIcon({
      url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      scaledSize: new window.google.maps.Size(40, 40)
    })
    marker.setZIndex(1000)
  }

  // Center map on water point
  if (waterPoint.geom && waterPoint.geom.coordinates) {
    map.value.setCenter({
      lat: waterPoint.geom.coordinates[1],
      lng: waterPoint.geom.coordinates[0]
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
      if (waterMarker.value) {
        waterMarker.value.setMap(null)
      }

      // Create new marker (different color for new vs existing)
      waterMarker.value = new window.google.maps.Marker({
        position: position,
        map: map.value,
        draggable: true,
        title: 'New Water Point Location - Click to edit',
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

      waterGeometry.value = geometry
      waterForm.geom = geometry

      // Add click listener to open form drawer
      waterMarker.value.addListener('click', () => {
        // Ensure we're not in edit mode for existing water point
        if (!isEditMode.value) {
          // Ensure geometry is synced with marker position
          const position = waterMarker.value.getPosition()
          if (position) {
            waterForm.geom = {
              type: 'Point',
              coordinates: [position.lng(), position.lat()],
              crs: { type: 'name', properties: { name: 'EPSG:4326' } }
            }
            waterGeometry.value = waterForm.geom
          }
          drawerVisible.value = true
        }
      })

      // Listen for marker drag to update geometry
      waterMarker.value.addListener('dragend', (dragEvent: any) => {
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
            waterMarker.value.setPosition({
              lat: waterGeometry.value.coordinates[1],
              lng: waterGeometry.value.coordinates[0]
            })
            return
          }
        }
        
        const newGeometry = {
          type: 'Point',
          coordinates: [newPosition.lng, newPosition.lat],
          crs: { type: 'name', properties: { name: 'EPSG:4326' } }
        }
        waterGeometry.value = newGeometry
        waterForm.geom = newGeometry
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
      if (!waterMarker.value && !waterForm.geom) {
        ElMessage.error('Please mark the water point location on the map')
        return
      }
      
      // If marker exists but geometry is not set, get it from marker
      if (waterMarker.value && !waterForm.geom) {
        const position = waterMarker.value.getPosition()
        waterForm.geom = {
          type: 'Point',
          coordinates: [position.lng(), position.lat()],
          crs: { type: 'name', properties: { name: 'EPSG:4326' } }
        }
      }

      try {
        // Enforce county restriction for non-admin users
        if (isCountyRestricted.value && userCountyId.value) {
          if (waterForm.county_id && waterForm.county_id !== userCountyId.value) {
            ElMessage.error('You can only create facilities in your assigned county')
            return
          }
          // Force county_id to user's county
          waterForm.county_id = userCountyId.value
        }
        
        // Enforce settlement restriction for settlement-level users
        if (userSettlementId.value && !isSuperAdmin.value && !hasNationalAccess.value) {
          if (waterForm.settlement_id && waterForm.settlement_id !== userSettlementId.value) {
            ElMessage.error('You can only create facilities in your assigned settlement')
            return
          }
          // Force settlement_id to user's settlement
          waterForm.settlement_id = userSettlementId.value
          // Also ensure county matches
          if (userCountyId.value) {
            waterForm.county_id = userCountyId.value
          }
        }
        
        const formDataToSubmit = {
          ...waterForm
        }

        if (isEditMode.value && editingWaterPointId.value) {
          // Update existing school
          const formData = {
            ...formDataToSubmit,
            id: editingWaterPointId.value,
            model: 'water_point'
          }

          const res = await updateOneRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Water point updated successfully')
            // Reload water points to reflect changes
            await loadExistingWaterPoints(waterForm.settlement_id)
            // Reset form
            resetForm()
            drawerVisible.value = false
          } else {
            ElMessage.error('Failed to update water point')
          }
        } else {
          // Create new water point
          const formData = {
            ...formDataToSubmit,
            model: 'water_point',
            code: uuid.v4(),
            isApproved: 'Pending',
            created_by: userInfo.id
          }

          const res = await CreateRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Water point created successfully')
            // Reload water points to show the new one
            await loadExistingWaterPoints(waterForm.settlement_id)
            // Reset form
            resetForm()
            drawerVisible.value = false
          } else {
            ElMessage.error('Failed to create water point')
          }
        }
      } catch (error) {
        console.error('Error saving water point:', error)
        ElMessage.error('Failed to save water point')
      }
    }
  })
}

// Initialize user county on mount
onMounted(async () => {
  // Check route query params first (from Water.vue AddFacility function)
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

// Reset form to create mode
const resetForm = () => {
  isEditMode.value = false
  editingWaterPointId.value = null
  
  // Remove new marker if exists
  if (waterMarker.value) {
    waterMarker.value.setMap(null)
    waterMarker.value = null
  }
  
  // Reset form fields
  waterForm.name = ''
  waterForm.type = ''
  waterForm.capacity = ''
  waterForm.depth = null
  waterForm.ownership_type = ''
  waterForm.owner = ''
  waterForm.catchment = ''
  waterForm.price = null
  waterForm.condition = ''
  waterForm.availability = ''
  waterForm.name_of_provider = ''
  waterForm.cost_of_20_litre_jerrican = null
  waterForm.geom = null
  
  // Reset existing markers to blue
  existingWaterMarkers.value.forEach((marker) => {
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
      if (waterMarker.value) {
        waterMarker.value.setMap(null)
        waterMarker.value = null
      }
      if (settlementPolygon.value) {
        settlementPolygon.value.setMap(null)
        settlementPolygon.value = null
      }
      map.value = null
      settlementGeo.value = null
      waterGeometry.value = null
      waterForm.geom = null
      markerPlacementMode.value = false
      // Clear existing water points
      existingWaterMarkers.value.forEach((marker) => {
        marker.setMap(null)
      })
      existingWaterMarkers.value.clear()
      existingWaterPoints.value = []
      isEditMode.value = false
      editingWaterPointId.value = null
    }
  } else {
    router.back()
  }
}

// Close drawer and reset if not in edit mode
const closeDrawer = () => {
  drawerVisible.value = false
  // If not in edit mode, reset the new marker
  if (!isEditMode.value && waterMarker.value) {
    waterMarker.value.setMap(null)
    waterMarker.value = null
    waterGeometry.value = null
    waterForm.geom = null
  }
  // If in edit mode, just close - don't reset
}

// Enable marker placement mode
const enableMarkerPlacement = () => {
  markerPlacementMode.value = true
  ElMessage.info('Click on the map to place the marker inside the settlement boundary')
}

// Delete marker (only for new marker, not existing schools)
const deleteMarker = () => {
  if (waterMarker.value) {
    waterMarker.value.setMap(null)
    waterMarker.value = null
  }
  waterGeometry.value = null
  waterForm.geom = null
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
  <div class="add-water-container">
    <el-card>
      <!-- Header -->
      <template #header>
        <div class="header-content">
          <div class="header-top">
            <el-button :icon="ArrowLeft" @click="goBack" text>Back</el-button>
            <h2>Add New Water Point</h2>
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
            :disabled="!waterMarker">
            <el-icon style="margin-right: 5px;"><Delete /></el-icon>
            Delete Marker
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Step 3: Form Drawer (opens after placing marker or clicking existing school) -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEditMode ? 'Edit Water Point' : 'New Water Point Details'"
      :size="isMobile ? '100%' : '600px'"
      direction="rtl"
      :before-close="closeDrawer"
    >
      <el-form
        ref="formRef"
        :model="waterForm"
        :rules="formRules"
        label-width="180px"
        label-position="left"
      >
        <el-divider content-position="left">Basic Information</el-divider>

        <el-form-item label="Water Point Name" prop="name">
          <el-input v-model="waterForm.name" placeholder="Enter water point name" />
        </el-form-item>

        <el-form-item label="Type">
          <el-select v-model="waterForm.type" placeholder="Select water point type" filterable style="width: 100%">
            <el-option
              v-for="item in waterPointTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Capacity">
          <el-input v-model="waterForm.capacity" placeholder="Enter capacity" />
        </el-form-item>

        <el-form-item label="Depth (Meters)" v-if="waterForm.type === 'borehole' || waterForm.type === 'well'">
          <el-input-number v-model="waterForm.depth" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Ownership Type">
          <el-select v-model="waterForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
            <el-option
              v-for="item in ownershipOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Owner">
          <el-input v-model="waterForm.owner" placeholder="Enter owner" />
        </el-form-item>

        <el-form-item label="Catchment">
          <el-input v-model="waterForm.catchment" placeholder="Enter catchment" />
        </el-form-item>

        <el-form-item label="Price">
          <el-input-number v-model="waterForm.price" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Condition">
          <el-select v-model="waterForm.condition" placeholder="Select condition" filterable style="width: 100%">
            <el-option
              v-for="item in conditionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Availability">
          <el-select v-model="waterForm.availability" placeholder="Select availability" filterable style="width: 100%">
            <el-option
              v-for="item in availabilityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Name of Provider">
          <el-input v-model="waterForm.name_of_provider" placeholder="Enter name of provider" />
        </el-form-item>

        <el-form-item label="Cost of 20 Litre Jerrican">
          <el-input-number v-model="waterForm.cost_of_20_litre_jerrican" :min="0" :precision="2" style="width: 100%" />
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
            {{ isEditMode ? 'Update Water Point' : 'Save Water Point' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.add-water-container {
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
