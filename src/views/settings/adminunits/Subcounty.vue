<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { ElButton, ElMessage, ElUpload, ElDialog, ElForm, ElFormItem, ElInput, ElSelect, ElOption, ElTable, ElTableColumn } from 'element-plus'
import { Edit, Upload, Plus, Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted, computed } from 'vue'
import { ElPagination } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { getSubcountiesApi, getSubcountyByIdApi, updateSubcountyApi, createSubcountyApi, type Subcounty } from '@/api/adminunits'
import { getCountyListApi } from '@/api/counties'
import * as turf from '@turf/turf'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'


const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
const loading = ref(false)
const tableData = ref<Subcounty[]>([])
const filteredData = ref<Subcounty[]>([])
const displayedData = ref<Subcounty[]>([])
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)
const countyOptions = ref<any[]>([])
const selectedCountyFilter = ref<number | null>(null)
const searchKeyword = ref('')

const editDialogVisible = ref(false)
const isEditMode = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive({
  id: null as number | null,
  name: '',
  code: '',
  county_id: null as number | null
})

const geometryData = ref<any>(null) // Store geometry separately to avoid Vue reactivity issues
const processingGeo = ref(false) // Disable submit while processing GeoJSON
const uploadRef = ref()

const paginationLayout = computed(() =>
  isMobile.value ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'
)

const tableRowIndex = (index: number) => (currentPage.value - 1) * pageSize.value + index + 1

const formatAreaKm2 = (row: Subcounty) =>
  row.area_km2 != null && row.area_km2 !== '' ? Number(row.area_km2).toFixed(2) : 'N/A'

const fetchSubcounties = async () => {
  loading.value = true
  try {
    const response = await getSubcountiesApi()
    tableData.value = response.data || []
    applyFilters()
  } catch (error) {
    console.error('Error fetching subcounties:', error)
    ElMessage.error('Failed to fetch subcounties')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  // Start with all data
  filteredData.value = tableData.value

  // Filter by county if selected
  if (selectedCountyFilter.value !== null) {
    filteredData.value = filteredData.value.filter(
      (subcounty: Subcounty) => subcounty.county_id === selectedCountyFilter.value
    )
  }

  // Filter by search keyword
  if (searchKeyword.value && searchKeyword.value.trim() !== '') {
    const keyword = searchKeyword.value.trim().toLowerCase()
    filteredData.value = filteredData.value.filter(
      (subcounty: Subcounty) =>
        subcounty.name?.toLowerCase().includes(keyword) ||
        subcounty.code?.toLowerCase().includes(keyword) ||
        subcounty.county_name?.toLowerCase().includes(keyword)
    )
  }

  total.value = filteredData.value.length
  currentPage.value = 1
  applyPagination()
}

const applyPagination = () => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  displayedData.value = filteredData.value.slice(start, end)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  applyPagination()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  applyPagination()
}

const remoteSearch = (keyword: string) => {
  searchKeyword.value = keyword
  applyFilters()
}

const handleCountyFilterChange = () => {
  applyFilters()
}

const clearCountyFilter = () => {
  selectedCountyFilter.value = null
  applyFilters()
}

const downloadLoading = ref(false)

const subcountyFilteredDownloadFetcher = async () => [...filteredData.value]
const subcountyAllDownloadFetcher = async () => [...tableData.value]

const fetchCounties = async () => {
  try {
    const response = await getCountyListApi({
      params: {
        model: 'county',
        limit: 1000
      }
    })
    countyOptions.value = (response.data || []).map((c: any) => ({
      value: c.id,
      label: c.name
    }))
  } catch (error) {
    console.error('Error fetching counties:', error)
  }
}

const handleAdd = () => {
  isEditMode.value = false
  formData.id = null
  formData.name = ''
  formData.code = ''
  formData.county_id = null
  geometryData.value = null
  editDialogVisible.value = true
}

const handleEdit = async (row: Subcounty) => {
  try {
    isEditMode.value = true
    const response = await getSubcountyByIdApi(row.id)
    formData.id = response.data.id
    formData.name = response.data.name
    formData.code = response.data.code
    formData.county_id = response.data.county_id
    geometryData.value = null
    editDialogVisible.value = true
  } catch (error) {
    console.error('Error fetching subcounty:', error)
    ElMessage.error('Failed to fetch subcounty details')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      const payload: any = {
        name: formData.name,
        code: formData.code,
        county_id: formData.county_id
      }
      
      // Check if geometry exists and add it to payload
      console.log('geometryData.value before submit:', geometryData.value)
      
      if (geometryData.value && typeof geometryData.value === 'object' && geometryData.value.type && geometryData.value.coordinates) {
        payload.geom = JSON.parse(JSON.stringify(geometryData.value)) // Deep copy
        console.log('Adding geometry to payload:', payload.geom)
      } else {
        console.log('No valid geometry found. geometryData.value:', geometryData.value)
      }
      
      if (isEditMode.value && formData.id) {
        // Update existing
        updateSubcountyApi(formData.id, payload)
          .then(() => {
            ElMessage.success('Subcounty updated successfully')
            editDialogVisible.value = false
            fetchSubcounties()
          })
          .catch((error) => {
            console.error('Error updating subcounty:', error)
            ElMessage.error('Failed to update subcounty')
          })
      } else {
        // Create new
        createSubcountyApi(payload)
          .then(() => {
            ElMessage.success('Subcounty created successfully')
            editDialogVisible.value = false
            fetchSubcounties()
          })
          .catch((error) => {
            console.error('Error creating subcounty:', error)
            ElMessage.error('Failed to create subcounty')
          })
      }
    }
  })
}

const handleGeoFileChange = (uploadFile: any) => {
  console.log('=== GeoJSON File Change ===')
  console.log('Upload file object:', uploadFile)
  
  // Extract the actual File object - similar to DocumentsTagged.vue approach
  const file = uploadFile.raw || uploadFile.file
  console.log('Extracted file:', file)
  console.log('File name:', file?.name)
  console.log('File type:', file?.type)
  console.log('Is File instance:', file instanceof File)
  
  if (!file || !(file instanceof File)) {
    console.error('Invalid file object - not a File instance')
    ElMessage.error('Invalid file. Please select a valid GeoJSON file.')
    return false
  }
  
  // Validate file type
  const fileType = file.name.split('.').pop()?.toLowerCase()
  console.log('Detected file extension:', fileType)
  
  if (fileType !== 'geojson' && fileType !== 'json') {
    console.error('Unsupported file type:', fileType)
    ElMessage.error('Only GeoJSON (.geojson, .json) files are supported')
    return false
  }
  
  // Start processing
  processingGeo.value = true
  
  const reader = new FileReader()
  
  reader.onload = (e) => {
    console.log('FileReader onload event triggered')
    console.log('Event target:', e.target)
    console.log('Result type:', typeof e.target?.result)
    
    try {
      const fileContent = e.target?.result as string
      console.log('File content length:', fileContent?.length)
      console.log('File content preview (first 200 chars):', fileContent?.substring(0, 200))
      
      const json = JSON.parse(fileContent)
      console.log('JSON parsed successfully')
      console.log('JSON structure:', {
        type: json.type,
        featuresCount: json.features?.length,
        hasFeatures: !!json.features
      })
      
      if (!json.features || json.features.length === 0) {
        console.error('No features found in GeoJSON')
        ElMessage.error('GeoJSON file must contain at least one feature')
        processingGeo.value = false
        return
      }
      
      console.log('Number of features:', json.features.length)
      
      if (json.features.length > 1) {
        console.warn('Multiple features detected, using first one')
        ElMessage.warning('File contains multiple features. Using the first feature.')
      }
      
      const geometry = json.features[0].geometry
      console.log('Extracted geometry:', {
        type: geometry.type,
        hasCoordinates: !!geometry.coordinates,
        coordinatesLength: geometry.coordinates?.length,
        coordinatesPreview: geometry.coordinates?.slice(0, 2)
      })
      
      if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
        // Create a clean geometry object and store it in ref to avoid Vue reactivity issues
        const cleanGeometry = {
          type: geometry.type,
          coordinates: geometry.coordinates
        }
        
        console.log('Clean geometry object created:', cleanGeometry)
        console.log('Assigning to geometryData.value...')
        
        geometryData.value = cleanGeometry
        
        console.log('Geometry assigned. geometryData.value:', geometryData.value)
        console.log('geometryData.value type check:', typeof geometryData.value)
        console.log('geometryData.value.type:', geometryData.value?.type)
        console.log('geometryData.value.coordinates exists:', !!geometryData.value?.coordinates)
        
        // Calculate area
        const areaSqM = turf.area(geometry)
        const areaSqKm = areaSqM / 1000000
        console.log('Area calculated:', areaSqKm, 'km²')
        
        ElMessage.success(`Geometry loaded. Area: ${areaSqKm.toFixed(2)} km²`)
        console.log('=== GeoJSON Upload Completed Successfully ===')
        processingGeo.value = false
      } else {
        console.error('Invalid geometry type:', geometry.type)
        ElMessage.error('Geometry must be a Polygon or MultiPolygon')
        processingGeo.value = false
      }
    } catch (error) {
      console.error('=== Error parsing GeoJSON ===')
      console.error('Error object:', error)
      console.error('Error message:', error instanceof Error ? error.message : String(error))
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      ElMessage.error('Failed to parse GeoJSON file')
      processingGeo.value = false
    }
  }
  
  reader.onerror = (error) => {
    console.error('FileReader error:', error)
    ElMessage.error('Error reading file')
    processingGeo.value = false
  }
  
  console.log('Starting to read file as text...')
  reader.readAsText(file)
}

const handleClose = () => {
  formData.id = null
  formData.name = ''
  formData.code = ''
  formData.county_id = null
  geometryData.value = null
}

onMounted(() => {
  fetchCounties()
  fetchSubcounties()
})
</script>

<template>
  <ContentWrap title="Subcounties">
    <div class="admin-units-toolbar">
      <div class="admin-units-toolbar__filters">
        <el-select
          :model-value="selectedCountyFilter ?? undefined"
          @update:model-value="selectedCountyFilter = $event ?? null"
          placeholder="By County"
          clearable
          filterable
          class="admin-units-toolbar__filter"
          @change="handleCountyFilterChange"
          @clear="clearCountyFilter"
        >
          <el-option
            v-for="county in countyOptions"
            :key="county.value"
            :label="county.label"
            :value="county.value"
          />
        </el-select>

        <el-input
          v-model="searchKeyword"
          clearable
          placeholder="Search subcounties..."
          class="input-with-select admin-units-toolbar__search"
          @clear="remoteSearch('')"
          @input="remoteSearch"
          @change="remoteSearch(searchKeyword)"
        >
          <template #append>
            <el-button :icon="Search" @click="remoteSearch(searchKeyword)" />
          </template>
        </el-input>
      </div>

      <div class="admin-units-toolbar__actions">
        <DownloadCustom
          :data="filteredData"
          :full-data="tableData"
          model="subcounty"
          :associated_models="[]"
          :loading="downloadLoading"
          :total="total"
          :all-count="tableData.length"
          :filtered-data-fetcher="subcountyFilteredDownloadFetcher"
          :all-data-fetcher="subcountyAllDownloadFetcher"
          @download-start="downloadLoading = true"
          @download-end="downloadLoading = false"
        />
        <el-tooltip content="Add Subcounty" placement="top">
          <el-button type="primary" :icon="Plus" @click="handleAdd" />
        </el-tooltip>
      </div>
    </div>

    <el-table
      v-loading="loading"
      table-layout="fixed"
      :data="displayedData"
      :show-overflow-tooltip="true"
      fit
      border
      row-key="id"
      style="width: 100%; margin-top: 10px;"
      :default-sort="{ prop: 'name', order: 'ascending' }"
    >
      <el-table-column type="index" label="#" width="60" :index="tableRowIndex" />
      <el-table-column label="Name" prop="name" sortable min-width="160" />
      <el-table-column label="County" prop="county_name" sortable min-width="140" />
      <el-table-column label="Code" prop="code" sortable width="120" />
      <el-table-column label="Area (km²)" prop="area_km2" sortable width="140">
        <template #default="{ row }">
          {{ formatAreaKm2(row) }}
        </template>
      </el-table-column>
      <el-table-column label="Settlements" prop="settlements_count" sortable width="130" />
      <el-table-column label="Actions" width="90" fixed="right">
        <template #default="{ row }">
          <el-tooltip content="Edit" placement="top">
            <el-button type="primary" :icon="Edit" circle @click="handleEdit(row)" />
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <ElPagination
      :layout="paginationLayout"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 100, 5000, 10000]"
      :total="total"
      :background="true"
      class="mt-4 settlement-pagination"
      @current-change="handlePageChange"
      @size-change="handlePageSizeChange"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
    />

    <ElDialog
      v-model="editDialogVisible"
      :title="isEditMode ? 'Edit Subcounty' : 'Add Subcounty'"
      width="50%"
      @close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        label-width="120px"
      >
        <el-form-item label="Name" prop="name" :rules="[{ required: true, message: 'Name is required' }]">
          <el-input v-model="formData.name" />
        </el-form-item>
        
        <el-form-item label="Code" prop="code" :rules="[{ required: true, message: 'Code is required' }]">
          <el-input v-model="formData.code" />
        </el-form-item>
        
        <el-form-item label="County" prop="county_id" :rules="[{ required: true, message: 'County is required' }]">
          <el-select :model-value="formData.county_id ?? undefined" @update:model-value="formData.county_id = $event ?? null" placeholder="Select county" style="width: 100%" clearable>
            <el-option
              v-for="county in countyOptions"
              :key="county.value"
              :label="county.label"
              :value="county.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Geometry (GeoJSON)">
          <el-upload
            ref="uploadRef"
            action=""
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleGeoFileChange"
            accept=".geojson,.json"
          >
            <template #trigger>
              <el-button type="primary" :icon="Upload" :loading="processingGeo" :disabled="processingGeo">
                <template v-if="processingGeo">Processing...</template>
                <template v-else>Upload GeoJSON</template>
              </el-button>
            </template>
          </el-upload>
          <div v-if="geometryData" style="margin-top: 10px; color: green;">
            ✓ Geometry loaded
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false" :disabled="processingGeo">Cancel</el-button>
        <el-button type="primary" @click="handleSubmit" :disabled="processingGeo">
          <template v-if="processingGeo">Processing GeoJSON...</template>
          <template v-else>{{ isEditMode ? 'Update' : 'Create' }}</template>
        </el-button>
      </template>
    </ElDialog>
  </ContentWrap>
</template>

<style scoped>
.admin-units-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: nowrap;
  margin-bottom: 10px;
  overflow-x: auto;
}

.admin-units-toolbar__filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.admin-units-toolbar__search {
  width: 100%;
  max-width: 360px;
}

.admin-units-toolbar__filter {
  width: 180px;
  flex-shrink: 0;
}

.admin-units-toolbar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  :deep(.settlement-pagination) {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    row-gap: 8px;
  }
}
</style>

