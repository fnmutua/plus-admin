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
  ElAlert
} from 'element-plus'
import { ArrowLeft, Check, Plus, Delete } from '@element-plus/icons-vue'
import * as turf from '@turf/turf'
import { getOneGeo, getSettlementListByCounty } from '@/api/settlements'
import { CreateRecord, updateOneRecord } from '@/api/settlements'
import { countyOptions, settlementOptionsV2 } from '../common/index'
import {
  ownsershipOptions,
  HCFTypeOptions
} from '../common/index'

// Health facility level options from mapping_tool_rennaisance_questions.json (hcf_levels)
const LevelOptionsLocal = [
  { label: 'LEVEL 1 – Community Facilities', value: 'level_1' },
  { label: 'LEVEL 2 – Health Dispensaries', value: 'level_2' },
  { label: 'LEVEL 3 – Health Centres', value: 'level_3' },
  { label: 'LEVEL 4 – County Hospitals', value: 'level_4' },
  { label: 'LEVEL 5 – County Referral Hospitals', value: 'level_5' },
  { label: 'LEVEL 6 – National Referral Hospitals', value: 'level_6' }
]

// Registration status options from mapping_tool_rennaisance_questions.json (reg_status)
const regOptionsLocal = [
  { label: 'Unregistered', value: 'unregistred' },
  { label: 'Registered', value: 'registered' },
  { label: 'Awaiting Registration', value: 'awaiting_registration' }
]

// Ownership options from mapping_tool_rennaisance_questions.json (sponsor_type)
const generalOwnershipLocal = [
  { label: 'Government', value: 'government' },
  { label: 'CBO/NGO', value: 'ngo' },
  { label: 'Individual', value: 'individual' },
  { label: 'Community', value: 'community' }
]

// Land ownership options from mapping_tool_rennaisance_questions.json (rent_owned_land)
const tenancyOptionsLocal = [
  { label: 'Rented', value: 'rented' },
  { label: 'Owned', value: 'owned' }
]

// Yes/No options from mapping_tool_rennaisance_questions.json (yes_no)
const yesNoOptions = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
  { label: "I don't know", value: 'unknown' }
]

// Yes/No Plain options from mapping_tool_rennaisance_questions.json (yes_no_plain)
const yesNoPlainOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
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
  { title: 'Select Location', description: 'Choose county and settlement' },
  { title: 'Mark Location', description: 'Click on the map to mark health facility location' },
  { title: 'Complete Details', description: 'Fill in health facility information' }
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
  facility_number: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  level: '',
  registration_status: '',
  ownership_type: '',
  owner: '',
  land_ownership: '',
  land_title_available: '',
  land_parcel_size: null,
  condition: '',
  num_inpatient: null,
  outpatient_visits_per_day: null,
  maternity_deliveries_per_day: null,
  antenatal_immunizations_per_day: null,
  general_beds: null,
  maternity_beds: null,
  pediatric_beds: null,
  total_beds: null,
  occupancy_rate: null,
  number_doctors: null,
  number_clinical_officers: null,
  number_pharmacists: null,
  number_nurses: null,
  number_midwives: null,
  number_other_staff: null,
  services_offered: '',
  referral_destinations: '',
  referral_distance_km: null,
  referrals_per_day: null,
  has_ambulance: '',
  source_of_drugs: '',
  common_ailments: '',
  source_of_patients: '',
  challenges: '',
  respondent_name: '',
  respondent_phone: '',
  distance_meters: null,
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
      model: 'health_facility',
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
            title: facility.name || 'Health Facility',
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
        ElMessage.success(`Loaded ${existingFacilities.value.length} existing facility/facilities`)
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
  facilityForm.facility_number = facility.facility_number || ''
  facilityForm.settlement_id = facility.settlement_id || ''
  facilityForm.county_id = facility.county_id || ''
  facilityForm.subcounty_id = facility.subcounty_id || ''
  facilityForm.ward_id = facility.ward_id || ''
  facilityForm.level = facility.level || ''
  facilityForm.registration_status = facility.registration_status || ''
  facilityForm.ownership_type = facility.ownership_type || ''
  facilityForm.owner = facility.owner || ''
  facilityForm.land_ownership = facility.land_ownership || ''
  facilityForm.land_title_available = facility.land_title_available || ''
  facilityForm.land_parcel_size = facility.land_parcel_size || null
  facilityForm.condition = facility.condition || ''
  facilityForm.num_inpatient = facility.num_inpatient || null
  facilityForm.outpatient_visits_per_day = facility.outpatient_visits_per_day || null
  facilityForm.maternity_deliveries_per_day = facility.maternity_deliveries_per_day || null
  facilityForm.antenatal_immunizations_per_day = facility.antenatal_immunizations_per_day || null
  facilityForm.general_beds = facility.general_beds || null
  facilityForm.maternity_beds = facility.maternity_beds || null
  facilityForm.pediatric_beds = facility.pediatric_beds || null
  facilityForm.total_beds = facility.total_beds || null
  facilityForm.occupancy_rate = facility.occupancy_rate || null
  facilityForm.number_doctors = facility.number_doctors || null
  facilityForm.number_clinical_officers = facility.number_clinical_officers || null
  facilityForm.number_pharmacists = facility.number_pharmacists || null
  facilityForm.number_nurses = facility.number_nurses || null
  facilityForm.number_midwives = facility.number_midwives || null
  facilityForm.number_other_staff = facility.number_other_staff || null
  facilityForm.services_offered = facility.services_offered || ''
  facilityForm.referral_destinations = facility.referral_destinations || ''
  facilityForm.referral_distance_km = facility.referral_distance_km || null
  facilityForm.referrals_per_day = facility.referrals_per_day || null
  facilityForm.has_ambulance = facility.has_ambulance || ''
  facilityForm.source_of_drugs = facility.source_of_drugs || ''
  facilityForm.common_ailments = facility.common_ailments || ''
  facilityForm.source_of_patients = facility.source_of_patients || ''
  facilityForm.challenges = facility.challenges || ''
  facilityForm.respondent_name = facility.respondent_name || ''
  facilityForm.respondent_phone = facility.respondent_phone || ''
  facilityForm.distance_meters = facility.distance_meters || null
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
        title: 'New Health Facility Location - Click to edit',
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
        ElMessage.error('Please mark the health facility location on the map')
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
        const formDataToSubmit = {
          ...facilityForm
        }

        if (isEditMode.value && editingFacilityId.value) {
          // Update existing facility
          const formData = {
            ...formDataToSubmit,
            id: editingFacilityId.value,
            model: 'health_facility'
          }

          const res = await updateOneRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Health facility updated successfully')
            // Reload facilities to reflect changes
            await loadExistingFacilities(facilityForm.settlement_id)
            // Reset form
            resetForm()
            drawerVisible.value = false
          } else {
            ElMessage.error('Failed to update health facility')
          }
        } else {
          // Create new facility
          const formData = {
            ...formDataToSubmit,
            model: 'health_facility',
            code: uuid.v4(),
            isApproved: 'Pending',
            created_by: userInfo.id
          }

          const res = await CreateRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Health facility created successfully')
            // Reload facilities to show the new one
            await loadExistingFacilities(facilityForm.settlement_id)
            // Reset form
            resetForm()
            drawerVisible.value = false
          } else {
            ElMessage.error('Failed to create health facility')
          }
        }
      } catch (error) {
        console.error('Error saving health facility:', error)
        ElMessage.error('Failed to save health facility')
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
  facilityForm.facility_number = ''
  facilityForm.level = ''
  facilityForm.registration_status = ''
  facilityForm.ownership_type = ''
  facilityForm.owner = ''
  facilityForm.land_ownership = ''
  facilityForm.land_title_available = ''
  facilityForm.land_parcel_size = null
  facilityForm.condition = ''
  facilityForm.num_inpatient = null
  facilityForm.outpatient_visits_per_day = null
  facilityForm.maternity_deliveries_per_day = null
  facilityForm.antenatal_immunizations_per_day = null
  facilityForm.general_beds = null
  facilityForm.maternity_beds = null
  facilityForm.pediatric_beds = null
  facilityForm.total_beds = null
  facilityForm.occupancy_rate = null
  facilityForm.number_doctors = null
  facilityForm.number_clinical_officers = null
  facilityForm.number_pharmacists = null
  facilityForm.number_nurses = null
  facilityForm.number_midwives = null
  facilityForm.number_other_staff = null
  facilityForm.services_offered = ''
  facilityForm.referral_destinations = ''
  facilityForm.referral_distance_km = null
  facilityForm.referrals_per_day = null
  facilityForm.has_ambulance = ''
  facilityForm.source_of_drugs = ''
  facilityForm.common_ailments = ''
  facilityForm.source_of_patients = ''
  facilityForm.challenges = ''
  facilityForm.respondent_name = ''
  facilityForm.respondent_phone = ''
  facilityForm.distance_meters = null
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
      // Clear existing schools
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

// Delete marker (only for new marker, not existing schools)
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
  <div class="add-health-container">
    <el-card>
      <!-- Header -->
      <template #header>
        <div class="header-content">
          <el-button :icon="ArrowLeft" @click="goBack" text>Back</el-button>
          <h2>Add New Health Facility</h2>
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
        <div class="map-instructions">
          <el-alert 
            :type="markerPlacementMode ? 'warning' : 'info'" 
            :closable="false">
            <template #default>
              <span v-if="markerPlacementMode">
                <strong>Marker Placement Mode Active:</strong> Click on the map inside the settlement boundary to place the marker.
              </span>
              <span v-else-if="facilityMarker">
                Marker placed. You can drag it to adjust position, or delete it to place a new one.
              </span>
              <span v-else-if="existingFacilities.length > 0">
                {{ existingFacilities.length }} existing facility/facilities loaded. Click on a blue marker to edit, or click "Add Marker" to create a new facility.
              </span>
              <span v-else>
                Click "Add Marker" button to enable marker placement, then click on the map inside the settlement boundary.
              </span>
            </template>
          </el-alert>
        </div>
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

    <!-- Step 3: Form Drawer (opens after placing marker or clicking existing school) -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEditMode ? 'Edit Health Facility' : 'New Health Facility Details'"
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

        <el-form-item label="Facility Number">
          <el-input v-model="facilityForm.facility_number" placeholder="Enter facility number" />
        </el-form-item>

        <el-form-item label="Level">
          <el-select v-model="facilityForm.level" placeholder="Select level" filterable style="width: 100%">
            <el-option
              v-for="item in LevelOptionsLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Registration Status">
          <el-select v-model="facilityForm.registration_status" placeholder="Select registration status" filterable style="width: 100%">
            <el-option
              v-for="item in regOptionsLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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

        <el-form-item label="Owner">
          <el-input v-model="facilityForm.owner" placeholder="Enter owner" />
        </el-form-item>

        <el-form-item label="Land Ownership">
          <el-select v-model="facilityForm.land_ownership" placeholder="Select land ownership" filterable style="width: 100%">
            <el-option
              v-for="item in tenancyOptionsLocal"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Land Title Available">
          <el-select v-model="facilityForm.land_title_available" placeholder="Select land title available" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Land Parcel Size">
          <el-input-number v-model="facilityForm.land_parcel_size" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Condition">
          <el-select v-model="facilityForm.condition" placeholder="Select condition" filterable style="width: 100%">
            <el-option
              v-for="item in conditionFacilityOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
            <el-option label="Very Poor" value="Very Poor" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">Capacity</el-divider>

        <el-form-item label="Number of Inpatients">
          <el-input-number v-model="facilityForm.num_inpatient" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Outpatient Visits/Day">
          <el-input-number v-model="facilityForm.outpatient_visits_per_day" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Maternity Deliveries/Day">
          <el-input-number v-model="facilityForm.maternity_deliveries_per_day" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Immunizations/Day">
          <el-input-number v-model="facilityForm.antenatal_immunizations_per_day" :min="0" style="width: 100%" />
        </el-form-item>

        <el-divider content-position="left">Beds</el-divider>

        <el-form-item label="General Beds">
          <el-input-number v-model="facilityForm.general_beds" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Maternity Beds">
          <el-input-number v-model="facilityForm.maternity_beds" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Pediatric Beds">
          <el-input-number v-model="facilityForm.pediatric_beds" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Total Beds">
          <el-input-number v-model="facilityForm.total_beds" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Occupancy Rate">
          <el-input-number v-model="facilityForm.occupancy_rate" :min="0" :max="100" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-divider content-position="left">Staff</el-divider>

        <el-form-item label="Number of Doctors">
          <el-input-number v-model="facilityForm.number_doctors" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Number of Clinical Officers">
          <el-input-number v-model="facilityForm.number_clinical_officers" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Number of Pharmacists">
          <el-input-number v-model="facilityForm.number_pharmacists" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Number of Nurses">
          <el-input-number v-model="facilityForm.number_nurses" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Number of Midwives">
          <el-input-number v-model="facilityForm.number_midwives" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Number of Other Staff">
          <el-input-number v-model="facilityForm.number_other_staff" :min="0" style="width: 100%" />
        </el-form-item>

        <el-divider content-position="left">Services & Referrals</el-divider>

        <el-form-item label="Services Offered">
          <el-input v-model="facilityForm.services_offered" type="textarea" :rows="3" placeholder="Enter services offered" />
        </el-form-item>

        <el-form-item label="Referral Destinations">
          <el-input v-model="facilityForm.referral_destinations" type="textarea" :rows="2" placeholder="Enter referral destinations" />
        </el-form-item>

        <el-form-item label="Referral Distance (km)">
          <el-input-number v-model="facilityForm.referral_distance_km" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Referrals per Day">
          <el-input-number v-model="facilityForm.referrals_per_day" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Has Ambulance">
          <el-select v-model="facilityForm.has_ambulance" placeholder="Select has ambulance" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoPlainOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Source of Drugs">
          <el-input v-model="facilityForm.source_of_drugs" placeholder="Enter source of drugs" />
        </el-form-item>

        <el-form-item label="Common Ailments">
          <el-input v-model="facilityForm.common_ailments" type="textarea" :rows="2" placeholder="Enter common ailments" />
        </el-form-item>

        <el-form-item label="Source of Patients">
          <el-input v-model="facilityForm.source_of_patients" placeholder="Enter source of patients" />
        </el-form-item>

        <el-divider content-position="left">Additional Information</el-divider>

        <el-form-item label="Respondent Name">
          <el-input v-model="facilityForm.respondent_name" placeholder="Enter respondent name" />
        </el-form-item>

        <el-form-item label="Respondent Phone">
          <el-input v-model="facilityForm.respondent_phone" placeholder="Enter respondent phone" />
        </el-form-item>

        <el-form-item label="Distance (Meters)">
          <el-input-number v-model="facilityForm.distance_meters" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Challenges">
          <el-input v-model="facilityForm.challenges" type="textarea" :rows="3" placeholder="Enter challenges" />
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
            {{ isEditMode ? 'Update Health Facility' : 'Save Health Facility' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.add-health-container {
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

.map-instructions {
  margin-bottom: 10px;
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
