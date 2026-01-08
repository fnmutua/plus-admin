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
import { countyOptions, settlementOptionsV2 } from './common/index'
import {
  SchoolLevelOptions,
  mhmOptions
} from './common/index'

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
  { title: 'Select Location', description: 'Choose county and settlement' },
  { title: 'Mark Location', description: 'Click on the map to mark school location' },
  { title: 'Complete Details', description: 'Fill in school information' }
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
const schoolMarker = ref<any>(null)
const existingSchoolMarkers = ref<Map<number, any>>(new Map())
const settlementGeo = ref<any>(null)
const schoolGeometry = ref<any>(null)
const mapContainer = ref<HTMLDivElement | null>(null)
const markerPlacementMode = ref(false)
const mapClickListener = ref<any>(null)
const existingSchools = ref<any[]>([])
const loadingSchools = ref(false)
const isEditMode = ref(false)
const editingSchoolId = ref<number | null>(null)

// Step 3: Form Drawer
const drawerVisible = ref(false)
const formRef = ref<FormInstance>()
const schoolForm = reactive({
  name: '',
  registration_number: '',
  settlement_id: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  education_category: [],
  registration_status: '',
  ownership_type: '',
  ownership_details: '',
  boarding_type: '',
  land_ownership_status: '',
  respondent_name: '',
  respondent_phone: '',
  enrolled_boys_count: null,
  enrolled_girls_count: null,
  student_source: '',
  male_teachers_count: null,
  female_teachers_count: null,
  classroom_count: null,
  classroom_condition: '',
  boys_toilets_count: null,
  girls_toilets_count: null,
  handwashing_stations_count: null,
  toilet_condition: '',
  fees_paid_by_students: '',
  term_1_fees_amount: null,
  term_2_fees_amount: null,
  term_3_fees_amount: null,
  dropout_count: null,
  dropout_reasons: '',
  retention_efforts: '',
  retention_efforts_reasons: '',
  sanitary_pads_provision: '',
  sanitary_pads_provider: '',
  sanitary_pads_bins: '',
  teaching_aids_available: '',
  boreholes_count: null,
  water_tanks_count: null,
  permanent_classrooms_count: null,
  bom_teachers_count: null,
  compound_fence_status: '',
  school_challenges: '',
  parcel_has_title: '',
  parcel_size_hectares: null,
  efforts_for_student_retention: '',
  additional_comments: '',
  distance_in_meters: null,
  geom: null
})

const formRules = reactive({
  name: [{ required: true, message: 'School name is required', trigger: 'blur' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'blur' }],
  registration_number: [{ required: false, message: 'Registration number', trigger: 'blur' }],
  registration_status: [{ required: false, message: 'Registration status', trigger: 'change' }],
  ownership_type: [{ required: false, message: 'Ownership type', trigger: 'change' }]
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
        schoolForm.settlement_id = settlementId
        schoolForm.county_id = settlement.county_id || ''
        schoolForm.subcounty_id = settlement.subcounty_id || ''
        schoolForm.ward_id = settlement.ward_id || ''
      }

      // Move to step 2: Map
      currentStep.value = 1
      await nextTick()
      await initializeMap()
      // Load existing schools for this settlement
      await loadExistingSchools(settlementId)
    } else {
      ElMessage.error('Settlement has no boundary geometry')
    }
  } catch (error) {
    console.error('Error loading settlement geometry:', error)
    ElMessage.error('Failed to load settlement boundary')
  }
}

// Load existing schools for the settlement
const loadExistingSchools = async (settlementId: number) => {
  loadingSchools.value = true
  existingSchools.value = []
  
  // Clear existing markers
  existingSchoolMarkers.value.forEach((marker) => {
    marker.setMap(null)
  })
  existingSchoolMarkers.value.clear()

  try {
    const formData = {
      model: 'education_facility',
      filters: ['settlement_id'],
      filterValues: [[settlementId]],
      associated_multiple_models: ['settlement', 'county', 'subcounty', 'ward']
    }

    const res = await getSettlementListByCounty(formData)
    
    if (res.data && res.data.length > 0) {
      existingSchools.value = res.data
      
      // Add markers for existing schools
      existingSchools.value.forEach((school: any) => {
        if (school.geom && school.geom.type === 'Point' && school.geom.coordinates) {
          const position = {
            lat: school.geom.coordinates[1],
            lng: school.geom.coordinates[0]
          }

          const marker = new window.google.maps.Marker({
            position: position,
            map: map.value,
            draggable: false,
            title: school.name || 'School',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(35, 35)
            },
            zIndex: 1
          })

          // Add click listener to edit school
          marker.addListener('click', () => {
            editSchool(school)
          })

          // Store marker with school ID
          existingSchoolMarkers.value.set(school.id, marker)
        }
      })

      if (existingSchools.value.length > 0) {
        ElMessage.success(`Loaded ${existingSchools.value.length} existing school(s)`)
      }
    }
  } catch (error) {
    console.error('Error loading existing schools:', error)
    ElMessage.warning('Failed to load existing schools')
  } finally {
    loadingSchools.value = false
  }
}

// Edit existing school
const editSchool = (school: any) => {
  isEditMode.value = true
  editingSchoolId.value = school.id

  // Populate form with school data
  schoolForm.name = school.name || ''
  schoolForm.registration_number = school.registration_number || ''
  schoolForm.settlement_id = school.settlement_id || ''
  schoolForm.county_id = school.county_id || ''
  schoolForm.subcounty_id = school.subcounty_id || ''
  schoolForm.ward_id = school.ward_id || ''
  // Handle education_category as comma-separated string or array
  if (school.education_category) {
    schoolForm.education_category = typeof school.education_category === 'string' 
      ? school.education_category.split(',').map((cat: string) => cat.trim()).filter((cat: string) => cat)
      : Array.isArray(school.education_category) 
        ? school.education_category 
        : []
  } else {
    schoolForm.education_category = []
  }
  schoolForm.registration_status = school.registration_status || ''
  schoolForm.ownership_type = school.ownership_type || ''
  schoolForm.ownership_details = school.ownership_details || ''
  schoolForm.boarding_type = school.boarding_type || ''
  schoolForm.land_ownership_status = school.land_ownership_status || ''
  schoolForm.respondent_name = school.respondent_name || ''
  schoolForm.respondent_phone = school.respondent_phone || ''
  schoolForm.enrolled_boys_count = school.enrolled_boys_count || null
  schoolForm.enrolled_girls_count = school.enrolled_girls_count || null
  schoolForm.student_source = school.student_source || ''
  schoolForm.male_teachers_count = school.male_teachers_count || null
  schoolForm.female_teachers_count = school.female_teachers_count || null
  schoolForm.classroom_count = school.classroom_count || null
  schoolForm.classroom_condition = school.classroom_condition || ''
  schoolForm.boys_toilets_count = school.boys_toilets_count || null
  schoolForm.girls_toilets_count = school.girls_toilets_count || null
  schoolForm.handwashing_stations_count = school.handwashing_stations_count || null
  schoolForm.toilet_condition = school.toilet_condition || ''
  schoolForm.fees_paid_by_students = school.fees_paid_by_students || ''
  schoolForm.term_1_fees_amount = school.term_1_fees_amount || null
  schoolForm.term_2_fees_amount = school.term_2_fees_amount || null
  schoolForm.term_3_fees_amount = school.term_3_fees_amount || null
  schoolForm.dropout_count = school.dropout_count || null
  schoolForm.dropout_reasons = school.dropout_reasons || ''
  schoolForm.retention_efforts = school.retention_efforts || ''
  schoolForm.retention_efforts_reasons = school.retention_efforts_reasons || ''
  schoolForm.sanitary_pads_provision = school.sanitary_pads_provision || ''
  schoolForm.sanitary_pads_provider = school.sanitary_pads_provider || ''
  schoolForm.sanitary_pads_bins = school.sanitary_pads_bins || ''
  schoolForm.teaching_aids_available = school.teaching_aids_available || ''
  schoolForm.boreholes_count = school.boreholes_count || null
  schoolForm.water_tanks_count = school.water_tanks_count || null
  schoolForm.permanent_classrooms_count = school.permanent_classrooms_count || null
  schoolForm.bom_teachers_count = school.bom_teachers_count || null
  schoolForm.compound_fence_status = school.compound_fence_status || ''
  schoolForm.school_challenges = school.school_challenges || ''
  schoolForm.parcel_has_title = school.parcel_has_title || ''
  schoolForm.parcel_size_hectares = school.parcel_size_hectares || null
  schoolForm.efforts_for_student_retention = school.efforts_for_student_retention || ''
  schoolForm.additional_comments = school.additional_comments || ''
  schoolForm.distance_in_meters = school.distance_in_meters || null
  schoolForm.geom = school.geom || null

  // Update marker to show it's being edited
  const marker = existingSchoolMarkers.value.get(school.id)
  if (marker) {
    marker.setIcon({
      url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      scaledSize: new window.google.maps.Size(40, 40)
    })
    marker.setZIndex(1000)
  }

  // Center map on school
  if (school.geom && school.geom.coordinates) {
    map.value.setCenter({
      lat: school.geom.coordinates[1],
      lng: school.geom.coordinates[0]
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
      if (schoolMarker.value) {
        schoolMarker.value.setMap(null)
      }

      // Create new marker (different color for new vs existing)
      schoolMarker.value = new window.google.maps.Marker({
        position: position,
        map: map.value,
        draggable: true,
        title: 'New School Location - Click to edit',
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

      schoolGeometry.value = geometry
      schoolForm.geom = geometry

      // Add click listener to open form drawer
      schoolMarker.value.addListener('click', () => {
        // Ensure we're not in edit mode for existing school
        if (!isEditMode.value) {
          // Ensure geometry is synced with marker position
          const position = schoolMarker.value.getPosition()
          if (position) {
            schoolForm.geom = {
              type: 'Point',
              coordinates: [position.lng(), position.lat()],
              crs: { type: 'name', properties: { name: 'EPSG:4326' } }
            }
            schoolGeometry.value = schoolForm.geom
          }
          drawerVisible.value = true
        }
      })

      // Listen for marker drag to update geometry
      schoolMarker.value.addListener('dragend', (dragEvent: any) => {
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
            schoolMarker.value.setPosition({
              lat: schoolGeometry.value.coordinates[1],
              lng: schoolGeometry.value.coordinates[0]
            })
            return
          }
        }
        
        const newGeometry = {
          type: 'Point',
          coordinates: [newPosition.lng, newPosition.lat],
          crs: { type: 'name', properties: { name: 'EPSG:4326' } }
        }
        schoolGeometry.value = newGeometry
        schoolForm.geom = newGeometry
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
      if (!schoolMarker.value && !schoolForm.geom) {
        ElMessage.error('Please mark the school location on the map')
        return
      }
      
      // If marker exists but geometry is not set, get it from marker
      if (schoolMarker.value && !schoolForm.geom) {
        const position = schoolMarker.value.getPosition()
        schoolForm.geom = {
          type: 'Point',
          coordinates: [position.lng(), position.lat()],
          crs: { type: 'name', properties: { name: 'EPSG:4326' } }
        }
      }

      try {
        // Convert education_category array to comma-separated string
        const formDataToSubmit = {
          ...schoolForm,
          education_category: Array.isArray(schoolForm.education_category) 
            ? schoolForm.education_category.join(',') 
            : schoolForm.education_category || ''
        }

        if (isEditMode.value && editingSchoolId.value) {
          // Update existing school
          const formData = {
            ...formDataToSubmit,
            id: editingSchoolId.value,
            model: 'education_facility'
          }

          const res = await updateOneRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Education facility updated successfully')
            // Reload schools to reflect changes
            await loadExistingSchools(schoolForm.settlement_id)
            // Reset form
            resetForm()
            drawerVisible.value = false
          } else {
            ElMessage.error('Failed to update education facility')
          }
        } else {
          // Create new school
          const formData = {
            ...formDataToSubmit,
            model: 'education_facility',
            code: uuid.v4(),
            isApproved: 'Pending',
            createdBy: userInfo.id
          }

          const res = await CreateRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Education facility created successfully')
            // Reload schools to show the new one
            await loadExistingSchools(schoolForm.settlement_id)
            // Reset form
            resetForm()
            drawerVisible.value = false
          } else {
            ElMessage.error('Failed to create education facility')
          }
        }
      } catch (error) {
        console.error('Error saving education facility:', error)
        ElMessage.error('Failed to save education facility')
      }
    }
  })
}

// Reset form to create mode
const resetForm = () => {
  isEditMode.value = false
  editingSchoolId.value = null
  
  // Remove new marker if exists
  if (schoolMarker.value) {
    schoolMarker.value.setMap(null)
    schoolMarker.value = null
  }
  
  // Reset form fields
  schoolForm.name = ''
  schoolForm.registration_number = ''
  schoolForm.education_category = []
  schoolForm.registration_status = ''
  schoolForm.ownership_type = ''
  schoolForm.ownership_details = ''
  schoolForm.boarding_type = ''
  schoolForm.land_ownership_status = ''
  schoolForm.respondent_name = ''
  schoolForm.respondent_phone = ''
  schoolForm.enrolled_boys_count = null
  schoolForm.enrolled_girls_count = null
  schoolForm.student_source = ''
  schoolForm.male_teachers_count = null
  schoolForm.female_teachers_count = null
  schoolForm.classroom_count = null
  schoolForm.classroom_condition = ''
  schoolForm.boys_toilets_count = null
  schoolForm.girls_toilets_count = null
  schoolForm.handwashing_stations_count = null
  schoolForm.toilet_condition = ''
  schoolForm.fees_paid_by_students = ''
  schoolForm.term_1_fees_amount = null
  schoolForm.term_2_fees_amount = null
  schoolForm.term_3_fees_amount = null
  schoolForm.dropout_count = null
  schoolForm.dropout_reasons = ''
  schoolForm.retention_efforts = ''
  schoolForm.retention_efforts_reasons = ''
  schoolForm.sanitary_pads_provision = ''
  schoolForm.sanitary_pads_provider = ''
  schoolForm.sanitary_pads_bins = ''
  schoolForm.teaching_aids_available = ''
  schoolForm.boreholes_count = null
  schoolForm.water_tanks_count = null
  schoolForm.permanent_classrooms_count = null
  schoolForm.bom_teachers_count = null
  schoolForm.compound_fence_status = ''
  schoolForm.school_challenges = ''
  schoolForm.parcel_has_title = ''
  schoolForm.parcel_size_hectares = null
  schoolForm.efforts_for_student_retention = ''
  schoolForm.additional_comments = ''
  schoolForm.distance_in_meters = null
  schoolForm.geom = null
  
  // Reset existing markers to blue
  existingSchoolMarkers.value.forEach((marker) => {
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
      if (schoolMarker.value) {
        schoolMarker.value.setMap(null)
        schoolMarker.value = null
      }
      if (settlementPolygon.value) {
        settlementPolygon.value.setMap(null)
        settlementPolygon.value = null
      }
      map.value = null
      settlementGeo.value = null
      schoolGeometry.value = null
      schoolForm.geom = null
      markerPlacementMode.value = false
      // Clear existing schools
      existingSchoolMarkers.value.forEach((marker) => {
        marker.setMap(null)
      })
      existingSchoolMarkers.value.clear()
      existingSchools.value = []
      isEditMode.value = false
      editingSchoolId.value = null
    }
  } else {
    router.back()
  }
}

// Close drawer and reset if not in edit mode
const closeDrawer = () => {
  drawerVisible.value = false
  // If not in edit mode, reset the new marker
  if (!isEditMode.value && schoolMarker.value) {
    schoolMarker.value.setMap(null)
    schoolMarker.value = null
    schoolGeometry.value = null
    schoolForm.geom = null
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
  if (schoolMarker.value) {
    schoolMarker.value.setMap(null)
    schoolMarker.value = null
  }
  schoolGeometry.value = null
  schoolForm.geom = null
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
  <div class="add-education-container">
    <el-card>
      <!-- Header -->
      <template #header>
        <div class="header-content">
          <el-button :icon="ArrowLeft" @click="goBack" text>Back</el-button>
          <h2>Add New Education Facility</h2>
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
              <span v-else-if="schoolMarker">
                Marker placed. You can drag it to adjust position, or delete it to place a new one.
              </span>
              <span v-else-if="existingSchools.length > 0">
                {{ existingSchools.length }} existing school(s) loaded. Click on a blue marker to edit, or click "Add Marker" to create a new school.
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
            :disabled="!schoolMarker">
            <el-icon style="margin-right: 5px;"><Delete /></el-icon>
            Delete Marker
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- Step 3: Form Drawer (opens after placing marker or clicking existing school) -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEditMode ? 'Edit Education Facility' : 'New Education Facility Details'"
      :size="isMobile ? '100%' : '600px'"
      direction="rtl"
      :before-close="closeDrawer"
    >
      <el-form
        ref="formRef"
        :model="schoolForm"
        :rules="formRules"
        label-width="180px"
        label-position="left"
      >
        <el-divider content-position="left">Basic Information</el-divider>

        <el-form-item label="School Name" prop="name">
          <el-input v-model="schoolForm.name" placeholder="Enter school name" />
        </el-form-item>

        <el-form-item label="Registration Number">
          <el-input v-model="schoolForm.registration_number" placeholder="Enter registration number" />
        </el-form-item>

        <el-form-item label="Registration Status">
          <el-select v-model="schoolForm.registration_status" placeholder="Select registration status" filterable style="width: 100%">
            <el-option
              v-for="item in regOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Education Category">
          <el-select 
            v-model="schoolForm.education_category" 
            placeholder="Select education category(s)" 
            filterable 
            multiple
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%">
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Ownership Type">
          <el-select v-model="schoolForm.ownership_type" placeholder="Select ownership type" filterable style="width: 100%">
            <el-option
              v-for="item in generalOwnership"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Ownership Details">
          <el-input v-model="schoolForm.ownership_details" placeholder="Enter ownership details" />
        </el-form-item>

        <el-form-item label="Boarding Type">
          <el-select v-model="schoolForm.boarding_type" placeholder="Select boarding type" filterable style="width: 100%">
            <el-option label="Boarding" value="Boarding" />
            <el-option label="Day" value="Day" />
            <el-option label="Mixed" value="Mixed" />
          </el-select>
        </el-form-item>

        <el-form-item label="Land Ownership Status">
          <el-select v-model="schoolForm.land_ownership_status" placeholder="Select land ownership status" filterable style="width: 100%">
            <el-option label="Owned" value="Owned" />
            <el-option label="Leased" value="Leased" />
            <el-option label="Rented" value="Rented" />
            <el-option label="Other" value="Other" />
          </el-select>
        </el-form-item>

        <el-form-item label="Respondent Name">
          <el-input v-model="schoolForm.respondent_name" placeholder="Enter respondent name" />
        </el-form-item>

        <el-form-item label="Respondent Phone">
          <el-input v-model="schoolForm.respondent_phone" placeholder="Enter respondent phone" />
        </el-form-item>

        <el-divider content-position="left">Enrollment</el-divider>

        <el-form-item label="Enrolled Boys Count">
          <el-input-number v-model="schoolForm.enrolled_boys_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Enrolled Girls Count">
          <el-input-number v-model="schoolForm.enrolled_girls_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Student Source">
          <el-input v-model="schoolForm.student_source" placeholder="Enter student source" />
        </el-form-item>

        <el-form-item label="Male Teachers Count">
          <el-input-number v-model="schoolForm.male_teachers_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Female Teachers Count">
          <el-input-number v-model="schoolForm.female_teachers_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="BOM Teachers Count">
          <el-input-number v-model="schoolForm.bom_teachers_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Dropout Count">
          <el-input-number v-model="schoolForm.dropout_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Dropout Reasons">
          <el-input v-model="schoolForm.dropout_reasons" type="textarea" :rows="2" placeholder="Enter dropout reasons" />
        </el-form-item>

        <el-form-item label="Retention Efforts">
          <el-input v-model="schoolForm.retention_efforts" type="textarea" :rows="2" placeholder="Enter retention efforts" />
        </el-form-item>

        <el-form-item label="Retention Efforts Reasons">
          <el-input v-model="schoolForm.retention_efforts_reasons" type="textarea" :rows="2" placeholder="Enter retention efforts reasons" />
        </el-form-item>

        <el-form-item label="Efforts for Student Retention">
          <el-input v-model="schoolForm.efforts_for_student_retention" type="textarea" :rows="2" placeholder="Enter efforts for student retention" />
        </el-form-item>

        <el-divider content-position="left">Fees Information</el-divider>

        <el-form-item label="Fees Paid by Students">
          <el-input v-model="schoolForm.fees_paid_by_students" placeholder="Enter fees paid by students" />
        </el-form-item>

        <el-form-item label="Term 1 Fees Amount">
          <el-input-number v-model="schoolForm.term_1_fees_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Term 2 Fees Amount">
          <el-input-number v-model="schoolForm.term_2_fees_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Term 3 Fees Amount">
          <el-input-number v-model="schoolForm.term_3_fees_amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-divider content-position="left">Facilities</el-divider>

        <el-form-item label="Classroom Count">
          <el-input-number v-model="schoolForm.classroom_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Permanent Classrooms Count">
          <el-input-number v-model="schoolForm.permanent_classrooms_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Classroom Condition">
          <el-select v-model="schoolForm.classroom_condition" placeholder="Select classroom condition" filterable style="width: 100%">
            <el-option label="Good" value="Good" />
            <el-option label="Fair" value="Fair" />
            <el-option label="Poor" value="Poor" />
            <el-option label="Very Poor" value="Very Poor" />
          </el-select>
        </el-form-item>

        <el-form-item label="Boys Toilets Count">
          <el-input-number v-model="schoolForm.boys_toilets_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Girls Toilets Count">
          <el-input-number v-model="schoolForm.girls_toilets_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Toilet Condition">
          <el-select v-model="schoolForm.toilet_condition" placeholder="Select toilet condition" filterable style="width: 100%">
            <el-option label="Good" value="Good" />
            <el-option label="Fair" value="Fair" />
            <el-option label="Poor" value="Poor" />
            <el-option label="Very Poor" value="Very Poor" />
          </el-select>
        </el-form-item>

        <el-form-item label="Handwashing Stations">
          <el-input-number v-model="schoolForm.handwashing_stations_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-divider content-position="left">Menstrual Hygiene Management</el-divider>

        <el-form-item label="Sanitary Pads Provision">
          <el-select v-model="schoolForm.sanitary_pads_provision" placeholder="Select sanitary pads provision" filterable style="width: 100%">
            <el-option label="Yes" value="Yes" />
            <el-option label="No" value="No" />
          </el-select>
        </el-form-item>

        <el-form-item label="Sanitary Pads Provider">
          <el-input v-model="schoolForm.sanitary_pads_provider" placeholder="Enter sanitary pads provider" />
        </el-form-item>

        <el-form-item label="Sanitary Pads Bins">
          <el-select v-model="schoolForm.sanitary_pads_bins" placeholder="Select sanitary pads bins" filterable style="width: 100%">
            <el-option label="Yes" value="Yes" />
            <el-option label="No" value="No" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">Water and Infrastructure</el-divider>

        <el-form-item label="Boreholes Count">
          <el-input-number v-model="schoolForm.boreholes_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Water Tanks Count">
          <el-input-number v-model="schoolForm.water_tanks_count" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Compound Fence Status">
          <el-select v-model="schoolForm.compound_fence_status" placeholder="Select compound fence status" filterable style="width: 100%">
            <el-option label="Fenced" value="Fenced" />
            <el-option label="Partially Fenced" value="Partially Fenced" />
            <el-option label="Not Fenced" value="Not Fenced" />
          </el-select>
        </el-form-item>

        <el-form-item label="Teaching Aids Available">
          <el-select v-model="schoolForm.teaching_aids_available" placeholder="Select teaching aids available" filterable style="width: 100%">
            <el-option label="Yes" value="Yes" />
            <el-option label="No" value="No" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">Property Information</el-divider>

        <el-form-item label="Parcel Has Title">
          <el-select v-model="schoolForm.parcel_has_title" placeholder="Select parcel has title" filterable style="width: 100%">
            <el-option label="Yes" value="Yes" />
            <el-option label="No" value="No" />
          </el-select>
        </el-form-item>

        <el-form-item label="Parcel Size (Hectares)">
          <el-input-number v-model="schoolForm.parcel_size_hectares" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Distance in Meters">
          <el-input-number v-model="schoolForm.distance_in_meters" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-divider content-position="left">Additional Information</el-divider>

        <el-form-item label="School Challenges">
          <el-input v-model="schoolForm.school_challenges" type="textarea" :rows="3" placeholder="Enter school challenges" />
        </el-form-item>

        <el-form-item label="Additional Comments">
          <el-input v-model="schoolForm.additional_comments" type="textarea" :rows="3" placeholder="Enter additional comments" />
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
            {{ isEditMode ? 'Update Education Facility' : 'Save Education Facility' }}
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.add-education-container {
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
