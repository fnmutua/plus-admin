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
  ElMessageBox,
  ElRow,
  ElCol,
  ElDivider,
  ElAlert,
  ElCheckbox,
  ElCheckboxGroup
} from 'element-plus'
import { ArrowLeft, Check, Plus, Delete, UploadFilled } from '@element-plus/icons-vue'
import * as turf from '@turf/turf'
import { getOneGeo, getSettlementListByCounty, getOneSettlement } from '@/api/settlements'
import { CreateRecord, updateOneRecord, duplicatePreCheck } from '@/api/settlements'
import { countyOptions, wardOptions, subcountyOptions } from './common/index'
import { getListWithoutGeo } from '@/api/counties'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import type { FormInstance } from 'element-plus'
import shortid from 'shortid'
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import proj4 from 'proj4'

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)
const isMobile = computed(() => appStore.getMobile)

const router = useRouter()
const route = useRoute()

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

// Check if user should be restricted to their county
const isCountyRestricted = computed(() => {
  return !isSuperAdmin.value && !hasNationalAccess.value && !!userCountyId.value
})

// Filtered county options based on user's location restriction
const filteredCountyOptions = computed(() => {
  if (!isCountyRestricted.value || !userCountyId.value) {
    return countyOptions.value || []
  }
  return (countyOptions.value || []).filter((county: any) => 
    county.value === userCountyId.value
  )
})

// Step management
const currentStep = ref(0)

// Step 1: Location Selection - County and Ward
const selectedCounty = ref<any>(null)
const selectedWard = ref<any>(null)
const filteredWards = ref<any[]>([])
const checkingGeometry = ref(false)

// Step 2: Map
const map = ref<any>(null)
const wardPolygon = ref<any>(null)
const settlementPolygon = ref<any>(null)
const wardGeo = ref<any>(null)
const settlementGeometry = ref<any>(null)
const mapContainer = ref<HTMLDivElement | null>(null)
const drawingManager = ref<any>(null)
const drawnPolygons = ref<any[]>([])
const isEditMode = ref(false)
const editingSettlementId = ref<number | null>(null)

// Step 3: Form Drawer
const drawerVisible = ref(false)
const formRef = ref<FormInstance>()
const settlementForm = reactive({
  name: '',
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  settlement_type: '',
  population: '',
  area: '',
  description: null,
  geom: null,
  id: '',
  dist_trunk: null,
  dist_town: null,
  parcel_no: null,
  parcel_owner: null,
  rim_no: null,
  isApproved: 'Pending',
  isActive: true,
  code: '',
  surveyed: null,
  land_status: null,
  parcel_owner_type: null,
  pop_density: null,
  landuse: null,
  near_river: null,
  on_wayleave: null,
  on_road_reserve: null,
  structure_types: [],
  development: [],
  typical_building_materials: [],
  avg_dist_between: null,
  electricity_availability: null,
  piped_water_availability: null,
  encumbrance: null,
  num_households: null,
  avg_household_size: null,
  median_household_income: null,
  plot_ownership_ratio: null,
  plot_tenant_ratio: null,
  avg_rent: null,
  main_env_hazards: null,
  general_location: null,
  comments: null
})

const formRules = reactive({
  name: [{ required: true, message: 'Settlement name is required', trigger: 'blur' }],
  county_id: [{ required: true, message: 'County is required', trigger: 'blur' }],
  ward_id: [{ required: true, message: 'Ward is required', trigger: 'blur' }],
  settlement_type: [{ required: true, message: 'Settlement type is required', trigger: 'change' }]
})

// Settlement type options
const settlementTypeOptions = [
  { label: 'Slum', value: 'slum' },
  { label: 'Informal Settlement', value: 'Informal Settlement' }
]

// Yes/No options
const yesNoOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' }
]

const yesNoUnknownOptions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Unknown', value: 'Unknown' }
]

const parcelOwnershipOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Community', value: 'community' }
]

const landStatusOptions = [
  { label: 'Registered', value: 'registered' },
  { label: 'Unregistered', value: 'unregistered' },
  { label: 'Disputed', value: 'disputed' }
]

const parcelOwnerTypeOptions = [
  { label: 'Individual', value: 'individual' },
  { label: 'Government', value: 'government' },
  { label: 'Community', value: 'community' },
  { label: 'Corporate', value: 'corporate' }
]

const structureTypesOptions = [
  { label: 'Temporary', value: 'temporary' },
  { label: 'Semi Permanent', value: 'semi_permanent' },
  { label: 'Permanent', value: 'permanent' }
]

const levelDevtOptions = [
  { label: 'Single Storey', value: 'singleStorey' },
  { label: 'Multi Storey', value: 'multiStorey' }
]

const buildingMaterialsOptions = [
  { label: 'Mud', value: 'mud' },
  { label: 'Timber', value: 'timber' },
  { label: 'Iron Sheet', value: 'iron_sheet' },
  { label: 'Blocks/Stone', value: 'blocks_stone' }
]

// Handle county selection
const handleCountyChange = async (countyId: any) => {
  selectedWard.value = null
  filteredWards.value = []
  
  if (!countyId) return

  // Enforce county restriction
  if (isCountyRestricted.value && userCountyId.value && countyId !== userCountyId.value) {
    ElMessage.error('You can only select settlements in your assigned county')
    selectedCounty.value = userCountyId.value
    return
  }

  try {
    // Fetch wards for this county from API
    const res = await getListWithoutGeo({
      params: {
        pageIndex: 1,
        limit: 1000, // Get all wards for the county
        curUser: 1,
        model: 'ward',
        searchField: 'county_id',
        searchKeyword: countyId,
        sort: 'ASC'
      }
    })
    
    const ret = res.data || []
    filteredWards.value = ret.map((item: any) => ({
      value: item.id,
      label: item.name,
      county_id: item.county_id,
      subcounty_id: item.subcounty_id
    }))
    
    if (filteredWards.value.length === 0) {
      ElMessage.warning('No wards found for this county')
    }
  } catch (error) {
    console.error('Error fetching wards:', error)
    ElMessage.error('Failed to load wards for this county')
  }
}

// Handle ward selection and proceed to map
const handleWardChange = async (wardId: any) => {
  if (!wardId) return

  // Get ward geometry
  try {
    const formData = {
      model: 'ward',
      id: wardId
    }
    const res = await getOneGeo(formData)

    if (res.data[0]?.json_build_object?.features) {
      const feature = res.data[0].json_build_object.features[0]
      const geometryType = feature.geometry?.type

      if (geometryType === 'Point' || geometryType === 'MultiPoint') {
        ElMessage.error('This ward has point geometry. Please select a ward with boundary geometry (Polygon).')
        return
      }

      wardGeo.value = res.data[0].json_build_object
      
      // Update form with selected values
      const ward = filteredWards.value.find((w: any) => w.value === wardId) || 
                   (wardOptions.value || []).find((w: any) => w.value === wardId)
      if (ward) {
        settlementForm.ward_id = wardId
        settlementForm.county_id = selectedCounty.value
        // Set subcounty_id from ward data
        if (ward.subcounty_id) {
          settlementForm.subcounty_id = ward.subcounty_id
        } else {
          // Fallback: find subcounty from subcountyOptions if not in ward data
          const subcounty = (subcountyOptions.value || []).find((sc: any) => {
            // Try to find by matching subcounty that belongs to this county
            return sc.county_id === selectedCounty.value
          })
          if (subcounty) {
            settlementForm.subcounty_id = subcounty.value
          }
        }
      }

      // Move to step 2: Map
      currentStep.value = 1
      await nextTick()
      await initializeMap()
    } else {
      ElMessage.error('Ward has no boundary geometry')
    }
  } catch (error) {
    console.error('Error loading ward geometry:', error)
    ElMessage.error('Failed to load ward boundary')
  }
}

// Initialize Google Maps with ward boundary (for new) or settlement boundary (for edit)
const initializeMap = async () => {
  if (!mapContainer.value) return

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

    // Get bounds or default center
    let center = { lat: 1.137451, lng: 37.137343 }
    let zoom = 8

    if (isEditMode.value && settlementGeometry.value) {
      // For edit mode, use settlement geometry
      const bounds = turf.bbox(settlementGeometry.value)
      center = {
        lat: (bounds[1] + bounds[3]) / 2,
        lng: (bounds[0] + bounds[2]) / 2
      }
      zoom = 15
    } else if (wardGeo.value) {
      // For new mode, use ward geometry
      const bounds = turf.bbox(wardGeo.value)
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

    // Add ward boundary (for new records) or settlement boundary (for edit)
    if (isEditMode.value && settlementGeometry.value) {
      // Load existing settlement boundary
      loadSettlementBoundary()
    } else if (wardGeo.value) {
      // Load ward boundary as guide
      loadWardBoundary()
    }

    // Initialize drawing manager
    if (window.google.maps.drawing) {
      drawingManager.value = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [window.google.maps.drawing.OverlayType.POLYGON]
        },
        polygonOptions: {
          fillColor: '#FF0000',
          fillOpacity: 0.2,
          strokeWeight: 2,
          strokeColor: '#FF0000',
          clickable: true,
          editable: true,
          draggable: false,
          zIndex: 1
        }
      })

      drawingManager.value.setMap(map.value)
      
      // Add delete button to drawing controls container after a delay to ensure controls are rendered
      // Use multiple attempts to ensure button is added
      setTimeout(() => {
        addDeleteControl()
      }, 300)
      
      // Also try after map is fully idle
      window.google.maps.event.addListenerOnce(map.value, 'idle', () => {
        setTimeout(() => {
          // Check if button already exists, if not add it
          const existingDeleteBtn = document.querySelector('button[title*="Delete drawn settlement boundary"]')
          if (!existingDeleteBtn) {
            addDeleteControl()
          }
        }, 500)
      })

      // Listen for polygon completion
      window.google.maps.event.addListener(drawingManager.value, 'polygoncomplete', (polygon: any) => {
        // Check if polygon is within ward boundary (for new records)
        if (!isEditMode.value && wardPolygon.value) {
          const isWithin = checkPolygonWithinWard(polygon)
          if (!isWithin) {
            polygon.setMap(null)
            ElMessage.error('Settlement must be drawn within the ward boundary!')
            return
          }
        }

        // Remove previous polygons
        drawnPolygons.value.forEach(p => p.setMap(null))
        drawnPolygons.value = []

        drawnPolygons.value.push(polygon)
        
        // Make polygon editable
        polygon.setEditable(true)
        
        // Convert to GeoJSON
        const paths = polygon.getPath()
        const coordinates: number[][] = []
        
        paths.forEach((latLng: any) => {
          coordinates.push([latLng.lng(), latLng.lat()])
        })

        // Close the polygon
        if (coordinates.length > 0) {
          const firstCoord = coordinates[0]
          if (coordinates[coordinates.length - 1][0] !== firstCoord[0] || 
              coordinates[coordinates.length - 1][1] !== firstCoord[1]) {
            coordinates.push([firstCoord[0], firstCoord[1]])
          }
        }

        const geom = {
          type: 'Polygon',
          coordinates: [coordinates]
        }

        settlementGeometry.value = geom
        settlementForm.geom = geom

        // Calculate area
        try {
          const areaSquareMeters = turf.area(geom)
          const areaHectares = areaSquareMeters / 10000
          settlementForm.area = parseFloat(areaHectares.toFixed(4))
        } catch (error) {
          console.error('Error calculating area:', error)
        }

        // Listen for geometry changes
        polygon.getPath().addListener('set_at', () => updatePolygonGeometry(polygon))
        polygon.getPath().addListener('insert_at', () => updatePolygonGeometry(polygon))
        polygon.getPath().addListener('remove_at', () => updatePolygonGeometry(polygon))

        ElMessage.success('Settlement boundary drawn successfully!')
        
        // Update delete button state
        updateDeleteButtonState()
        
        // Open drawer
        drawerVisible.value = true
      })
    }
  } catch (error: any) {
    console.error('Error initializing Google Maps:', error)
    ElMessage.error('Failed to load map')
  }
}

const loadWardBoundary = () => {
  if (!map.value || !wardGeo.value) return

  try {
    const features = wardGeo.value.features
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

        wardPolygon.value = new window.google.maps.Polygon({
          paths: paths,
          strokeColor: '#3388ff',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          fillColor: '#3388ff',
          fillOpacity: 0.1,
          map: map.value,
          clickable: false,
          draggable: false
        })

        // Fit map to ward bounds
        const bounds = new window.google.maps.LatLngBounds()
        paths.forEach((path: any) => {
          bounds.extend(path)
        })
        map.value.fitBounds(bounds)
      }
    }
  } catch (error) {
    console.error('Error loading ward boundary:', error)
  }
}

const loadSettlementBoundary = () => {
  if (!map.value || !settlementGeometry.value) return

  try {
    const geom = settlementGeometry.value
    if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      const paths = geom.type === 'Polygon'
        ? geom.coordinates[0].map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          }))
        : geom.coordinates[0][0].map((coord: number[]) => ({
            lat: coord[1],
            lng: coord[0]
          }))

      settlementPolygon.value = new window.google.maps.Polygon({
        paths: paths,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        fillColor: '#FF0000',
        fillOpacity: 0.2,
        map: map.value,
        clickable: true,
        editable: true,
        draggable: false
      })

      // Fit map to settlement bounds
      const bounds = new window.google.maps.LatLngBounds()
      paths.forEach((path: any) => {
        bounds.extend(path)
      })
      map.value.fitBounds(bounds)

      // Listen for geometry changes
      settlementPolygon.value.getPath().addListener('set_at', () => updatePolygonGeometry(settlementPolygon.value))
      settlementPolygon.value.getPath().addListener('insert_at', () => updatePolygonGeometry(settlementPolygon.value))
      settlementPolygon.value.getPath().addListener('remove_at', () => updatePolygonGeometry(settlementPolygon.value))

      // Update delete button state
      updateDeleteButtonState()

      // Open drawer
      drawerVisible.value = true
    }
  } catch (error) {
    console.error('Error loading settlement boundary:', error)
  }
}

const checkPolygonWithinWard = (polygon: any): boolean => {
  if (!wardPolygon.value || !wardGeo.value) return true

  try {
    const paths = polygon.getPath()
    let allInside = true

    paths.forEach((latLng: any) => {
      const point = new window.google.maps.LatLng(latLng.lat(), latLng.lng())
      const isInside = window.google.maps.geometry.poly.containsLocation(
        point,
        wardPolygon.value
      )
      if (!isInside) {
        allInside = false
      }
    })

    return allInside
  } catch (error) {
    console.error('Error checking polygon within ward:', error)
    return true // Allow if check fails
  }
}

const updatePolygonGeometry = (polygon: any) => {
  if (!polygon) return

  try {
    const paths = polygon.getPath()
    const coordinates: number[][] = []
    
    paths.forEach((latLng: any) => {
      coordinates.push([latLng.lng(), latLng.lat()])
    })

    // Close the polygon
    if (coordinates.length > 0) {
      const firstCoord = coordinates[0]
      if (coordinates[coordinates.length - 1][0] !== firstCoord[0] || 
          coordinates[coordinates.length - 1][1] !== firstCoord[1]) {
        coordinates.push([firstCoord[0], firstCoord[1]])
      }
    }

    const geom = {
      type: 'Polygon',
      coordinates: [coordinates]
    }

    settlementGeometry.value = geom
    settlementForm.geom = geom

    // Calculate area
    try {
      const areaSquareMeters = turf.area(geom)
      const areaHectares = areaSquareMeters / 10000
      settlementForm.area = parseFloat(areaHectares.toFixed(4))
    } catch (error) {
      console.error('Error calculating area:', error)
    }
  } catch (error) {
    console.error('Error updating polygon geometry:', error)
  }
}

// Add custom delete control to map
const deleteControlDiv = ref<HTMLDivElement | null>(null)
const deleteButton = ref<HTMLButtonElement | null>(null)

const addDeleteControl = () => {
  if (!map.value) return

  // Find the drawing controls container
  const findDrawingControls = () => {
    // First check if delete button already exists somewhere - reuse its container
    const existingDeleteBtn = document.querySelector('button[data-delete-settlement-btn="true"]')
    if (existingDeleteBtn && existingDeleteBtn.parentElement) {
      return existingDeleteBtn.parentElement
    }
    
    // Google Maps drawing controls are in a div positioned at TOP_CENTER
    // They have buttons with specific structure
    const allControls = document.querySelectorAll('.gmnoprint')
    
    for (const control of allControls) {
      const buttons = control.querySelectorAll('button')
      if (buttons.length >= 1) {
        // Check if buttons have drawing control structure (pan and polygon buttons)
        // Drawing controls typically have buttons with specific titles or icons
        const buttonTitles = Array.from(buttons).map(btn => btn.getAttribute('title') || btn.innerHTML).join(' ').toLowerCase()
        
        // Look for pan and polygon indicators, or any button that looks like a drawing control
        if (buttonTitles.includes('pan') || buttonTitles.includes('polygon') || 
            buttonTitles.includes('draw') || buttonTitles.includes('hand') ||
            control.querySelector('div[style*="display: flex"]') ||
            control.querySelector('div[style*="display:inline"]')) {
          // Check if delete button already exists
          if (!control.querySelector('button[data-delete-settlement-btn="true"]') &&
              !control.querySelector('button[title*="Delete"]')) {
            return control
          }
        }
      }
    }
    
    // Alternative: look for divs at TOP_CENTER position that contain buttons
    const topCenterControls = Array.from(document.querySelectorAll('div')).filter(div => {
      const buttons = div.querySelectorAll('button')
      return buttons.length >= 1 && 
             (div.classList.contains('gmnoprint') || 
              div.parentElement?.classList.contains('gmnoprint'))
    })
    
    if (topCenterControls.length > 0) {
      const control = topCenterControls[0]
      if (!control.querySelector('button[data-delete-settlement-btn="true"]') &&
          !control.querySelector('button[title*="Delete"]')) {
        return control
      }
    }
    
    return null
  }

  // Try to find drawing controls, retry if not found immediately
  let drawingControlsContainer = findDrawingControls()
  if (!drawingControlsContainer) {
    // Try multiple times with increasing delays
    const tryAddButton = (attempt: number, maxAttempts = 5) => {
      setTimeout(() => {
        drawingControlsContainer = findDrawingControls()
        if (drawingControlsContainer) {
          addDeleteButtonToContainer(drawingControlsContainer)
        } else if (attempt < maxAttempts) {
          tryAddButton(attempt + 1, maxAttempts)
        } else {
          console.warn('Could not find drawing controls container after', maxAttempts, 'attempts')
        }
      }, attempt * 200) // Increasing delay: 200ms, 400ms, 600ms, etc.
    }
    tryAddButton(1)
    return
  }

  addDeleteButtonToContainer(drawingControlsContainer)
}

const addDeleteButtonToContainer = (container: Element) => {
  // Check if button already exists in this container
  const existingBtn = container.querySelector('button[title*="Delete drawn settlement boundary"]')
  if (existingBtn) {
    deleteButton.value = existingBtn as HTMLButtonElement
    updateDeleteButtonState()
    return
  }
  
  // Create delete button that matches Google Maps drawing controls style
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.style.cssText = `
    background-color: #fff;
    border: 1px solid #ccc;
    border-radius: 2px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    transition: background-color 0.2s, opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin-left: 2px;
  `
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="#666"/>
    </svg>
  `
  btn.title = 'Delete drawn settlement boundary'
  btn.setAttribute('data-delete-settlement-btn', 'true') // Add identifier
  deleteButton.value = btn
  
  // Hover effect
  btn.onmouseenter = () => {
    if (!btn.disabled) {
      btn.style.backgroundColor = '#f5f5f5'
      btn.style.borderColor = '#999'
    }
  }
  btn.onmouseleave = () => {
    if (!btn.disabled) {
      btn.style.backgroundColor = '#fff'
      btn.style.borderColor = '#ccc'
    }
  }
  
  // Click handler
  btn.onclick = () => {
    deleteDrawnShape()
  }
  
  // Update button state
  updateDeleteButtonState()
  
  // Append to the drawing controls container
  container.appendChild(btn)
  deleteControlDiv.value = container as HTMLDivElement
}

// Update delete button enabled/disabled state
const updateDeleteButtonState = () => {
  if (!deleteButton.value) return
  
  const hasShape = drawnPolygons.value.length > 0 || settlementPolygon.value !== null
  
  if (hasShape) {
    deleteButton.value.disabled = false
    deleteButton.value.style.opacity = '1'
    deleteButton.value.style.cursor = 'pointer'
    // Update icon color to red when enabled
    const svg = deleteButton.value.querySelector('svg path')
    if (svg) {
      svg.setAttribute('fill', '#dc3545')
    }
  } else {
    deleteButton.value.disabled = true
    deleteButton.value.style.opacity = '0.5'
    deleteButton.value.style.cursor = 'not-allowed'
    // Update icon color to gray when disabled
    const svg = deleteButton.value.querySelector('svg path')
    if (svg) {
      svg.setAttribute('fill', '#999')
    }
  }
}

// Delete drawn shape function
const deleteDrawnShape = () => {
  let hasDeleted = false
  
  // Delete drawn polygons
  if (drawnPolygons.value.length > 0) {
    drawnPolygons.value.forEach(p => {
      p.setMap(null)
    })
    drawnPolygons.value = []
    hasDeleted = true
  }
  
  // Delete settlement polygon (for edit mode)
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
    hasDeleted = true
  }
  
  // Clear geometry data
  if (hasDeleted) {
    settlementGeometry.value = null
    settlementForm.geom = null
    settlementForm.area = null
    drawerVisible.value = false
    ElMessage.success('Settlement boundary deleted')
    
    // Update delete button state
    updateDeleteButtonState()
  } else {
    ElMessage.info('No shape to delete')
  }
}

// Submit form
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      // Check if geometry exists
      if (!settlementForm.geom && !settlementGeometry.value) {
        ElMessage.error('Please draw the settlement boundary on the map')
        return
      }

      // Use settlementGeometry if form doesn't have it
      if (!settlementForm.geom && settlementGeometry.value) {
        settlementForm.geom = settlementGeometry.value
      }

      try {
        settlementForm.model = 'settlement'
        // component_id is optional, only set if route has domain param
        if (route.params.domain) {
          settlementForm.component_id = route.params.domain
        }

        // Convert array fields to comma-separated strings for backend
        const formDataToSubmit = {
          ...settlementForm,
          structure_types: Array.isArray(settlementForm.structure_types) 
            ? settlementForm.structure_types.join(',') 
            : settlementForm.structure_types || '',
          development: Array.isArray(settlementForm.development) 
            ? settlementForm.development.join(',') 
            : settlementForm.development || '',
          typical_building_materials: Array.isArray(settlementForm.typical_building_materials) 
            ? settlementForm.typical_building_materials.join(',') 
            : settlementForm.typical_building_materials || ''
        }

        if (isEditMode.value && editingSettlementId.value) {
          // Update existing settlement
          const formData = {
            ...formDataToSubmit,
            id: editingSettlementId.value,
            model: 'settlement'
          }

          const res = await updateOneRecord(formData)
          
          if (res.code === '0000') {
            ElMessage.success('Settlement updated successfully')
            clearFormAndGeometry()
            
            // Redirect to settlement list after successful edit
            router.push({
              name: 'List'
            })
          } else {
            ElMessage.error('Failed to update settlement')
          }
        } else {
          // Create new settlement
          formDataToSubmit.isApproved = 'Pending'
          formDataToSubmit.createdBy = userInfo.id
          formDataToSubmit.code = shortid.generate()
          formDataToSubmit.checkFields = ['name', 'county_id']

          // Perform duplicate check
          try {
            await duplicatePreCheck(formDataToSubmit)
            
            const res = await CreateRecord(formDataToSubmit)
            
            if (res.code === '0000') {
              ElMessage.success('Settlement created successfully')
              clearFormAndGeometry()
            } else {
              ElMessage.error('Failed to create settlement')
            }
          } catch (error: any) {
            if (error.response?.data?.duplicates) {
              // Show duplicate warning dialog
              const duplicates = error.response.data.duplicates
              const duplicateMsg = duplicates.map((dup: any, idx: number) => 
                `${idx + 1}. ${Object.entries(dup).map(([k, v]) => `${k}: ${v || 'N/A'}`).join(', ')}`
              ).join('\n')
              
              ElMessageBox.confirm(
                `${error.response.data.message}\n\nDuplicates found:\n${duplicateMsg}`,
                'Warning',
                {
                  confirmButtonText: 'Proceed to Create',
                  cancelButtonText: 'Cancel',
                  type: 'warning',
                  dangerouslyUseHTMLString: false
                }
              ).then(() => {
                CreateRecord(formDataToSubmit).then(() => {
                  ElMessage.success('Settlement created successfully')
                  clearFormAndGeometry()
                }).catch((err) => {
                  console.error('Error creating record:', err)
                  ElMessage.error('Failed to create settlement')
                })
              }).catch(() => {
                // User cancelled
              })
            } else {
              throw error
            }
          }
        }
      } catch (error: any) {
        console.error('Error saving settlement:', error)
        ElMessage.error(error?.response?.data?.message || 'Failed to save settlement')
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
      if (wardPolygon.value) {
        wardPolygon.value.setMap(null)
        wardPolygon.value = null
      }
      if (settlementPolygon.value) {
        settlementPolygon.value.setMap(null)
        settlementPolygon.value = null
      }
      drawnPolygons.value.forEach(p => p.setMap(null))
      drawnPolygons.value = []
      if (drawingManager.value) {
        drawingManager.value.setMap(null)
        drawingManager.value = null
      }
      map.value = null
      wardGeo.value = null
      settlementGeometry.value = null
      settlementForm.geom = null
    }
  } else {
    router.back()
  }
}

// Close drawer
const closeDrawer = () => {
  drawerVisible.value = false
}

// Clear form and geometry
const clearFormAndGeometry = () => {
  // Reset form to initial values
  Object.assign(settlementForm, {
    name: '',
    county_id: '',
    subcounty_id: '',
    ward_id: '',
    settlement_type: '',
    population: '',
    area: '',
    description: null,
    geom: null,
    id: '',
    dist_trunk: null,
    dist_town: null,
    parcel_no: null,
    parcel_owner: null,
    rim_no: null,
    isApproved: 'Pending',
    isActive: true,
    code: '',
    surveyed: null,
    land_status: null,
    parcel_owner_type: null,
    pop_density: null,
    landuse: null,
    near_river: null,
    on_wayleave: null,
    on_road_reserve: null,
    structure_types: [],
    development: [],
    typical_building_materials: [],
    avg_dist_between: null,
    electricity_availability: null,
    piped_water_availability: null,
    encumbrance: null,
    num_households: null,
    avg_household_size: null,
    median_household_income: null,
    plot_ownership_ratio: null,
    plot_tenant_ratio: null,
    avg_rent: null,
    main_env_hazards: null,
    general_location: null,
    comments: null
  })
  
  // Clear geometry
  settlementGeometry.value = null
  
  // Remove polygons from map
  if (settlementPolygon.value) {
    settlementPolygon.value.setMap(null)
    settlementPolygon.value = null
  }
  drawnPolygons.value.forEach(p => p.setMap(null))
  drawnPolygons.value = []
  
  // Clear ward polygon
  if (wardPolygon.value) {
    wardPolygon.value.setMap(null)
    wardPolygon.value = null
  }
  
  // Close drawer
  drawerVisible.value = false
  
  // Reset to step 0
  currentStep.value = 0
  
  // Clear location selections
  selectedCounty.value = null
  selectedWard.value = null
  wardOptions.value = []
  wardGeo.value = null
  
  // Reset edit mode
  isEditMode.value = false
  editingSettlementId.value = null
  
  // Update delete button state
  updateDeleteButtonState()
  
  // Reset form validation
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// Handle file upload for geometry
const handleUploadGeo = async (uploadFile: any) => {
  const fileType = uploadFile.name.split('.').pop()?.toLowerCase()
  const rfile = uploadFile.raw
  
  if (!rfile) {
    ElMessage.error('File not found')
    return
  }
  
  let reader = new FileReader()
  
  if (fileType === 'geojson' || fileType === 'json') {
    reader.onload = (event: any) => readJsonFile(event)
    reader.readAsText(rfile)
  } else if (fileType === 'zip' || fileType === 'kml' || fileType === 'kmz') {
    readShapefile(rfile)
  } else {
    ElMessage.error('Only GeoJSON, KML, KMZ or zipped shapefiles are supported')
  }
}

const readJsonFile = (event: any) => {
  let str = event.target.result
  let json = JSON.parse(str)
  
  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"
  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null
  
  if (crsProp && crsProp.includes('EPSG')) {
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
  }
  
  // Handle different EPSG codes (same as AddX.vue)
  if (epsgCode == 21037) {
    sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs"
  } else if (epsgCode == 21097) {
    sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs"
  } else if (epsgCode == 21036) {
    sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs"
  } else if (epsgCode == 21096) {
    sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs"
  } else {
    sourceProj = "+proj=longlat +datum=WGS84 +no_defs"
  }
  
  proj4.defs("SOURCE_CRS", sourceProj)
  proj4.defs("WGS84", targetProj)
  
  if (json.features && json.features.length != 1) {
    ElMessage.warning('Please upload a file with only one feature. This one has ' + json.features.length + ' features')
    return
  }
  
  const geometry = json.features[0].geometry
  
  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
    ElMessage.error(`Geometry type "${geometry.type}" is not supported. Only Polygon or MultiPolygon geometries are accepted.`)
    return
  }
  
  // Transform coordinates
  if (geometry.type === "Polygon") {
    geometry.coordinates[0] = geometry.coordinates[0].map((coordinate: number[]) => {
      return proj4("SOURCE_CRS", "WGS84", coordinate)
    })
  } else if (geometry.type === "MultiPolygon") {
    geometry.coordinates.forEach((polygon: number[][][]) => {
      polygon[0] = polygon[0].map((coordinate: number[]) => {
        return proj4("SOURCE_CRS", "WGS84", coordinate)
      })
    })
  }
  
  let geom = {
    type: geometry.type,
    coordinates: geometry.coordinates
  }
  
  settlementGeometry.value = geom
  settlementForm.geom = geom
  
  // Calculate area
  try {
    const areaSquareMeters = turf.area(geom)
    const areaHectares = areaSquareMeters / 10000
    settlementForm.area = parseFloat(areaHectares.toFixed(4))
  } catch (error) {
    console.error('Error calculating area:', error)
  }
  
  // Update map
  if (map.value) {
    // Remove existing polygons
    if (settlementPolygon.value) {
      settlementPolygon.value.setMap(null)
    }
    drawnPolygons.value.forEach(p => p.setMap(null))
    drawnPolygons.value = []
    
    // Load new geometry
    loadSettlementBoundary()
    
    // Update delete button state
    updateDeleteButtonState()
  }
}

const readShapefile = async (file: File) => {
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {
      if (geojson.length != 1) {
        ElMessage.warning('Please upload a file with only one feature. This one has ' + geojson.length + ' features')
        return
      }
      
      const geometryType = geojson[0].geometry.type
      
      if (geometryType !== 'Polygon' && geometryType !== 'MultiPolygon') {
        ElMessage.error(`Geometry type "${geometryType}" is not supported. Only Polygon or MultiPolygon geometries are accepted.`)
        return
      }
      
      let geomX = {
        type: geometryType,
        coordinates: geojson[0].geometry.coordinates,
      }
      
      settlementGeometry.value = geomX
      settlementForm.geom = geomX
      
      // Calculate area
      try {
        const areaSquareMeters = turf.area(geomX)
        const areaHectares = areaSquareMeters / 10000
        settlementForm.area = parseFloat(areaHectares.toFixed(4))
      } catch (error) {
        console.error('Error calculating area:', error)
      }
      
      // Update map
      if (map.value) {
        if (settlementPolygon.value) {
          settlementPolygon.value.setMap(null)
        }
        drawnPolygons.value.forEach(p => p.setMap(null))
        drawnPolygons.value = []
        loadSettlementBoundary()
        
        // Update delete button state
        updateDeleteButtonState()
      }
    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid files. Check your zipped file to contain (.shp, .dbf and .prj) or a proper kml/kmz')
    })
}

const showUploadDialog = ref(false)
const fileList = ref([])

// Initialize on mount
onMounted(async () => {
  // Check if editing (route has id)
  const settlementId = route.query.id
  
  if (settlementId) {
    isEditMode.value = true
    editingSettlementId.value = Number(settlementId)
    
    try {
      const form = {
        model: 'settlement',
        id: String(settlementId)
      }
      
      const res = await getOneSettlement(form as any)
      const curData = res.data
      
      // Populate form
      Object.assign(settlementForm, curData)
      
      // Convert comma-separated strings back to arrays for checkbox groups
      if (curData.structure_types && typeof curData.structure_types === 'string') {
        settlementForm.structure_types = curData.structure_types.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      } else if (!curData.structure_types) {
        settlementForm.structure_types = []
      }
      
      if (curData.development && typeof curData.development === 'string') {
        settlementForm.development = curData.development.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      } else if (!curData.development) {
        settlementForm.development = []
      }
      
      if (curData.typical_building_materials && typeof curData.typical_building_materials === 'string') {
        settlementForm.typical_building_materials = curData.typical_building_materials.split(',').map((s: string) => s.trim()).filter((s: string) => s)
      } else if (!curData.typical_building_materials) {
        settlementForm.typical_building_materials = []
      }
      
      // Set location
      selectedCounty.value = curData.county_id
      await handleCountyChange(curData.county_id)
      selectedWard.value = curData.ward_id
      
      // Load settlement geometry
      if (curData.geom) {
        settlementGeometry.value = curData.geom
        settlementForm.geom = curData.geom
        
        // Calculate area
        try {
          const areaSquareMeters = turf.area(curData.geom)
          const areaHectares = areaSquareMeters / 10000
          settlementForm.area = parseFloat(areaHectares.toFixed(4))
        } catch (error) {
          console.error('Error calculating area:', error)
        }
      }
      
      // Get ward geometry for context
      if (curData.ward_id) {
        const wardForm = {
          model: 'ward',
          id: String(curData.ward_id)
        }
        const wardRes = await getOneGeo(wardForm)
        if (wardRes.data[0]?.json_build_object?.features) {
          wardGeo.value = wardRes.data[0].json_build_object
        }
      }
      
      // Move directly to map step
      currentStep.value = 1
      await nextTick()
      await initializeMap()
    } catch (error) {
      console.error('Error loading settlement:', error)
      ElMessage.error('Failed to load settlement data')
    }
  } else {
    // New settlement - check if county is pre-selected from route
    const routeCountyId = route.query.county_id
    if (routeCountyId) {
      selectedCounty.value = Array.isArray(routeCountyId) ? routeCountyId[0] : routeCountyId
      await handleCountyChange(selectedCounty.value)
    } else if (isCountyRestricted.value && userCountyId.value) {
      selectedCounty.value = userCountyId.value
      await handleCountyChange(userCountyId.value)
    }
  }
})
</script>

<template>
  <div class="add-settlement-container">
    <el-card>
      <!-- Header -->
      <template #header>
        <div class="header-content">
          <el-button :icon="ArrowLeft" @click="goBack" text size="small">Back</el-button>
          <h2 class="header-title">{{ isEditMode ? 'Edit Settlement' : 'Add New Settlement' }}</h2>
          <div class="header-actions">
            <el-button 
              v-if="currentStep === 1" 
              type="primary" 
              :icon="UploadFilled" 
              @click="showUploadDialog = true" 
              size="small"
            >
              Upload GeoJSON/Shapefile
            </el-button>
          </div>
        </div>
      </template>

      <!-- Step 1: Location Selection - County and Ward -->
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
                  :disabled="isCountyRestricted"
                  @change="handleCountyChange"
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
              <el-form-item label="Ward" required>
                <el-select
                  v-model="selectedWard"
                  placeholder="Select Ward"
                  filterable
                  clearable
                  :disabled="!selectedCounty"
                  @change="handleWardChange"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in filteredWards"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- Step 2: Map with Drawing Tools -->
      <div v-if="currentStep === 1" class="step-content map-step">
        <div ref="mapContainer" class="map-container"></div>
      </div>
    </el-card>

    <!-- Step 3: Form Drawer (opens after drawing polygon or clicking existing polygon) -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEditMode ? 'Edit Settlement Details' : 'New Settlement Details'"
      :size="isMobile ? '100%' : '600px'"
      direction="rtl"
      :before-close="closeDrawer"
    >
      <el-form
        ref="formRef"
        :model="settlementForm"
        :rules="formRules"
        label-width="180px"
        label-position="left"
      >
        <el-divider content-position="left">Basic Information</el-divider>

        <el-form-item label="Settlement Name" prop="name">
          <el-input v-model="settlementForm.name" placeholder="Enter settlement name" />
        </el-form-item>

        <el-form-item label="Settlement Type" prop="settlement_type">
          <el-select v-model="settlementForm.settlement_type" placeholder="Select settlement type" filterable style="width: 100%">
            <el-option
              v-for="item in settlementTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Area (Hectares)">
          <el-input-number v-model="settlementForm.area" :min="0" :precision="4" style="width: 100%" :disabled="true" />
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            Area is automatically calculated from the drawn boundary
          </div>
        </el-form-item>

        <el-form-item label="Population">
          <el-input-number v-model="settlementForm.population" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Description">
          <el-input v-model="settlementForm.description" type="textarea" :rows="3" placeholder="Enter description" />
        </el-form-item>

        <el-divider content-position="left">Parcel Information</el-divider>

        <el-form-item label="Parcel Number">
          <el-input v-model="settlementForm.parcel_no" placeholder="Enter parcel number" />
        </el-form-item>

        <el-form-item label="Parcel Owner">
          <el-select v-model="settlementForm.parcel_owner" placeholder="Select parcel owner" filterable style="width: 100%">
            <el-option
              v-for="item in parcelOwnershipOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="RIM/Survey Plan">
          <el-input v-model="settlementForm.rim_no" placeholder="Enter RIM/Survey Plan number" />
        </el-form-item>

        <el-form-item label="Is Parcel Surveyed?">
          <el-select v-model="settlementForm.surveyed" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoUnknownOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Land Status">
          <el-select v-model="settlementForm.land_status" placeholder="Select land status" filterable style="width: 100%">
            <el-option
              v-for="item in landStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Parcel Owner Type">
          <el-select v-model="settlementForm.parcel_owner_type" placeholder="Select parcel owner type" filterable style="width: 100%">
            <el-option
              v-for="item in parcelOwnerTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">Physical Characteristics</el-divider>

        <el-form-item label="Population Density">
          <el-input-number v-model="settlementForm.pop_density" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Pre-Dominant Landuse">
          <el-input v-model="settlementForm.landuse" placeholder="Enter landuse" />
        </el-form-item>

        <el-form-item label="Near River?">
          <el-select v-model="settlementForm.near_river" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="On Utility Way-leave?">
          <el-select v-model="settlementForm.on_wayleave" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="On Road Reserve?">
          <el-select v-model="settlementForm.on_road_reserve" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Types of Structures">
          <el-checkbox-group v-model="settlementForm.structure_types">
            <el-checkbox
              v-for="item in structureTypesOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="Level of Development">
          <el-checkbox-group v-model="settlementForm.development">
            <el-checkbox
              v-for="item in levelDevtOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="Typical Building Materials">
          <el-checkbox-group v-model="settlementForm.typical_building_materials">
            <el-checkbox
              v-for="item in buildingMaterialsOptions"
              :key="item.value"
              :label="item.value"
            >
              {{ item.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="Distance Between Structures (M)">
          <el-input-number v-model="settlementForm.avg_dist_between" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Distance to Urban Center (Km)">
          <el-input-number v-model="settlementForm.dist_town" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Distance to Trunk Road (Km)">
          <el-input-number v-model="settlementForm.dist_trunk" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Electricity Availability">
          <el-select v-model="settlementForm.electricity_availability" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Piped Water Availability">
          <el-select v-model="settlementForm.piped_water_availability" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">Socio-Economic Information</el-divider>

        <el-form-item label="Court Cases/Claims?">
          <el-select v-model="settlementForm.encumbrance" placeholder="Select" filterable style="width: 100%">
            <el-option
              v-for="item in yesNoUnknownOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Number of Households">
          <el-input-number v-model="settlementForm.num_households" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Average Household Size">
          <el-input-number v-model="settlementForm.avg_household_size" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Median Household Income">
          <el-input-number v-model="settlementForm.median_household_income" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Plot Ownership Ratio">
          <el-input-number v-model="settlementForm.plot_ownership_ratio" :min="0" :max="1" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Plot Tenant Ratio">
          <el-input-number v-model="settlementForm.plot_tenant_ratio" :min="0" :max="1" :precision="2" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Average Rent">
          <el-input-number v-model="settlementForm.avg_rent" :min="0" style="width: 100%" />
        </el-form-item>

        <el-form-item label="Main Environmental Hazards">
          <el-input v-model="settlementForm.main_env_hazards" type="textarea" :rows="3" placeholder="Enter environmental hazards" />
        </el-form-item>

        <el-form-item label="General Location">
          <el-input v-model="settlementForm.general_location" placeholder="Enter general location" />
        </el-form-item>

        <el-form-item label="Comments/Remarks">
          <el-input v-model="settlementForm.comments" type="textarea" :rows="3" placeholder="Enter comments" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="closeDrawer">Cancel</el-button>
          <el-button type="primary" @click="submitForm" :icon="Check">
            {{ isEditMode ? 'Update Settlement' : 'Save Settlement' }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <!-- Upload Dialog -->
    <el-dialog 
      v-model="showUploadDialog" 
      title="Upload GeoJSON/Shapefile/KML/KMZ" 
      width="400px">
      <el-upload
        v-model:file-list="fileList"
        class="upload-demo"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
        :auto-upload="false"
        :show-file-list="true"
        :on-change="handleUploadGeo"
        :limit="1">
        <template #trigger>
          <el-button type="primary">
            <el-icon><UploadFilled /></el-icon>
            Select File
          </el-button>
        </template>
        <template #tip>
          <div class="el-upload__tip">
            Supported formats: GeoJSON (.geojson, .json), Shapefile (.zip), KML (.kml), KMZ (.kmz)
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false">Close</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.add-settlement-container {
  padding: 8px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Reduce el-card header padding */
:deep(.el-card__header) {
  padding: 12px 16px;
}

.step-content {
  padding: 12px 0;
  min-height: 400px;
}

.map-step {
  position: relative;
  padding: 0;
  margin: 0;
}

/* Card body padding */
:deep(.el-card__body) {
  padding: 16px;
}

/* When map step is active, set body padding to 8px */
.add-settlement-container:has(.map-step) :deep(.el-card__body) {
  padding: 8px;
}

.map-container {
  width: 100%;
  height: calc(67vh);
  min-height: 60vh;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .add-settlement-container {
    padding: 6px;
  }

  .header-title {
    font-size: 14px;
  }

  :deep(.el-card__header) {
    padding: 8px 12px;
  }

  .map-container {
    height: calc(67vh);
    min-height: 60vh;
  }

  .step-content {
    padding: 8px 0;
    min-height: 300px;
  }
}
</style>
