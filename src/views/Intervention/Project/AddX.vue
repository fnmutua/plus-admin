<template>
  <div>
    <component
      :is="embedded ? 'div' : 'el-card'"
      :class="embedded ? 'project-form-embedded' : 'box-card'"
      v-loading="isLoading"
    >
      <div class="steps-wrapper">
        <el-steps :active="currentStep" finish-status="success" align-center class="project-form-steps">
          <el-step
            v-for="(step, index) in displaySteps"
            :key="index"
            :title="isMobile ? `Step ${index + 1}` : step.title"
            :description="embedded || isMobile ? '' : step.description"
            @click="handleStepClick(index)"
          />
        </el-steps>
      </div>
      <el-divider />
      <div class="button-container">
        <el-tooltip content="Help" placement="top">
          <el-button color="#626aef" type="info" @click="showTour" :icon="InfoFilled" plain />
        </el-tooltip>

        <div class="button-container-actions">
          <el-button v-if="currentStep > 0" type="primary" :icon="ArrowLeft" @click="prevStep">
            Previous
          </el-button>
          <el-button
            v-if="currentStep < totalSteps - 1"
            type="primary"
            class="step-btn-next"
            :icon="ArrowRight"
            @click="nextStep"
          >
            Next
          </el-button>
          <el-button v-else type="success" :icon="Check" @click="submitForm">
            Submit
          </el-button>
        </div>
      </div>
      <el-form
          :model="formData"
          :rules="currentStepRules"
          label-width="auto"
          ref="dynamicFormRef"
          label-position="top"
        >
          <div v-if="isLocationStep" id="location-step" class="location-step">
            <p class="location-step-hint">{{ locationStepHint }}</p>

            <el-alert
              v-if="isNationalScope"
              type="info"
              :closable="false"
              show-icon
              title="National implementation level"
              description="Location selection is not required for national projects."
              class="location-national-alert"
            />

            <template v-else>
              <el-input
                v-model="locationSearchKeyword"
                clearable
                placeholder="Type to search locations…"
                class="location-search-input"
                @input="onLocationSearchInput"
                @clear="searchLocations('')"
              />

              <div v-if="scopedSelectedLocations.length" class="selected-locations">
                <span class="selected-label">Selected ({{ scopedSelectedLocations.length }})</span>
                <div class="selected-tags">
                  <el-tag
                    v-for="loc in scopedSelectedLocations"
                    :key="loc.key"
                    closable
                    size="small"
                    @close="removeSelectedLocation(loc.key)"
                  >
                    {{ loc.label }}
                  </el-tag>
                </div>
              </div>

              <div v-loading="locationSearchLoading" class="location-results">
                <el-empty
                  v-if="!locationSearchLoading && displayLocationOptions.length === 0"
                  description="Search by name to find locations"
                  :image-size="64"
                />
                <el-checkbox-group v-else v-model="selectedLocationKeys" class="location-checkbox-group">
                  <div
                    v-for="item in displayLocationOptions"
                    :key="item.key"
                    class="location-option"
                  >
                    <el-checkbox :label="item.key">
                      <span class="location-name">{{ item.label }}</span>
                      <span v-if="item.detail" class="location-detail">{{ item.detail }}</span>
                    </el-checkbox>
                  </div>
                </el-checkbox-group>
              </div>
            </template>
          </div>

          <div v-else-if="isActivityStep" id="activity-step" class="location-step activity-step">
            <p class="location-step-hint">Select at least one activity implemented by this project.</p>
            <el-input
              v-model="activitySearchKeyword"
              clearable
              placeholder="Type to search activities…"
              class="location-search-input"
              @input="onActivitySearchInput"
              @clear="searchProjectActivities('')"
            />

            <div v-if="selectedActivityOptions.length" class="selected-locations">
              <span class="selected-label">Selected ({{ selectedActivityOptions.length }})</span>
              <div class="selected-tags">
                <el-tag
                  v-for="activity in selectedActivityOptions"
                  :key="activity.value"
                  closable
                  size="small"
                  @close="removeSelectedActivity(activity.value)"
                >
                  {{ activity.label }}
                </el-tag>
              </div>
            </div>

            <div v-loading="activitySearchLoading" class="location-results">
              <el-empty
                v-if="!activitySearchLoading && activityOptions.length === 0"
                description="Search by title to find activities"
                :image-size="64"
              />
              <el-checkbox-group
                v-else
                v-model="formData.activities"
                class="location-checkbox-group"
              >
                <div
                  v-for="activity in activityOptions"
                  :key="activity.value"
                  class="location-option"
                >
                  <el-checkbox :label="activity.value">
                    <span class="location-name">{{ activity.label }}</span>
                  </el-checkbox>
                </div>
              </el-checkbox-group>
            </div>
          </div>

          <div v-else-if="isProgrammeStep" id="programme-step" class="programme-component-step">
            <p class="programme-step-hint">
              Current assignment:
              <strong>{{ programmeLabel || 'Programme' }}</strong>
              <span v-if="component_title"> >> <strong>{{ component_title }}</strong></span>
            </p>
            <el-checkbox v-model="showProgrammeComponentEdit" class="programme-component-toggle">
              Change programme or component
            </el-checkbox>
            <div v-if="showProgrammeComponentEdit" class="programme-component-fields">
              <el-form-item label="Programme / Component" prop="component_id">
                <el-select
                  v-model="formData.component_id"
                  filterable
                  placeholder="Select programme and component"
                  style="width: 100%"
                  @change="onEditProgrammeComponentChange"
                >
                  <el-option
                    v-for="option in editProgrammeComponentOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </div>
            <el-alert
              v-else
              type="info"
              :closable="false"
              show-icon
              title="No changes"
              description="Leave unchecked to keep the current programme and component."
              class="programme-component-unchanged-alert"
            />
          </div>

          <el-row v-else :gutter="16">
            <el-col
              v-for="(field, index) in currentStepFields"
              :key="index"
              :span="24"
              :xs="24"
              :sm="24"
              :md="24"
              :lg="24"
              :xl="24"
            >
      <el-form-item :id="field.id" :prop="field.name" :label="field.label">
        <el-input
          v-if="field.type === 'text'"
          v-model="formData[field.name]"
          :placeholder="field.placeholder"
        />
        <el-input
          v-else-if="field.type === 'textarea'"
          type="textarea"
          v-model="formData[field.name]"
          :rows="field.name === 'description' ? 2 : 2"
          :placeholder="field.placeholder"
        />
        <el-input
          v-else-if="field.type === 'number' && field.name === 'cost'"
          v-model="costDisplay"
          inputmode="numeric"
          :placeholder="field.placeholder"
          class="project-cost-input"
        />
        <el-input-number
          v-else-if="field.type === 'number'"
          v-model="formData[field.name]"
          :controls="false"
          :min="field.min ?? 0"
          :max="field.max"
          :precision="0"
          :step="1"
          :placeholder="field.placeholder"
          class="project-cost-input"
          style="width: 100%"
          @change="getFieldChangeHandler(field.name)"
        />

        <el-date-picker
          v-else-if="field.type === 'date'"
          type="date"
          v-model="formData[field.name]"
          :placeholder="field.placeholder || 'Select date'"
          style="width: 100%"
        />

        <el-select
          v-else-if="field.type === 'select' && field.multiselect === 'false' && !field.adminUnit"
          v-model="formData[field.name]"
          :filterable="true"
          :allow-create="Boolean(field.allowCreate)"
          :default-first-option="Boolean(field.allowCreate)"
          collapse-tags
          :placeholder="field.placeholder || 'Select'"
          style="width: 100%"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-tree-select
          v-else-if="field.type === 'tree' && field.multiselect === 'false'"
          v-model="formData[field.name]"
          :data="field.options"
          :render-after-expand="true"
          node-key="value"
          value-key="value"
          :disabled="newRecord"
          :props="{ label: 'label', children: 'children', value: 'value' }"
          :placeholder="field.placeholder || 'Select'"
          style="width: 100%"
          @change="getFieldChangeHandler(field.name)"
        />

        <el-select
          v-else-if="field.type === 'select' && field.multiselect === 'true'"
          v-model="formData[field.name]"
          :filterable="true"
          multiple
          collapse-tags
          :placeholder="field.placeholder || 'Select'"
          style="width: 100%"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select
          v-else-if="field.type === 'select' && field.adminUnit && field.name === 'county_id'"
          v-model="formData[field.name]"
          :filterable="true"
          collapse-tags
          placeholder="County"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in countyOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select
          v-else-if="field.type === 'select' && field.adminUnit && field.name === 'subcounty_id'"
          v-model="formData[field.name]"
          :filterable="true"
          collapse-tags
          placeholder="Subcounty"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in subcountyOptionsFiltered"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select
          v-else-if="field.type === 'select' && field.adminUnit && field.name === 'ward_id'"
          v-model="formData[field.name]"
          :filterable="true"
          collapse-tags
          placeholder="Ward"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in wardOptionsFiltered"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select
          v-else-if="field.type === 'select' && field.adminUnit && field.name === 'settlement_id'"
          v-model="formData[field.name]"
          :filterable="true"
          collapse-tags
          placeholder="Settlement"
          @change="getFieldChangeHandler(field.name)"
        >
          <el-option
            v-for="option in settOptionsFiltered"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
    </el-col>
  </el-row>
        </el-form>

      <!-- <pre>{{ wardMessage}}</pre>  -->
      <!-- <div v-if="currentStep == totalSteps - 1" id="mapContainer" class="basemap"></div>
      <div v-if="currentStep == totalSteps - 1" id='coordinates' class='coordinates'></div> -->
    </component>

    <el-dialog v-model="showDialog" title="Select Location" width="70%">
      <el-row>
        <el-select v-model="county_id" class="m-2" @change="onSelectCounty" placeholder="Select" size="large">
          <el-option v-for="item in cascadeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

        <el-select v-model="subcounty_id" class="m-2" @change="onSelectSubcounty" placeholder="Select" size="large">
          <el-option
          v-for="item in subcountyOptionsFiltered" :key="item.value" :label="item.label"
                      :value="item.value" />
                  </el-select>

                  <el-select v-model="ward_id" class="m-2" placeholder="Select" @change="onSelectWard" size="large">
                    <el-option v-for="item in wardOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                  <el-select v-model="settlement_id" class="m-2" placeholder="Select" @change="onSelectSettlement" size="large">
                    <el-option v-for="item in settOptionsFiltered" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>

                </el-row>
                <template #footer>
                  <div class="dialog-footer">
                    <el-row justify="space-between">
                      <el-col :span="12">
                        <el-button @click="showDialog = false" style="float: left">Cancel</el-button>
                      </el-col>
                      <el-col :span="12">
                        <el-button type="primary" @click="setLocationOnMobile" style="float: right">
                          Confirm
                        </el-button>
                      </el-col>
                    </el-row>
                  </div>
                </template>
    </el-dialog>


    <el-dialog v-model="showUploadDialog" title="Upload a Zipped Shapefile/Geojson/KML/KMZ" width="30%">

      <el-upload
v-model:file-list="fileList" class="upload-demo"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :auto-upload="false"
        :show-file-list="false" :on-change="handleUploadGeo">
        <template #trigger>
          <el-button type="primary">
            <i class="el-icon-upload"></i> <!-- Prepend upload icon here -->
            {{ fileList.length > 0 ? fileList[0].name : 'Select File' }}
          </el-button>
        </template>
        <template #default>
          <span class="upload-filename" v-if="fileList.length > 0">{{ fileList[0].name }}</span>
        </template>
      </el-upload>


    </el-dialog>

  </div>

  <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
    <el-tour-step
v-for="(step, index) in filteredTourSteps" :key="index" :target="step.target" :title="step.title"
      :description="step.content" />
  </el-tour>
</template>


<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import { ElCard, ElTooltip, ElTour, ElTourStep, ElDialog, ElMessage, ElUpload,ElTreeSelect } from 'element-plus'
import { useRouter } from 'vue-router'

import { steps, formFields, formData, formRules, PROGRAMME_COMPONENT_STEP } from './common/fields.ts'
import { subcountyOptions, wardOptions, implementationOptions, setImplementationOptionsForProgramme, formatProgrammeSelectLabel, formatComponentSelectLabel, formatProgrammeComponentSelectLabel } from './common/index.ts'
import { getProgrammePathLabels } from '@/utils/programmeComponentTree'
import shortid from 'shortid';

import { useRoute } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'

import mapboxgl from "mapbox-gl";
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { MapboxLayerDefinition } from "mapbox-layer-switcher";
import {
  CreateRecord,
  updateOneRecord,
  getOneGeo,
  getOneSettlement,
  searchByKeyWord,
  BatchImportUpsert,
  DeleteRecord,
  getSettlementListByCounty,
} from '@/api/settlements'

import "mapbox-layer-switcher/styles.css";
import * as turf from '@turf/turf'
import {
  ElButton,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElDatePicker,
  ElSteps,
  ElStep, ElRow, ElCol,
  ElSelect,
  ElOption,
  ElCheckbox,
  ElCheckboxGroup,
  ElTag,
  ElEmpty,
  ElAlert,
} from 'element-plus';
import readShapefileAndConvertToGeoJSON from '@/utils/readShapefile'
import proj4 from 'proj4';
import { countyOptions } from './common';

import { InfoFilled, Back, ArrowLeft, ArrowRight, Check } from '@element-plus/icons-vue'

const pageProps = defineProps<{
  embedded?: boolean
  componentId?: string | number | null
  projectId?: string | number | null
}>()

const emit = defineEmits<{
  saved: [projectId: string | number]
  close: []
  'component-loaded': [payload: { title?: string; acronym?: string | null }]
}>()

const embedded = computed(() => pageProps.embedded === true)


const { push } = useRouter()

const props1 = {
  checkStrictly: true,
}

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const MapBoxToken =
  'pk.eyJ1IjoiYWdzcGF0aWFsIiwiYSI6ImNsdm92dGhzNDBpYjIydmsxYXA1NXQxbWcifQ.dwBpfBMPaN_5gFkbyoerrg'
mapboxgl.accessToken = MapBoxToken;


const isMobile = computed(() => appStore.getMobile)

const showUploadDialog = ref(false)
const route = useRoute()
//const { push } = useRouter()
const router = useRouter();

const goBack = () => {
  if (embedded.value) {
    emit('close')
    return
  }
  router.back()
}

const cascaderProps = {
  expandTrigger: 'hover' as const,
}

const labelPosition = ref('left')
if (isMobile.value) {
  labelPosition.value = 'top'

}

// for mobile only 
const county_id = ref()
const subcounty_id = ref()
const CountyOptionsFiltered = ref([])
const subcountyOptionsFiltered = ref([])
const ward_id = ref()
const wardOptionsFiltered = ref([])
const selectAdmin = ref()

const settOptionsFiltered = ref([])
const settlement_id = ref()
const area_ha = ref(0)

const formatCostDisplay = (value: number | string | undefined | null) => {
  if (value == null || value === '') return ''
  const digits = String(value).replace(/[^\d]/g, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const handleCostFieldInput = (value: string) => {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  formData.cost = digits === '' ? undefined : Number(digits)
}

const costDisplay = computed({
  get: () => formatCostDisplay(formData.cost),
  set: (value: string) => handleCostFieldInput(value),
})

const normalizeProjectCost = (value: unknown) => {
  if (value == null || value === '') return null
  if (typeof value === 'number') {
    return Number.isFinite(value) && Number.isInteger(value) && value >= 0 ? value : null
  }
  const normalized = String(value).replace(/[,\s]/g, '')
  if (!/^\d+$/.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && Number.isInteger(parsed) ? parsed : null
}



const onSelectCounty = (county_id) => {
  formData.subcounty_id = null
  formData.ward_id = null
  formData.settlement_id = null
  subcountyOptionsFiltered.value = subcountyOptions.value.filter((obj) => obj.county_id == county_id);
  console.log('changed county')
  console.log(subcountyOptionsFiltered)
  handleChangeLocation([county_id])

};


const onSelectRegion = (region_id) => {

  console.log
  formData.subcounty_id = null
  formData.ward_id = null

  CountyOptionsFiltered.value = countyOptions.value.filter((obj) => obj.region_id == region_id);

  //handleChangeLocation([region_id])

};


const onSelectSubcounty = (subcounty_id) => {
  formData.ward_id = null
  formData.settlement_id = null

  wardOptionsFiltered.value = wardOptions.value.filter((obj) => obj.subcounty_id == subcounty_id);
  handleChangeLocation([formData.county_id.value, subcounty_id])

};

const centroid = ref(37, 1)




const calculateArea = (geom) => {
  console.log('calculateArea', geom);

  if (!geom || !geom.type) {
    area_ha.value = null
    centroid.value = null
    return
  }

  if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
    // Calculate the area using Turf.js
    const areaSquareMeters = turf.area(geom);

    // Convert square meters to hectares
    const areaHectares = areaSquareMeters / 10000;
    area_ha.value = areaHectares.toFixed(4);

    // Get centroid
    const centre = turf.centroid(geom);
    centroid.value = centre.geometry.coordinates;
  } else {
    console.warn('Geometry is not a polygon. Skipping area calculation.');
    area_ha.value = null;
    centroid.value = null;
  }

  console.log(  area_ha.value )
};




const onSelectWard = (ward_id) => {

  formData.settlement_id = null
  handleChangeLocation([formData.county_id.value, formData.subcounty_id.value, ward_id])

};

const onSelectSettlement = (sett_id) => {
  formData.settlement_id = sett_id
  handleChangeLocation([formData.county_id.value, formData.subcounty_id.value, formData.ward_id.value, sett_id])

  // const selectedSettlement = settOptionsFiltered.value.filter((obj) => obj.value === sett_id);
  // selectAdmin.value = selectAdmin.value + ' | ' + selectedSettlement[0].label
};

const setLocationOnMobile = () => {
  formData.county_id = county_id.value
  formData.subcounty_id = subcounty_id.value
  formData.ward_id = ward_id.value
  formData.settlement_id = settlement_id.value
  formData.location = [county_id, subcounty_id, ward_id, settlement_id]
  handleChangeLocation([county_id.value, subcounty_id.value, ward_id.value])

  console.log('formData', formData)
  showDialog.value = false
};
/// - mobile end 

const fileList = ref([])
const visibleUpload = ref(false)

const newRecord = ref(true)
const isLoading = ref(false)
const currentStep = ref(0)
const showMessage = ref(false)

const map = ref()

const mapContainer = ref(null);
const geomScope = ref([])
const model = 'project'
const component_id = ref<string | number>()
const component_title = ref()
const lockedProgrammeId = ref<string | number | null>(null)
const originalProgrammeId = ref<string | number | null>(null)
const originalComponentId = ref<string | number | null>(null)
const originalComponentTitle = ref('')
const editProgrammeId = ref<number | null>(null)
const programmeLabel = ref('')
const showProgrammeComponentEdit = ref(false)
const editProgrammeOptions = ref<Array<{ value: number; label: string }>>([])
const editProgrammeRecords = ref<Array<Record<string, any>>>([])
const editProgrammeComponentOptions = ref<
  Array<{ value: number; label: string; programmeId: number; componentLabel: string }>
>([])

async function loadEditProgrammeOptions() {
  if (editProgrammeOptions.value.length > 0) return

  const res = await getSettlementListByCounty({
    limit: 500,
    page: 1,
    model: 'programme',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: [],
  } as any)

  editProgrammeRecords.value = (res as any).data || []
  editProgrammeOptions.value = editProgrammeRecords.value.map((p: any) => ({
    value: Number(p.id),
    label: formatProgrammeSelectLabel(p),
  }))
}

async function loadEditProgrammeComponentOptions() {
  if (editProgrammeComponentOptions.value.length > 0) return

  await loadEditProgrammeOptions()

  const res = await getSettlementListByCounty({
    limit: 500,
    page: 1,
    model: 'component',
    searchField: 'title',
    searchKeyword: '',
    associated_multiple_models: [],
  } as any)

  editProgrammeComponentOptions.value = ((res as any).data || [])
    .map((component: any) => {
      const programmeId = Number(component.programme_id ?? component.programme?.id)
      const programmePath = getProgrammePathLabels(programmeId, editProgrammeRecords.value)
      const componentLabel = formatComponentSelectLabel(component)
      return {
        value: Number(component.id),
        programmeId,
        componentLabel,
        label: formatProgrammeComponentSelectLabel(programmePath, componentLabel),
      }
    })
    .filter(
      (option) =>
        !Number.isNaN(option.value) && !Number.isNaN(option.programmeId) && option.programmeId > 0
    )
    .sort((a, b) => a.label.localeCompare(b.label))
}

async function resolveProgrammeLabel(programmeId: string | number | null, fallback?: any) {
  if (programmeId != null && programmeId !== '') {
    await loadEditProgrammeOptions()
    const path = getProgrammePathLabels(Number(programmeId), editProgrammeRecords.value)
    if (path.length) {
      programmeLabel.value = path.join(' >> ')
      return
    }
  }

  if (fallback?.title || fallback?.acronym) {
    const title = fallback.title || fallback.acronym
    const acronym = fallback.acronym
    programmeLabel.value =
      title && acronym && String(title).trim().toLowerCase() !== String(acronym).trim().toLowerCase()
        ? `${title} (${acronym})`
        : (title || acronym || '')
    return
  }
  if (programmeId == null || programmeId === '') {
    programmeLabel.value = ''
    return
  }
  const res = await getOneSettlement({ model: 'programme', id: programmeId } as any)
  await resolveProgrammeLabel(null, res?.data)
}

function onEditProgrammeComponentChange(compId: number | string) {
  const option = editProgrammeComponentOptions.value.find(
    (entry) => entry.value === Number(compId)
  )
  if (!option) return

  formData.component_id = option.value
  component_id.value = option.value
  component_title.value = option.componentLabel
  lockedProgrammeId.value = option.programmeId
  editProgrammeId.value = option.programmeId
  void resolveProgrammeLabel(option.programmeId)
  syncComponentIdToForm()
}

function resetProgrammeComponentEditState() {
  showProgrammeComponentEdit.value = false
  lockedProgrammeId.value = null
  originalProgrammeId.value = null
  originalComponentId.value = null
  originalComponentTitle.value = ''
  editProgrammeId.value = null
  programmeLabel.value = ''
}

watch(showProgrammeComponentEdit, async (enabled) => {
  if (newRecord.value) return

  if (enabled) {
    await loadEditProgrammeComponentOptions()
    editProgrammeId.value =
      originalProgrammeId.value != null ? Number(originalProgrammeId.value) : null
    lockedProgrammeId.value = editProgrammeId.value
    return
  }

  lockedProgrammeId.value = originalProgrammeId.value
  editProgrammeId.value =
    originalProgrammeId.value != null ? Number(originalProgrammeId.value) : null
  if (originalComponentId.value != null) {
    formData.component_id = originalComponentId.value
    component_id.value = originalComponentId.value
  }
  component_title.value = originalComponentTitle.value
  if (originalProgrammeId.value != null) {
    await resolveProgrammeLabel(originalProgrammeId.value)
  }
})

function resolveComponentId(): string | number | null {
  const candidates = [
    component_id.value,
    pageProps.componentId,
    formData.component_id,
    route.params.domain,
  ]
  for (const candidate of candidates) {
    if (candidate != null && candidate !== '') {
      return candidate as string | number
    }
  }
  return null
}

function syncComponentIdToForm() {
  const id = resolveComponentId()
  if (id != null) {
    formData.component_id = id
  }
}

type LocationOption = {
  key: string
  value: number
  label: string
  name: string
  detail?: string
  location_type: string
  county_id?: number | null
  subcounty_id?: number | null
  ward_id?: number | null
  settlement_id?: number | null
  geom?: any
  project_location_id?: number
}

const selectedLocations = ref<LocationOption[]>([])
const selectedLocationKeys = ref<string[]>([])
const locationSearchResults = ref<LocationOption[]>([])
const locationSearchLoading = ref(false)
const locationSearchKeyword = ref('')
const locationFirstLoad = ref(true)
let locationSearchTimer: ReturnType<typeof setTimeout> | null = null
const activityOptions = ref<Array<{ value: number; label: string; code?: string }>>([])
const activitySearchLoading = ref(false)
const activitySearchKeyword = ref('')
let activitySearchTimer: ReturnType<typeof setTimeout> | null = null

const LOCATION_STEP_INDEX = 3
const ACTIVITY_STEP_INDEX = 4

const displaySteps = computed(() =>
  newRecord.value ? steps : [...steps, PROGRAMME_COMPONENT_STEP],
)

const isLocationStep = computed(() => currentStep.value === LOCATION_STEP_INDEX)
const isActivityStep = computed(() => currentStep.value === ACTIVITY_STEP_INDEX)

const isProgrammeStep = computed(
  () => !newRecord.value && currentStep.value === ACTIVITY_STEP_INDEX + 1,
)

const isNationalScope = computed(() => formData.implementation_scope === 'national')

const locationStepHint = computed(() => {
  const scope = formData.implementation_scope
  const labels: Record<string, string> = {
    county: 'counties',
    subcounty: 'subcounties',
    ward: 'wards',
    settlement: 'settlements',
  }
  if (scope === 'national') {
    return 'National projects do not require location selection.'
  }
  const label = labels[scope as string] || 'locations'
  return `Search ${label} and tick all areas covered by this project.`
})

function matchesCurrentScope(loc: LocationOption): boolean {
  const scope = formData.implementation_scope
  return Boolean(scope && scope !== 'national' && loc.location_type === scope)
}

const scopedSelectedLocations = computed(() =>
  selectedLocations.value.filter(matchesCurrentScope)
)

function validateProjectLocationSelection(): boolean {
  const scope = formData.implementation_scope
  if (!scope) {
    ElMessage.error('Select an implementation level before continuing')
    return false
  }
  if (scope === 'national') return true
  if (scopedSelectedLocations.value.length === 0) {
    ElMessage.error('Configure at least one project location before saving')
    return false
  }
  return true
}

function validateProjectActivities(): boolean {
  if (!Array.isArray(formData.activities) || formData.activities.length === 0) {
    ElMessage.error('Configure at least one project activity before saving')
    return false
  }
  return true
}

const selectedActivityOptions = computed(() => {
  const selectedIds = Array.isArray(formData.activities)
    ? formData.activities.map(Number)
    : []
  return activityOptions.value.filter((activity) => selectedIds.includes(activity.value))
})

function removeSelectedActivity(activityId: number) {
  formData.activities = (formData.activities || []).filter(
    (id: number | string) => Number(id) !== activityId
  )
}

async function searchProjectActivities(keyword = '') {
  activitySearchLoading.value = true
  try {
    const res = await searchByKeyWord({
      model: 'activity',
      searchField: 'title',
      searchKeyword: keyword,
      associated_multiple_models: [],
      filters: [],
      filterValues: [],
      limit: 50,
      offset: 0,
    } as any)
    const existing = activityOptions.value.filter((option) =>
      (formData.activities || []).includes(option.value)
    )
    const results = ((res as any).data || []).map((activity: any) => ({
      value: Number(activity.id),
      label: activity.title || activity.name || `Activity #${activity.id}`,
      code: activity.code,
    }))
    activityOptions.value = [...existing, ...results]
      .filter(
        (option, index, list) => list.findIndex((item) => item.value === option.value) === index
      )
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
  } catch (error) {
    console.error('Activity search failed:', error)
    ElMessage.error('Could not load project activities')
  } finally {
    activitySearchLoading.value = false
  }
}

function onActivitySearchInput(keyword: string) {
  if (activitySearchTimer) clearTimeout(activitySearchTimer)
  activitySearchTimer = setTimeout(() => searchProjectActivities(keyword), 300)
}

const displayLocationOptions = computed(() => {
  const seen = new Set<string>()
  const merged: LocationOption[] = []
  for (const loc of selectedLocations.value) {
    if (matchesCurrentScope(loc) && !seen.has(loc.key)) {
      seen.add(loc.key)
      merged.push(loc)
    }
  }
  for (const loc of locationSearchResults.value) {
    if (matchesCurrentScope(loc) && !seen.has(loc.key)) {
      seen.add(loc.key)
      merged.push(loc)
    }
  }
  return merged
})

function clearLocationSelection() {
  selectedLocations.value = []
  selectedLocationKeys.value = []
  locationSearchResults.value = []
  locationSearchKeyword.value = ''
  locationFirstLoad.value = true
}

function isNationalLocationUser(): boolean {
  const roles = userInfo?.roles || []
  if (
    roles.some(
      (role: any) => role.name === 'root_admin' || role.name === 'super_admin'
    )
  ) {
    return true
  }
  return roles.some((role: any) => {
    const level = role.user_roles?.location_level
    return level === 'national' || level == null
  })
}

function hasLocationScopedRole(): boolean {
  if (isNationalLocationUser()) return false
  return (userInfo?.roles || []).some((role: any) => {
    const level = role.user_roles?.location_level
    return level === 'county' || level === 'settlement'
  })
}

function getUserCountyIds(): number[] {
  if (!hasLocationScopedRole()) return []
  const roles = userInfo?.roles || []
  return [
    ...new Set(
      roles
        .filter(
          (role: any) =>
            role.user_roles?.location_level === 'county' && role.user_roles?.county_id != null
        )
        .map((role: any) => Number(role.user_roles.county_id))
        .filter((id: number) => Number.isFinite(id))
    ),
  ]
}

function getUserSettlementIds(): number[] {
  if (!hasLocationScopedRole()) return []
  const roles = userInfo?.roles || []
  return [
    ...new Set(
      roles
        .filter(
          (role: any) =>
            role.user_roles?.location_level === 'settlement' &&
            role.user_roles?.settlement_id != null
        )
        .map((role: any) => Number(role.user_roles.settlement_id))
        .filter((id: number) => Number.isFinite(id))
    ),
  ]
}

function locationMatchesUserScope(loc: LocationOption): boolean {
  const settlementIds = getUserSettlementIds()
  if (settlementIds.length > 0) {
    return loc.settlement_id != null && settlementIds.includes(Number(loc.settlement_id))
  }

  const countyIds = getUserCountyIds()
  if (countyIds.length > 0) {
    return loc.county_id != null && countyIds.includes(Number(loc.county_id))
  }

  return true
}

function filterResultsToUserScope(results: LocationOption[]): LocationOption[] {
  const settlementIds = getUserSettlementIds()
  if (settlementIds.length > 0) {
    return results.filter(
      (item) => item.settlement_id != null && settlementIds.includes(Number(item.settlement_id))
    )
  }

  const countyIds = getUserCountyIds()
  if (countyIds.length > 0) {
    return results.filter(
      (item) => item.county_id != null && countyIds.includes(Number(item.county_id))
    )
  }

  return results
}

function findLocationOption(key: string): LocationOption | undefined {
  return (
    locationSearchResults.value.find((loc) => loc.key === key) ||
    selectedLocations.value.find((loc) => loc.key === key)
  )
}

function mapSearchResultToOption(item: any, scope: string): LocationOption {
  const base = {
    value: item.id,
    label: item.name,
    name: item.name,
    location_type: scope,
    geom: item.geom,
  }

  if (scope === 'settlement') {
    const detail = [item.ward?.name, item.subcounty?.name, item.county?.name]
      .filter(Boolean)
      .join(', ')
    return {
      ...base,
      key: `${scope}-${item.id}`,
      detail,
      settlement_id: item.id,
      ward_id: item.ward?.id ?? null,
      subcounty_id: item.subcounty?.id ?? null,
      county_id: item.county?.id ?? null,
    }
  }

  if (scope === 'subcounty') {
    return {
      ...base,
      key: `${scope}-${item.id}`,
      detail: item.county?.name,
      subcounty_id: item.id,
      county_id: item.county?.id ?? null,
    }
  }

  if (scope === 'ward') {
    const detail = [item.subcounty?.name, item.county?.name].filter(Boolean).join(', ')
    return {
      ...base,
      key: `${scope}-${item.id}`,
      detail,
      ward_id: item.id,
      subcounty_id: item.subcounty?.id ?? null,
      county_id: item.county?.id ?? null,
    }
  }

  return {
    ...base,
    key: `${scope}-${item.id}`,
    county_id: item.id,
  }
}

function mapExistingProjectLocation(loc: any): LocationOption | null {
  const scope = formData.implementation_scope
  if (!scope || scope === 'national') return null

  const type = loc.location_type || 'settlement'
  if (type !== scope) return null

  let valueId: number | null = null
  let detail = ''

  if (type === 'settlement') {
    valueId = loc.settlement_id
    detail = [loc.ward?.name, loc.subcounty?.name, loc.county?.name].filter(Boolean).join(', ')
  } else if (type === 'ward') {
    valueId = loc.ward_id
    detail = [loc.subcounty?.name, loc.county?.name].filter(Boolean).join(', ')
  } else if (type === 'subcounty') {
    valueId = loc.subcounty_id
    detail = loc.county?.name
  } else if (type === 'county') {
    valueId = loc.county_id
  }

  if (valueId == null) return null

  const label =
    loc.location_name ||
    loc.settlement?.name ||
    loc.ward?.name ||
    loc.subcounty?.name ||
    loc.county?.name ||
    'Unknown'

  return {
    key: `${type}-${valueId}`,
    value: valueId,
    label,
    name: loc.location_name || label,
    detail,
    location_type: type,
    county_id: loc.county_id ?? loc.county?.id ?? null,
    subcounty_id: loc.subcounty_id ?? loc.subcounty?.id ?? null,
    ward_id: loc.ward_id ?? loc.ward?.id ?? null,
    settlement_id: loc.settlement_id ?? loc.settlement?.id ?? null,
    geom: loc.geom,
    project_location_id: loc.id,
  }
}

async function loadProjectLocations(projectId: number) {
  clearLocationSelection()

  if (formData.implementation_scope === 'national') return

  const form: any = {
    model: 'project_location',
    excludeGeom: false,
    associated_multiple_models: ['county', 'subcounty', 'ward', 'settlement'],
    filters: ['project_id'],
    filterValues: [[projectId]],
    limit: 200,
  }

  const res = await getSettlementListByCounty(form)
  const items = (res.data || [])
    .map(mapExistingProjectLocation)
    .filter((item): item is LocationOption => item != null)

  selectedLocations.value = items
  selectedLocationKeys.value = items.map((item) => item.key)
}

async function searchLocations(keyword: string) {
  const scope = formData.implementation_scope
  if (!scope || scope === 'national') {
    locationSearchResults.value = []
    return
  }

  locationSearchLoading.value = true

  const associatedModels =
    scope === 'settlement'
      ? ['county', 'subcounty', 'ward']
      : scope === 'subcounty'
        ? ['county']
        : scope === 'ward'
          ? ['subcounty', 'county']
          : []

  const userCountyIds = getUserCountyIds()
  const form: any = {
    model: scope,
    searchField: 'name',
    searchKeyword: locationFirstLoad.value ? '' : keyword,
    excludeGeom: false,
    excludeGeomAssoc: true,
    associated_multiple_models: associatedModels,
    filters: userCountyIds.length === 1 && scope === 'settlement' ? ['county_id'] : [],
    filterValues: userCountyIds.length === 1 && scope === 'settlement' ? [[userCountyIds[0]]] : [],
    limit: 50,
    offset: 0,
  }

  try {
    const res = await searchByKeyWord(form)
    const mapped = ((res as any).data || []).map((item: any) =>
      mapSearchResultToOption(item, scope)
    )
    locationSearchResults.value = filterResultsToUserScope(mapped)
    locationFirstLoad.value = false
  } catch (error) {
    console.error('Location search failed:', error)
    locationSearchResults.value = []
  } finally {
    locationSearchLoading.value = false
  }
}

function onLocationSearchInput(keyword: string) {
  if (locationSearchTimer) clearTimeout(locationSearchTimer)
  locationSearchTimer = setTimeout(() => {
    searchLocations(keyword)
  }, 300)
}

function removeSelectedLocation(key: string) {
  selectedLocationKeys.value = selectedLocationKeys.value.filter((item) => item !== key)
}

function buildLocationObjects(projectId: number) {
  const scope = formData.implementation_scope
  if (!scope || scope === 'national') return []

  return selectedLocations.value.filter(matchesCurrentScope).map((loc) => {
    const obj: any = {
      project_id: projectId,
      implementer: formData.implementation_id,
      location_type: scope,
      location_name: loc.name,
      geom: loc.geom,
    }

    if (scope === 'settlement') {
      obj.settlement_id = loc.value
      obj.ward_id = loc.ward_id
      obj.subcounty_id = loc.subcounty_id
      obj.county_id = loc.county_id
    } else if (scope === 'county') {
      obj.county_id = loc.value
    } else if (scope === 'subcounty') {
      obj.subcounty_id = loc.value
      obj.county_id = loc.county_id
    } else if (scope === 'ward') {
      obj.ward_id = loc.value
      obj.subcounty_id = loc.subcounty_id
      obj.county_id = loc.county_id
    }

    return obj
  })
}

async function deleteProjectLocations(projectId: number) {
  const form: any = {
    model: 'project_location',
    filters: ['project_id'],
    filterValues: [[projectId]],
    limit: 500,
  }
  const res = await getSettlementListByCounty(form)
  const ids = (res.data || []).map((loc: any) => loc.id).filter(Boolean)

  for (const id of ids) {
    await DeleteRecord(
      {
        model: 'project_location',
        id,
        cascade: true,
      } as any,
      { silent: true }
    )
  }
}

async function saveProjectLocations(projectId: number) {
  await deleteProjectLocations(projectId)

  const scope = formData.implementation_scope
  if (!scope || scope === 'national') return

  const locationObjects = buildLocationObjects(projectId)
  if (locationObjects.length === 0) return

  await BatchImportUpsert({
    model: 'project_location',
    data: locationObjects,
  } as any)
}

watch(selectedLocationKeys, (keys, previousKeys) => {
  const prev = previousKeys ?? []
  const added = keys.filter((key) => !prev.includes(key))
  const removed = prev.filter((key) => !keys.includes(key))

  for (const key of added) {
    const option = findLocationOption(key)
    if (
      option &&
      matchesCurrentScope(option) &&
      !selectedLocations.value.some((loc) => loc.key === key)
    ) {
      selectedLocations.value.push(option)
    }
  }

  if (removed.length > 0) {
    selectedLocations.value = selectedLocations.value.filter((loc) => keys.includes(loc.key))
  }
})

watch(
  () => formData.implementation_scope,
  () => {
    clearLocationSelection()
    if (currentStep.value === LOCATION_STEP_INDEX && !isNationalScope.value) {
      searchLocations('')
    }
  }
)

watch(currentStep, (step) => {
  if (step === LOCATION_STEP_INDEX && !isNationalScope.value) {
    locationFirstLoad.value = true
    searchLocations(locationSearchKeyword.value)
  }
  if (step === ACTIVITY_STEP_INDEX) {
    void searchProjectActivities('')
  }
  if (step === ACTIVITY_STEP_INDEX + 1 && !newRecord.value) {
    void loadEditProgrammeComponentOptions()
  }
})

let initializeFormSeq = 0

async function initializeForm(domainId: string | number, editProjectId?: string | number | null) {
  const seq = ++initializeFormSeq
  const isStale = () => seq !== initializeFormSeq

  currentStep.value = 0
  isLoading.value = true
  activitySearchKeyword.value = ''

  try {
    component_id.value = domainId

    const comp_form: any = {}
    comp_form.model = 'component'
    comp_form.id = domainId

    const component = await getOneSettlement(comp_form)
    if (isStale()) return

    component_title.value = component.data.title
    emit('component-loaded', {
      title: component.data.title,
      acronym: component.data.acronym,
    })

    const form: any = {}
    form.model = model

    let ward_id: any
    const normalizedEditId =
      editProjectId != null && editProjectId !== ''
        ? Number(editProjectId)
        : null
    const isEdit = normalizedEditId != null && !Number.isNaN(normalizedEditId)

    if (isEdit) {
      form.id = normalizedEditId
      form.associated_multiple_models = ['component', 'programme']
      const res = await getOneSettlement(form)
      if (isStale()) return

      const curData = res?.data
      if (!curData || curData.id == null) {
        throw new Error('Project record not found')
      }

      lockedProgrammeId.value =
        curData.programme_id ??
        curData.programme?.id ??
        curData.component?.programme_id ??
        component.data.programme_id ??
        component.data.programmeId ??
        null
      originalProgrammeId.value = lockedProgrammeId.value
      originalComponentId.value = curData.component_id ?? domainId
      originalComponentTitle.value =
        curData.component?.title ??
        curData.component?.acronym ??
        component.data.title ??
        component.data.acronym ??
        ''

      await resolveProgrammeLabel(lockedProgrammeId.value, curData.programme)
      if (isStale()) return

      geomScope.value = curData.geom ?? null

      if (curData.region_id != null) {
        CountyOptionsFiltered.value = countyOptions.value.filter((obj) => obj.region_id == curData.region_id)
      }
      if (curData.county_id != null) {
        subcountyOptionsFiltered.value = subcountyOptions.value.filter((obj) => obj.county_id == curData.county_id)
      }
      if (curData.subcounty_id != null) {
        wardOptionsFiltered.value = wardOptions.value.filter((obj) => obj.subcounty_id == curData.subcounty_id)
      }

      ward_id = curData.ward_id
      Object.keys(formData).forEach((key) => {
        delete formData[key]
      })
      Object.assign(formData, curData)
      const existingActivities = Array.isArray(curData.activities) ? curData.activities : []
      activityOptions.value = existingActivities.map((activity: any) => ({
        value: Number(activity.id),
        label: activity.title || activity.name || `Activity #${activity.id}`,
        code: activity.code,
      }))
      formData.activities = existingActivities
        .map((activity: any) => Number(activity.id))
        .filter((id: number) => Number.isFinite(id))
      formData.component_id = curData.component_id ?? domainId
      component_id.value = formData.component_id
      component_title.value =
        originalComponentTitle.value ||
        formatComponentSelectLabel(curData.component ?? component.data)
      const loadedCost = normalizeProjectCost(curData.cost)
      formData.cost = loadedCost ?? undefined
      newRecord.value = false
      calculateArea(formData.geom)

      if (!geomScope.value && ward_id != null && ward_id !== '') {
        const wform: any = {}
        wform.model = 'ward'
        wform.id = ward_id
        geomScope.value = await getWard(wform)
        if (isStale()) return
        showMessage.value = true
      } else {
        showMessage.value = false
      }

      await loadProjectLocations(normalizedEditId)
      if (isStale()) return
    } else {
      if (isStale()) return
      clearLocationSelection()
      Object.keys(formData).forEach((key) => {
        delete formData[key]
      })
      formData.component_id = domainId
      formData.activities = []
      activityOptions.value = []
      newRecord.value = true
      resetProgrammeComponentEditState()
      geomScope.value = []
      showMessage.value = false
    }

    await setImplementationOptionsForProgramme(
      component.data.programme_id ?? component.data.programmeId,
      { acronym: component.data.acronym, title: component.data.title },
      formData.implementation_id
    )
    if (isStale()) return

    if (
      formData.implementation_id != null &&
      !implementationOptions.value.some((opt) => opt.value === formData.implementation_id)
    ) {
      formData.implementation_id = undefined
    }

    if (
      newRecord.value &&
      implementationOptions.value.length === 1 &&
      formData.implementation_id == null
    ) {
      formData.implementation_id = implementationOptions.value[0].value
    }
  } catch (error) {
    if (!isStale()) {
      console.error('Failed to initialize project form:', error)
      ElMessage.error('Could not load project form')
    }
  } finally {
    if (!isStale()) {
      isLoading.value = false
    }
  }
}

onMounted(async () => {
  if (embedded.value) return
  const domain = route.params.domain
  const projectId = route.query.id as string | undefined
  if (!domain) return
  await initializeForm(domain as string | number, projectId)
})

watch(
  () => [pageProps.embedded, pageProps.componentId, pageProps.projectId] as const,
  async ([isEmbedded, componentId, projectId]) => {
    if (!isEmbedded || componentId == null || componentId === '') return
    component_id.value = componentId
    syncComponentIdToForm()
    const editId =
      projectId != null && projectId !== '' ? projectId : null
    await initializeForm(componentId, editId)
  },
  { immediate: true }
)

watch(
  () => [component_id.value, pageProps.componentId, route.params.domain, newRecord.value] as const,
  () => {
    syncComponentIdToForm()
  },
  { immediate: true }
)




const getWard = async (wform) => {
  console.log(wform)

  let ward = await getOneSettlement(wform)
  console.log("ward", ward)

  return ward.data.geom

};

const showDialog = ref(false)
const cascadeOptions = ref([])
const showOnMobile = (options) => {
  console.log(options)
  cascadeOptions.value = options

  showDialog.value = true
};


const dynamicFormRef = ref<FormInstance>()

const currentStepFields = computed(() => {
  if (currentStep.value >= formFields.length) return []
  return formFields[currentStep.value].map((field) => {
    if (field.name === 'implementation_id') {
      return { ...field, options: implementationOptions.value }
    }
    return field
  })
})

const currentStepRules = computed(() => {
  if (isProgrammeStep.value) return {}
  const stepRulesKey = `step${currentStep.value + 1}`
  return formRules[stepRulesKey] ?? {}
})

const totalSteps = computed(() => displaySteps.value.length)

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};


const bounds = ref([])
const readJson = (event) => {
  console.log('Reading Josn file....', event)
  let str = event.target.result


  let json = JSON.parse(str)
  //  console.log('parsed', json.crs)

  const targetProj = "+proj=longlat +datum=WGS84 +no_defs"

  // const sourceProj = '+proj=utm +zone=37 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';

  // const sourceProj = '+proj=utm +zone=37 +ellps=WGS84 +datum=WGS84 +units=m +no_defs';
  let sourceProj
  let epsgCode
  let crsProp = json.crs ? json.crs.properties.name : null;

  if (crsProp && crsProp.includes('EPSG')) {
    console.log('The string contains the character "EPSG"');
    epsgCode = crsProp.match(/EPSG::(\d+)/)[1]
  } else {
    epsgCode = 4326
  }


  console.log(epsgCode)


  console.log(epsgCode)

  if (epsgCode == 21037) {
    // zone 37S
    sourceProj = "+proj=utm + zone=37 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21097) {
    // zone 37 N
    sourceProj = "+proj=utm + zone=37 + north + a=6378249.145 + rf=293.465 + towgs84=-157,-2,-299,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21036) {
    // zone 36 S
    sourceProj = "+proj=utm + zone=36 + south + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }
  else if (epsgCode == 21096) {
    // zone 36N
    sourceProj = "+proj=utm + zone=36 + north + a=6378249.145 + rf=293.465 + towgs84=-160,-6,-302,0,0,0,0 + units=m + no_defs";
  }

  else {
    sourceProj = "+proj=longlat +datum=WGS84 +no_defs"

  }


  proj4.defs("SOURCE_CRS", sourceProj);
  proj4.defs("WGS84", targetProj);


  if (json.features.length != 1) {
    ElMessage.warning('Please uplaod a file with only one feature. This one has ' + json.features.length + ' features')

  }
  else {
    console.log('ok>>', json.features)

    const geometry = json.features[0].geometry;
    console.log(geometry)
    // Check if the geometry type is "Polygon" or "MultiPolygon"
    if (geometry.type === "Polygon") {
      // If it's a single polygon, project its coordinates
      geometry.coordinates[0] = geometry.coordinates[0].map(coordinate => {
        return proj4("SOURCE_CRS", "WGS84", coordinate);
      });
    } else if (geometry.type === "MultiPolygon") {
      // If it's a multi-polygon, loop through all polygons and project their coordinates
      geometry.coordinates.forEach(polygon => {
        polygon[0] = polygon[0].map(coordinate => {
          return proj4("SOURCE_CRS", "WGS84", coordinate);
        });
      });
    }

    console.log('geometry', geometry)
    let geom = {
      type: json.features[0].geometry.type,
      coordinates: geometry.coordinates
    }
    console.log(geom)
    formData.geom = geom


    geomScope.value = geom
    map.value.getSource("scope").setData(geomScope.value);
    bounds.value = turf.bbox((geomScope.value))
    console.log("From geojson", geomScope.value)

    calculateArea(geom)
    //map.value.fitBounds(bounds.value, { padding: 20, maxZoom: 18 })

    loadMap()

  }

}


const readShp = async (file) => {
  console.log('Reading Shp file....')

  // await getGeoJSON(file)
  readShapefileAndConvertToGeoJSON(file)
    .then((geojson) => {

      console.log("Geo>", geojson)
      console.log("Geo>", geojson.length)
      console.log("Geo1>", geojson[0])


      if (geojson.length != 1) {
        ElMessage.warning('Please upload a file with only one feature. This one has ' + geojson.length + ' features')

      }
      else {
        console.log('ok>>', geojson[0])


        var crs = { type: 'name', properties: { name: 'EPSG:4326' } }

        let geomX = {
          type: geojson[0].geometry.type,
          coordinates: geojson[0].geometry.coordinates,

        }


        formData.geom = geomX

        geomScope.value = geomX
        map.value.getSource("scope").setData(geomScope.value);
        bounds.value = turf.bbox((geomScope.value))
        console.log("From SHP/KML", geomScope.value)
        //map.value.fitBounds(bounds.value, { padding: 20, maxZoom: 18 })
        calculateArea(geomX)
        loadMap()

      }


    })
    .catch((error) => {
      console.error(error)
      ElMessage.error('Invalid files. Check your zipped file to contain (.shp, .dbf and .prj) or a proper kml/kmz')


    })

  //uploadPolygon(feat)
}

const handleUploadGeo = async (uploadFile) => {
  console.log('Upload>>>', uploadFile)
  //  uploadRef.value!.submit()

  console.log("File type", uploadFile.name.split('.').pop())
  var fileType = uploadFile.name.split('.').pop()
  var rfile = uploadFile.raw

  let reader = new FileReader()
  console.log(reader)

  //var mydata = JSON.parse(uploadFile);

  if (fileType === 'geojson' || fileType === 'json') {
    reader.onload = readJson
    reader.readAsText(rfile)
  }
  else if (fileType === 'zip' || fileType === 'kml' || fileType === 'kmz') {
    readShp(rfile)

    // reader.readAsArrayBuffer(rfile)
  } else {
    ElMessage.error('Only GeoJSON, KML, KMZ or zipped shapefiles are supported at the moment')


  }
  showUploadDialog.value = false

}


















const handleStepClick = (index) => {
  if (index > currentStep.value && isLocationStep.value && !validateProjectLocationSelection()) return
  if (index > currentStep.value && isActivityStep.value && !validateProjectActivities()) return
  currentStep.value = index;
}


const nextStep = async () => {
  if (currentStep.value >= totalSteps.value - 1 || !dynamicFormRef.value) return

  if (isLocationStep.value) {
    if (!validateProjectLocationSelection()) return
    currentStep.value++
    return
  }

  if (isActivityStep.value) {
    if (!validateProjectActivities()) return
    currentStep.value++
    return
  }

  if (isProgrammeStep.value) {
    currentStep.value++
    return
  }

  dynamicFormRef.value.validate((valid: boolean) => {
    if (valid) {
      currentStep.value++
    }
  })
}




const icon = ref(`<button>  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" fill="#1C274C"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M2 8C2 8.49355 2.99294 8.89073 4.97883 9.68508L7.7873 10.8085C9.77318 11.6028 10.7661 12 12 12C13.2339 12 14.2268 11.6028 16.2127 10.8085L19.0212 9.68508C21.0071 8.89073 22 8.49355 22 8C22 7.50645 21.0071 7.10927 19.0212 6.31492L16.2127 5.19153C14.2268 4.39718 13.2339 4 12 4C10.7661 4 9.77318 4.39718 7.7873 5.19153L4.97883 6.31492C2.99294 7.10927 2 7.50645 2 8Z" fill="#1C274C"></path> <path opacity="0.7" d="M5.76613 10L4.97883 10.3149C2.99294 11.1093 2 11.5065 2 12C2 12.4935 2.99294 12.8907 4.97883 13.6851L7.7873 14.8085C9.77318 15.6028 10.7661 16 12 16C13.2339 16 14.2268 15.6028 16.2127 14.8085L19.0212 13.6851C21.0071 12.8907 22 12.4935 22 12C22 11.5065 21.0071 11.1093 19.0212 10.3149L18.2339 10L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L5.76613 10Z" fill="#1C274C"></path> <path opacity="0.4" d="M5.76613 14L4.97883 14.3149C2.99294 15.1093 2 15.5065 2 16C2 16.4935 2.99294 16.8907 4.97883 17.6851L7.7873 18.8085C9.77318 19.6028 10.7661 20 12 20C13.2339 20 14.2268 19.6028 16.2127 18.8085L19.0212 17.6851C21.0071 16.8907 22 16.4935 22 16C22 15.5065 21.0071 15.1093 19.0212 14.3149L18.2339 14L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L5.76613 14Z" fill="#1C274C"></path> </g></svg></button>`)

const showSatellite = ref(false)

const toggleFloatingDiv = async () => {
  showSatellite.value = !showSatellite.value;
  console.log('Show Satellite', showSatellite.value);

  // Get the map style
  let style = map.value.getStyle();

  // Get all layers
  let allLayers = style.layers;

  // Log all layers to the console
  console.log('before ', allLayers);



  if (!showSatellite.value) {
    console.log('Remove Satellte');





    if (map.value.getLayer('Satellite')) {
      map.value.removeLayer('Satellite');
      map.value.removeSource('Satellite');

    }


  } else {

    console.log('Add Satellte');



    if (map.value.getLayer('Satellite')) {
      map.value.removeLayer('Satellite');
      map.value.removeSource('Satellite');

    } else {

      icon.value = `<button>  <svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-satellite" fill="#f20707"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>650</title> <defs> </defs> <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g fill="#fb0e0e"> <path d="M12.495,5.893 C12.832,6.231 14.184,4.877 13.847,4.541 L10.864,1.557 C10.526,1.219 9.174,2.573 9.51,2.909 L12.495,5.893 L12.495,5.893 Z" class="si-glyph-fill"> </path> <path d="M3.288,10.897 C3.072,10.68 2.597,10.802 2.23,11.168 C1.863,11.536 1.742,12.009 1.959,12.228 L3.233,13.501 C3.45,13.719 3.922,13.597 4.289,13.23 C4.658,12.864 4.779,12.388 4.562,12.172 L3.288,10.897 L3.288,10.897 Z" class="si-glyph-fill"> </path> <rect transform="translate(2.240100, 2.131300) rotate(-44.991897) translate(-2.240100, -2.131300) " x="-0.25987605" y="1.13130958" width="4.96295245" height="1.95398128" class="si-glyph-fill"> </rect> <path d="M12.088,8.374 L10.657,9.802 L9.918,9.063 L11.543,7.439 C11.814,7.168 11.81,6.723 11.531,6.447 L9.031,3.948 C8.757,3.673 8.314,3.67 8.043,3.939 L6.419,5.564 L5.684,4.829 L7.113,3.401 L5.718,2.007 L2.221,5.503 L3.614,6.897 L5.028,5.484 L5.763,6.219 L4.134,7.849 C3.864,8.12 3.866,8.564 4.141,8.838 L6.641,11.336 C6.917,11.612 7.363,11.617 7.632,11.346 L9.262,9.717 L10.001,10.456 L8.585,11.869 L9.967,13.25 L13.464,9.753 L12.088,8.374 L12.088,8.374 Z" class="si-glyph-fill"> </path> <rect transform="translate(13.426200, 12.673100) rotate(-45.056720) translate(-13.426200, -12.673100) " x="10.9262228" y="11.6731091" width="4.96795479" height="1.97998198" class="si-glyph-fill"> </rect> </g> </g> </g></svg> </button>`

      map.value.addLayer(
        {
          id: 'Satellite',
          source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
          type: "raster"
        },
        'country-label'
      );
    }



  }

  // Get the map style
  style = map.value.getStyle();

  // Get all layers
  allLayers = style.layers;

  // Log all layers to the console
  console.log('after', allLayers);

}


const loadMap = async () => {

  map.value = new mapboxgl.Map({
    container: 'mapContainer',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [37.137343, 1.137451],
    zoom: 6,
  });



  map.value.addControl(new mapboxgl.NavigationControl());
  // add marker for project location


  function updateRuleform(feature) {
    // do something with the new marker feature
    var crs = { type: 'name', properties: { name: 'EPSG:4326' } }
    feature.geometry.crs = crs
    console.log('----feature', feature);



    formData.geom = feature.geometry
    console.log(formData)
    calculateArea(feature.geometry)

    console.log('centroid.value', centroid.value)

    map.value.getSource('labels').setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: centroid.value, // Update with the actual coordinates
          },
          properties: {
            title: area_ha.value + " Ha.", // Update with the desired label text (area)
          },
        },
      ],
    });

  }

  // listen for the draw.create event
  map.value.on('draw.create', function (e) {
    // check if the new feature is a marker
    // if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    //  }
  });


  // listen for the draw.se event
  map.value.on('draw.update', function (e) {
    // check if the new feature is a marker
    //if (e.features[0].geometry.type === 'Polygon') {
    // trigger your function here
    updateRuleform(e.features[0]);

    // }
  });

  // Listen for the draw.delete event
  map.value.on('draw.delete', function (event) {
    // Get the IDs of the deleted features
    var deletedFeatureIds = event.features.map(function (feature) {
      return feature.id;
    });

    // Remove the corresponding layers from the map
    deletedFeatureIds.forEach(function (id) {
      map.value.removeLayer(id);
    });


    map.value.getSource('labels').setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: centroid.value, // Update with the actual coordinates
          },
          properties: {
            title: '', // Update with the desired label text (area)
          },
        },
      ],
    });




  });

  map.value.on('mousemove', function (e) {
    document.getElementById('coordinates').innerHTML =
      'Lon: ' + e.lngLat.lng.toFixed(5) + ' Lat: ' + e.lngLat.lat.toFixed(5);
  });


  map.value.on('load', function () {
    // code to execute after the map has finished loading
    console.log("Map has loaded......")
    //map.value.addControl(draw, 'top-left');



    // map.value.addLayer({
    //   id: 'Satellite',
    //   source: { "type": "raster", "url": "mapbox://mapbox.satellite", "tileSize": 256 },
    //   type: "raster"
    // });

    map.value.addLayer({
      id: 'Streets',
      source: { "type": "raster", "url": "mapbox://mapbox.streets", "tileSize": 256 },
      type: "raster"
    } );



    map.value.addSource('scope', {
      type: 'geojson',
      //data: projectPoly.value
      data: geomScope.value,
    });




    map.value.addLayer({
      id: 'labels',
      type: 'symbol',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: centroid.value, // Replace with initial coordinates
              },
              properties: {
                title: area_ha.value + " Ha.", // Initialize with an empty string
              },
            },
          ],
        },
      },
      layout: {
        'text-field': ['get', 'title'],
        'text-size': 16,
        'text-anchor': 'top',
      },
      paint: {
        'text-color': '#FF0000', // Red text color
        'text-halo-color': '#FFFFFF', // White halo color
        'text-halo-width': 2, // Adjust the halo width as needed    
      },


    });



    // Edit only if not a new record 
    if (!newRecord.value) {
      toggleDrawToolbox('digitize')
      const geojson = JSON.parse(JSON.stringify(geomScope.value));
      var feature = turf.feature(geojson);
      var collection = turf.featureCollection([feature])
      draw.set(collection);
      // Check if the new feature is a polygon
      // if (collection.features[0].type === 'Polygon') {
      // Trigger your function here
      updateRuleform(collection.features[0]);
      //}
    }


    if (newRecord.value) {
      toggleDrawToolbox('digitize')
      // Load this outline only if its a new settlement 
      map.value.addLayer({
        'id': 'geomScope',
        'type': 'line',
        'source': 'scope',
        'layout': {},
        'paint': {
          'line-color': '#000',
          'line-width': 3
        }
      });

    }

    map.value.addLayer({
      'id': 'draw-layer',
      'type': 'fill',
      'source': {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': []
        }
      },
      'paint': {
        'fill-color': 'red',
        'fill-opacity': 0.5
      },
      'layout': {}
    });

    // switch it off until the user selects to
    //map.value.setLayoutProperty('Satellite', 'visibility', 'none')


    const layers: MapboxLayerDefinition[] = [

      {
        id: "Satellite",
        title: "Satellite",
        visibility: 'none',
        type: 'base'
      },

      {
        id: "Streets",
        title: "Streets",
        visibility: 'none',
        type: 'base'
      },

    ];


    // map.value.addControl(new MapboxLayerSwitcherControl(layers));





    var bounds = turf.bbox((geomScope.value));
    // Calculate the center of the bounds
    const center = [
      (bounds[0] + bounds[2]) / 2, // Longitude
      (bounds[1] + bounds[3]) / 2  // Latitude
    ];

    // Use map.flyTo instead of map.fitBounds
    map.value.flyTo({
      center: center, // Use calculated center coordinates
      zoom: 16,       // Optional: Set zoom level
      speed: 1.2,     // Optional: Speed of the fly animation
      curve: 1.42,    // Optional: Curve for the easing function
      essential: true // Animation is considered essential
    });







  });




  //map.value.addControl(ctrlLine, "top-left");



  function addHomeButton(map) {
    class HomeButton {
      onAdd(map) {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.id = "upload";
        div.innerHTML = `<button>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.5" d="M17 9.00195C19.175 9.01406 20.3529 9.11051 21.1213 9.8789C22 10.7576 22 12.1718 22 15.0002V16.0002C22 18.8286 22 20.2429 21.1213 21.1215C20.2426 22.0002 18.8284 22.0002 16 22.0002H8C5.17157 22.0002 3.75736 22.0002 2.87868 21.1215C2 20.2429 2 18.8286 2 16.0002L2 15.0002C2 12.1718 2 10.7576 2.87868 9.87889C3.64706 9.11051 4.82497 9.01406 7 9.00195" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> <path d="M12 15L12 2M12 2L15 5.5M12 2L9 5.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
		
  </button>`; div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => showUploadDialog.value = true);

        return div;
      }
    }
    const homeButton = new HomeButton();
    map.addControl(homeButton, "top-left");
  }
  addHomeButton(map.value)




  function addInfo(map) {
    class LayerButton {
      onAdd(map) {
        const div = document.createElement("div");
        div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
        div.innerHTML = icon.value;
        div.addEventListener("contextmenu", (e) => e.preventDefault());
        div.addEventListener("click", () => toggleFloatingDiv());

        return div;
      }
    }
    const lryButton = new LayerButton();
    map.addControl(lryButton, "top-right");
  }
  addInfo(map.value)




}




const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    point: true,
    line_string: false,
    polygon: true,
    trash: true
  },

})

const toggleDrawToolbox = (value) => {
  console.log(value)

  if (value == 'digitize') {
    visibleUpload.value = false

    map.value.addControl(draw, 'top-left');
    console.log('adding')
  } else if (value == 'upload') {

    visibleUpload.value = true
    map.value.removeControl(draw);
    console.log('remove....')
  }
  else {
    visibleUpload.value = false

    map.value.removeControl(draw);
    console.log('remove....')

  }



};



const submitForm = async () => {
  const formInstance = dynamicFormRef
  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      const resolvedCategoryId = resolveComponentId()
      if (resolvedCategoryId == null || resolvedCategoryId === '') {
        ElMessage.error('Project category is missing. Close the form and try again from the project listing.')
        return
      }
      const numericCategoryId = Number(resolvedCategoryId)
      if (Number.isNaN(numericCategoryId)) {
        ElMessage.error('Invalid project category.')
        return
      }

      // Perform form submission logic
      const scope = formData.implementation_scope
      if (!validateProjectLocationSelection()) return
      if (!validateProjectActivities()) return
      if (
        !isNationalLocationUser() &&
        scope &&
        scope !== 'national' &&
        selectedLocations.value.length > 0
      ) {
        const outOfScope = scopedSelectedLocations.value.filter(
          (loc) => !locationMatchesUserScope(loc)
        )
        if (outOfScope.length > 0) {
          ElMessage.error(
            'Selected locations must be within your assigned county or settlement area'
          )
          return
        }
      }

      formData.model = model
      formData.createdBy = userInfo.id

      if (
        !newRecord.value &&
        showProgrammeComponentEdit.value &&
        (formData.component_id == null || formData.component_id === '')
      ) {
        ElMessage.warning('Select a component when changing programme or component')
        return
      }

      if (!newRecord.value && !showProgrammeComponentEdit.value && originalComponentId.value != null) {
        formData.component_id = originalComponentId.value
        component_id.value = originalComponentId.value
      } else {
        formData.component_id = numericCategoryId
      }
      formData.component_title = component_title.value

      const normalizedCost = normalizeProjectCost(formData.cost)
      if (formData.cost != null && formData.cost !== '' && normalizedCost == null) {
        ElMessage.error('Enter a valid whole-number project cost in KSh')
        return
      }
      formData.cost = normalizedCost


      // Calculate the area using Turf.js
   //   const areaSquareMeters = turf.area(geomScope.value);

      // Convert square meters to hectares
   //   const areaHectares = areaSquareMeters / 10000;
      formData.area = area_ha.value

      console.log('formData.value', formData.value)



      //formData.geom =geomScope.value

      let project_id
      try {
      if (newRecord.value) {
        formData.isApproved = 'Pending'
        formData.code = shortid.generate()

       const createdproject =  await CreateRecord(formData)

        console.log('createdproject', createdproject);
        project_id=createdproject.data.id

      } else {
        formData.area = area_ha.value
        if (Array.isArray(formData.activities)) {
          formData.activities = formData.activities
            .map((item) => (typeof item === 'object' && item != null ? item.id : item))
            .filter((id) => id != null)
        } else {
          delete formData.activities
        }

        const udpatedProject = await updateOneRecord(formData)

        project_id=udpatedProject.data.id


        console.log('Edited form', formData);


      }

      await saveProjectLocations(project_id)

      if (embedded.value) {
        ElMessage.success(newRecord.value ? 'Project created' : 'Project updated')
        emit('saved', project_id)
      } else {
        push({
          name: 'ProjectDetails',
          params: { id: project_id }
        })
      }
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Could not save project'
        ElMessage.error(message)
        return
      }



  //    goBack()

      // push({
      //    name: 'Health'
      // })

    } else {
      // Handle form validation errors
      console.log('fail validation')
    }
  });

};


const handleChangeLocationOption = async (value: any) => {
  toggleDrawToolbox(value)
}

const handleChangeLocation = async (value: any) => {
  console.log('Location field changed:', value);


  if (value.length == 1) {
    var model = 'county'
    var model_id = value[0]

  } else if (value.length == 2) {
    var model = 'subcounty'
    var model_id = value[1]
  }
  else if (value.length == 3) {
    var model = 'ward'
    var model_id = value[2]
  }
  else {
    var model = 'settlement'
    var model_id = value[3]
  }

  const geoForm = {}
  geoForm.model = model
  geoForm.id = model_id

  console.log(geoForm)
  const res = await getOneGeo(geoForm)

  console.log('LocGeo', res.data[0].json_build_object)


  if (newRecord.value) {
    geomScope.value = res.data[0].json_build_object

  }
  //const lastElement = array[array.length - 1];



  console.log('location field changed:', formData);

};




// Function to get the field change handler based on field name
const getFieldChangeHandler = (fieldName: string) => {


  if (fieldName == 'region_id') {
    onSelectRegion(formData[fieldName])
  }


  if (fieldName == 'county_id') {
    onSelectCounty(formData[fieldName])
  }


  if (fieldName == 'subcounty_id') {
    onSelectSubcounty(formData[fieldName])
  }
  if (fieldName == 'ward_id') {
    onSelectWard(formData[fieldName])
  }
  if (fieldName == 'settlement_id') {
    onSelectSettlement(formData[fieldName])
  }

  if (fieldName === 'implementation_scope') {
    clearLocationSelection()
    if (currentStep.value === LOCATION_STEP_INDEX && !isNationalScope.value) {
      locationFirstLoad.value = true
      searchLocations('')
    }
  }

  if (fieldName == 'location_option') {
    handleChangeLocationOption(formData[fieldName])
  }
  return undefined;
};


// Addd message if project Geometry is not found 
const wardMessage = "This settlement does not have location geometry defined. The ward geometry is shown instead. Edit to reflect the actual settlement location"

const isTourVisible = ref(false)
const showTour = () => {

  isTourVisible.value = true


}

const filteredTourSteps = computed(() => {

  const fil = tourSteps.value.filter(step => step.step == currentStep.value && step.visible == true);
  console.log('filteredTourSteps', fil)
  return fil
});


const endTour = () => {

}


const tourSteps = ref([
  {
    step: 0,
    target: '#btn1',
    title: 'Project title',
    content: 'Enter the full project name as it should appear on listings and reports.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Contract number',
    content: 'A unique reference or contract number used for tracking and audits.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn1d',
    title: 'Description',
    content: 'Optional summary of objectives, beneficiaries, or scope of works.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn3',
    title: 'Status',
    content: 'Current lifecycle stage — Planned, Ongoing, Suspended, or Completed.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn4',
    title: 'Delivery unit',
    content: 'The organisation responsible for implementing this project.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn41',
    title: 'Implementation level',
    content: 'Lowest administrative level covered — from National down to Settlement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn5',
    title: 'Commencement date',
    content: 'When implementation is expected to start or actually started.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn6',
    title: 'Completion date',
    content: 'Expected or actual project completion date. Must be after commencement.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn7',
    title: 'Total cost',
    content: 'Total contract value in Kenyan Shillings.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn8',
    title: 'Source of funding',
    content: 'Select all funders that apply — GoK, IDA, AFD, etc.',
    visible: true,
  },
  {
    step: 3,
    target: '#location-step',
    title: 'Location',
    content: 'Search for locations matching your implementation level and tick each area this project covers.',
    visible: true,
  },
]);


// Watch dependencies and log changes (or trigger additional actions)
watch(
  [currentStep, tourSteps],
  (newValues, oldValues) => {
    console.log("Dependencies changed:", newValues);
    console.log("Filtered steps:", filteredTourSteps.value);
    // Any other side effects or actions can be performed here
  },
  { immediate: true }
);

function resetProjectForm() {
  initializeFormSeq += 1
  Object.keys(formData).forEach((key) => {
    delete formData[key]
  })
  currentStep.value = 0
  newRecord.value = true
  showMessage.value = false
  geomScope.value = []
  area_ha.value = 0
  isTourVisible.value = false
  clearLocationSelection()
  activityOptions.value = []
  activitySearchKeyword.value = ''
  resetProgrammeComponentEditState()
  dynamicFormRef.value?.clearValidate()
}


</script>
<style scoped>
.project-form-embedded {
  min-height: 100%;
}

.box-card {
  width: 100%;
}

.steps-wrapper {
  margin-bottom: 4px;
}

.button-container {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px 0;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.button-container-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}

.step-btn-next {
  flex-direction: row-reverse;
  gap: 6px;
}

.step-btn-next :deep(.el-icon + span) {
  margin-left: 0;
}

.project-form-steps :deep(.el-step__title) {
  font-size: 13px;
  line-height: 1.3;
}

.project-form-steps :deep(.el-step__description) {
  font-size: 11px;
  line-height: 1.3;
  padding-right: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-input),
:deep(.el-select),
:deep(.el-tree-select),
:deep(.el-date-editor),
:deep(.project-cost-input) {
  width: 100%;
}

:deep(.project-cost-input .el-input__wrapper) {
  width: 100%;
}

:deep(.project-cost-input .el-input__inner) {
  text-align: left;
}

.location-step {
  padding: 4px 0 8px;
}

.location-step-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.programme-component-step {
  padding: 4px 0 8px;
}

.programme-step-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.programme-component-unchanged-alert {
  margin-top: 12px;
}

.programme-component-edit-section {
  margin-bottom: 12px;
}

.programme-component-summary {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.programme-component-toggle {
  margin-bottom: 8px;
}

.programme-component-fields {
  margin-top: 8px;
}

.location-national-alert {
  margin-bottom: 12px;
}

.location-search-input {
  margin-bottom: 12px;
}

.selected-locations {
  margin-bottom: 12px;
}

.selected-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.location-results {
  min-height: 120px;
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 8px 12px;
}

.location-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.location-option {
  padding: 4px 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.location-option:last-child {
  border-bottom: none;
}

.location-name {
  font-weight: 500;
}

.activity-step .location-name {
  font-size: 12px;
  font-weight: 400;
}

.location-detail {
  margin-left: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>

<style>
@media (max-width: 768px) {
  .project-form-steps .el-step__description {
    display: none;
  }

  .box-card {
    padding: 10px;
  }

  .cascader-popper-mobile {
    width: 100% !important;
    left: 0 !important;
    right: 0 !important;
    transform: none !important;
  }

  .button-container {
    margin-bottom: 10px;
    padding: 6px 0;
  }

  .button-container-actions {
    width: auto;
    justify-content: flex-end;
  }
}

.custom-cascader-popper .el-cascader__dropdown {
  /* Position the popper below instead of on the right */
  top: auto;
  left: 0;
  right: auto;
  bottom: -10px;
}
</style>

<style scoped>
.basemap {
  width: 100%;
  height: 65vh;
}



.coordinates {
  display: block;
  position: absolute;
  /* Use absolute positioning to position it within the container */
  width: 10%;
  bottom: 15;
  /* Set to 0 to align it at the bottom */
  left: 50%;
  /* Set to 50% to horizontally center it */
  transform: translateX(-50%);
  /* Use transform to horizontally center it */
  background-color: rgba(10, 10, 10, 0.85);
  color: #fbfbfb;
  text-align: center;
  font-size: 10px;
  z-index: 10;
  border-radius: 5px;
}


.upload {
  display: block;
  position: relative;
  width: 24%;
  top: 100px;
  left: 20px;
  /* Updated to move the element to the top left corner */
  background-color: rgba(195, 26, 26, 0.85);
  color: #fbfbfb;
  text-align: center;
  font-size: 10px;
  z-index: 10;
  border-radius: 5px;
}

.mapbox-custom-control {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.upload-filename {
  margin-left: 10px;
}

.switch-container {
  display: inline-block;
  width: auto;
  white-space: nowrap;
}


.my-image-button {
  background: url("data:image/png;base64 etc...");
}



.el-popper.is-customized {
  /* Set padding to ensure the height is 32px */
  padding: 6px 12px;
  background: linear-gradient(90deg, rgb(159, 229, 151), rgb(204, 229, 129));
}

.el-popper.is-customized .el-popper__arrow::before {
  background: linear-gradient(45deg, #b2e68d, #bce689);
  right: 0;
}
</style>
