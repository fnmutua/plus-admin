<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import DownloadCustom from '@/views/Components/DownloadCustom.vue'
import { ElButton, ElSelect, ElTour, ElCard, ElTourStep } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Edit, Back,
  Search
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed, watch } from 'vue'
import {
  ElPagination, ElTable,
  ElTableColumn,
  ElTooltip, ElOption, ElDialog, ElDrawer, ElForm, ElFormItem, ElInput, FormRules, ElStep, ElSteps
} from 'element-plus'


import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import xlsx from "json-as-xlsx"
import DownloadAll from '@/views/Components/DownloadAll.vue';
import TableActions from '@/views/Components/TableActions.vue';
import PermissionWrapper from '@/components/PermissionWrapper.vue';
import AdjustableTableColumnPicker from '@/components/Users/AdjustableTableColumnPicker.vue'
import { Icon as AppIcon } from '@/components/Icon'
import { useAdjustableTableColumns, type AdjustableColumnSetting } from '@/composables/useAdjustableTableColumns'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)


const action_buttons = ref([])
if (showAdminButtons.value) {
  action_buttons.value = ['edit', 'delete']
} else if (showEditButtons.value) {

  action_buttons.value = ['edit']
}
else {
  action_buttons.value = []

}



console.log("userInfo--->", userInfo)


const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = '90%'
  actionColumnWidth.value = '75px'
} else {
  dialogWidth.value = '25%'
  actionColumnWidth.value = '160px'
}

const indicatorColumnDefaults = (): AdjustableColumnSetting[] => [
  { key: 'id', label: 'Id', width: 80, minWidth: 80, visible: true, hideable: true },
  { key: 'name', label: 'Title', width: undefined as any, minWidth: 180, visible: true, hideable: true },
  { key: 'activity', label: 'Activity', width: undefined as any, minWidth: 180, visible: true, hideable: true },
  { key: 'type', label: 'Type', width: undefined as any, minWidth: 120, visible: true, hideable: true },
  { key: 'format', label: 'Measurement', width: undefined as any, minWidth: 120, visible: false, hideable: true },
  { key: 'unit', label: 'Unit', width: undefined as any, minWidth: 100, visible: false, hideable: true },
]

const {
  showColumnPicker,
  isColumnVisible,
  columnWidth,
  columnMinWidth,
  hideableColumns,
  visibleColumnKeys,
  onHeaderDragend,
  resetColumns,
} = useAdjustableTableColumns('indicatorTableColumnsV1', indicatorColumnDefaults)

const equalTitleColumnsVisible = computed(
  () => isColumnVisible('name') && isColumnVisible('activity')
)

const idColumnWidth = () => {
  const w = columnWidth('id')
  return typeof w === 'number' && w > 40 ? w : 80
}

const flexColumnMinWidth = (key: 'name' | 'activity' | 'type' | 'format' | 'unit') => {
  const min = columnMinWidth(key) ?? 120
  const w = columnWidth(key)
  if (typeof w === 'number' && w > 40) {
    if (equalTitleColumnsVisible.value && (key === 'name' || key === 'activity')) {
      const otherKey = key === 'name' ? 'activity' : 'name'
      const otherW = columnWidth(otherKey)
      const saved = [w, otherW].filter((n): n is number => typeof n === 'number' && n > 40)
      if (saved.length) return Math.max(min, ...saved)
    }
    return Math.max(min, w)
  }
  return min
}



const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])

const hasActiveFilters = computed(
  () =>
    Boolean(searchKeyword.value?.trim()) ||
    (Array.isArray(value1.value) && value1.value.length > 0) ||
    (Array.isArray(value2.value) && value2.value.length > 0) ||
    (Array.isArray(value3.value) && value3.value.length > 0) ||
    filters.length > 0
)
const indicatorsOptions = ref([])
const settlementOptions = ref([])
const categories = ref([])
const searchKeyword = ref('')
const searchLoading = ref(false)
const downloadLoading = ref(false)
const page = ref(1)
const currentPage = ref(1)
const selCounties = []
const loading = ref(true)
const total = ref(0)

// Keep page and currentPage in sync
watch(page, (newPage) => {
  currentPage.value = newPage
})

watch(currentPage, (newCurrentPage) => {
  page.value = newCurrentPage
})





const mobileBreakpoint = 768;
const defaultPageSize = 10;
const mobilePageSize = 5;
const pageSize = ref(defaultPageSize);

// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;
  } else {
    pageSize.value = defaultPageSize;
  }
};

onMounted(async () => { 
 
 
 window.addEventListener('resize', updatePageSize);
   updatePageSize(); // Initial check
 
 
 })



 

console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['activity']
const model = 'indicator'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Indicator')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)
const activeStep = ref(0)



const searchByIndicatorName = async () => {
  const query = searchKeyword.value?.trim()

  if (!query || query.length < 3) {
    ElMessage.warning("Please enter at least 3 characters to search.")
    return
  }

  searchLoading.value = true
  await getFilteredBySearchData(query, true) // Reset to page 1 for new search
  searchLoading.value = false
}

// Real-time search with debouncing
let searchTimeout: any = null

const handleSearchInput = () => {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // Set a new timeout to search after user stops typing for 500ms
  searchTimeout = setTimeout(async () => {
    const query = searchKeyword.value?.trim()
    
    if (query && query.length >= 3) {
      searchLoading.value = true
      await getFilteredBySearchData(query, true) // Reset to page 1 for new search
      searchLoading.value = false
    } else if (!query) {
      // If search is cleared, show all data and reset page
      page.value = 1
      currentPage.value = 1
      getInterventionsAll()
    }
  }, 500)
}

const handleClear = async () => {
  console.log('cleared....')

  // Clear search timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }

  // clear all the filters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  searchKeyword.value = ''
  // Reset page size based on screen size
  updatePageSize()
  page.value = 1
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}


const handleSelectIndicator = async (indicator: any) => {
  var selectOption = 'id'
  if (!filters.includes(selectOption)) {
    filters.push(selectOption)
  }
  var index = filters.indexOf(selectOption) // 1
  console.log('category : index--->', index)

  // clear previously selected
  if (filterValues[index]) {
    // filterValues[index].length = 0
    filterValues.splice(index, 1)
  }

  if (!filterValues.includes(indicator) && indicator.length > 0) {
    filterValues.splice(index, 0, indicator) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (indicator.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}

const onPageChange = async (selPage: any) => {
  console.log('on page change: selected page ', selPage)
  page.value = selPage
  
  // Preserve search if there's a search keyword
  if (searchKeyword.value && searchKeyword.value.trim().length >= 3) {
    await getFilteredBySearchData(searchKeyword.value.trim(), false) // Don't reset page
  } else {
    getFilteredData(filters, filterValues)
  }
}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
  
  // Preserve search if there's a search keyword
  if (searchKeyword.value && searchKeyword.value.trim().length >= 3) {
    await getFilteredBySearchData(searchKeyword.value.trim(), false) // Don't reset page
  } else {
    getFilteredData(filters, filterValues)
  }
}

const getInterventionsAll = async () => {
  getFilteredData(filters, filterValues)
}

const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (key != 'geom') {

      if (typeof obj[key] !== 'object') {
        res[extraKey + key] = obj[key];
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}.`);
      };
    };
  }
  return res;
};


const getFilteredBySearchData = async (searchKey: string, resetPage = true) => {
  // Reset to page 1 when starting a new search
  if (resetPage) {
    page.value = 1
  }
  
  const formData: any = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1
  formData.model = model
  formData.searchField = 'name'
  formData.searchKeyword = searchKey
  formData.returnAll = false // Don't return all results, respect pagination
  formData.filters = filters
  formData.filterValues = filterValues
  formData.associated_multiple_models = associated_multiple_models

  const res: any = await searchByKeyWord(formData)
  tableDataList.value = res.data
  total.value = res.total

  tblData = [] // reset the table data
  tableDataList.value.forEach(function (arrayItem: any) {
    var dd = flattenJSON(arrayItem)
    tblData.push(dd)
  })
}

const getFilteredData = async (selFilters: any, selfilterValues: any) => {
  const formData: any = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = searchKeyword.value
  //--Single Filter -----------------------------------------

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)
  const res: any = await getSettlementListByCounty(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data
  total.value = res.total

  tblData = [] // reset the table data
  console.log('TBL-b4', tblData)
  res.data.forEach(function (arrayItem) {
    //  console.log(countyOpt)
    // delete arrayItem[associated_Model]['geom'] //  remove the geometry column

    var dd = flattenJSON(arrayItem)

    tblData.push(dd)
  })

  console.log('TBL-4f', tblData)
}



const getIndicatorOptions = async () => {
}



const makeSettlementOptions = (list) => {
  console.log('making the options..............', list)
  settlementOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.name  
    //  console.log(countyOpt)
    settlementOptions.value.push(countyOpt)
  })
}


type SelectOption = { label?: string; value?: unknown; [key: string]: unknown }

const activityOptions = ref<SelectOption[]>([])

const sortSelectOptionsByLabel = (options: SelectOption[]) =>
  options.sort((a, b) =>
    String(a.label ?? '').localeCompare(String(b.label ?? ''), undefined, { sensitivity: 'base' })
  )

const getActivityOptions = async () => {
  activityOptions.value = []
  await getCountyListApi({
    params: {
      curUser: 1,
      model: 'activity',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    response.data.forEach(function (arrayItem: { id: string; title: string }) {
      activityOptions.value.push({
        value: arrayItem.id,
        label: arrayItem.title
      })
    })
    sortSelectOptionsByLabel(activityOptions.value)
  })
}


getActivityOptions()
getIndicatorOptions()
getInterventionsAll()

console.log('Options---->', indicatorsOptions)
const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  activeStep.value = 0
  console.log(data)
  ruleForm.id = data.id
  ruleForm.name = data.name
  ruleForm.type = data.type
  ruleForm.format = data.format
  ruleForm.level = data.level
  ruleForm.unit = data.unit
  ruleForm.activity_id = data.activity_id
  formHeader.value = 'Edit Indicator'


  AddDialogVisible.value = true
}


const DeleteIndicator = (data: TableSlotDefault) => {
  console.log('----->', data.id)
  let formData = {}
  formData.id = data.id
  formData.model = 'indicator'
  DeleteRecord(formData)
  console.log(tableDataList.value)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    tableDataList.value.splice(index, 1);
  }

  getFilteredData(filters, filterValues)
}


const handleClose = () => {
  showSubmitBtn.value = true
  showEditSaveButton.value = false
  activeStep.value = 0
  ruleForm.id = ''
  ruleForm.name = ''
  ruleForm.type = ''
  ruleForm.format = ''
  ruleForm.level = ''
  ruleForm.unit = ''
  ruleForm.activity_id = null

  formHeader.value = 'Add Indicator'
  AddDialogVisible.value = false
}

 

const ruleFormRef = ref<FormInstance>()

const ruleForm = reactive({
  name: '',
  type: '',
  unit: '',
  level: '',
  format: '',
  activity_id: null,
  desc: '',
})

const rules = reactive({

  name: [
    { required: true, message: 'Please provide indicator name', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Indicator type is required', trigger: 'blur' }],

  activity_id: [
    {
      validator: (_rule, value, callback) => {
        if (ruleForm.level === 'activity' && !value) {
          callback(new Error('Activity is required'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],


  format: [
    { required: true, message: 'Indicator measurement is required', trigger: 'blur' }],

  level: [
    { required: true, message: 'The  level is required', trigger: 'blur' }
  ]
})

const AddIndicator = async () => {
  if (activityOptions.value.length === 0) {
    await getActivityOptions()
  }
  activeStep.value = 0
  AddDialogVisible.value = true
}

const step0Fields = computed(() => {
  const fields: string[] = ['level', 'name']
  if (ruleForm.level === 'activity') fields.push('activity_id')
  return fields
})

const validateCurrentStep = async () => {
  if (!ruleFormRef.value) return false
  const fields = activeStep.value === 0 ? step0Fields.value : ['type', 'format']
  try {
    await ruleFormRef.value.validateField(fields)
    return true
  } catch {
    return false
  }
}

const nextStep = async () => {
  const valid = await validateCurrentStep()
  if (valid && activeStep.value < 1) {
    activeStep.value++
  }
}

const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}



const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      ruleForm.model = 'indicator'
      ruleForm.code = uuid.v4()
      try {
        await CreateRecord(ruleForm)
        page.value = 1
        currentPage.value = 1
        const query = searchKeyword.value?.trim()
        if (query && query.length >= 3) {
          await getFilteredBySearchData(query, true)
        } else {
          await getFilteredData(filters, filterValues)
        }
        handleClose()
      } catch (error) {
        console.error('Error creating record:', error)
        ElMessage.error('Failed to create indicator')
      }
    } else {
      ElMessage.error('Please fill in all the required fields')
    }
  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;

  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = 'indicator';

      updateOneRecord(ruleForm)
        .then((updatedRecord) => {
          // Assuming you get the updated record back from the API
          if (updatedRecord) {
            console.log('updatedRecord',updatedRecord)
            getFilteredData(filters, filterValues)

              AddDialogVisible.value=false
                handleClose()
          }
         
        })
        .catch((error) => {
          console.error('Error updating record:', error);
        });
    } else {
      console.log('error submit!', fields);
    }
  });
};



const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "index" }, // Top level data
    { label: "Title", value: "title" }, // Custom format
    { label: "Activity", value: "activity" }, // Top level data
    { label: "level", value: "level" }, // Custom format
    { label: "Format", value: "format" }, // Custom format
    { label: "Unit", value: "unit" } // Custom format

  ]


  // Preprae the data object 
  var dataObj = {}
  dataObj.sheet = 'data'
  dataObj.columns = fields

  let dataHolder = []
  // loop through the table data and sort the data 
  // change here !
  for (let i = 0; i < tableDataList.value.length; i++) {
    let thisRecord = {}
    tableDataList.value[i]
    thisRecord.index = i + 1
    thisRecord.title = tableDataList.value[i].name
    thisRecord.activity = tableDataList.value[i].activity.title
    thisRecord.level = tableDataList.value[i].level
    thisRecord.format = tableDataList.value[i].format
    thisRecord.unit = tableDataList.value[i].unit


    dataHolder.push(thisRecord)
  }
  dataObj.content = dataHolder




  let settings = {
    fileName: model, // Name of the resulting spreadsheet
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  }

  // Enclose in array since the fucntion expects an array of sheets
  xlsx([dataObj], settings) //  download the excel file

}

const openHelp = ref(false)

const AddActivityDialog = ref(false)
const AddNewActivity = () => {
  console.log('adding....')
  AddActivityDialog.value = true

}


const handleCloseActivity = () => {
  AddActivityDialog.value = false

}


const ActivityFormRef = ref<FormInstance>()
const activity_form = reactive({
  title: '',
  shortTitle: ''
})

const freqRules = reactive({

  title: [
    { required: true, message: 'Please provide an activity title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],

  shortTitle: [
    { required: true, message: 'A shorter title is required', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],


})


const submitActivityForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      activity_form.model = 'activity'
      activity_form.code = uuid.v4()
      const res = await CreateRecord(activity_form)
      activityOptions.value.push({
        value: res.data.id,
        label: res.data.title
      })
      sortSelectOptionsByLabel(activityOptions.value)
      ruleForm.activity_id = res.data.id
      AddActivityDialog.value = false
      activity_form.title = ''
      activity_form.shortTitle = ''
    } else {
      console.log('error activity form!', fields)
    }
  })
}


const router = useRouter()

const goBack = () => {
  // Add your logic to handle the back action
  // For example, you can use Vue Router to navigate back
  if (router) {
    // Use router.back() to navigate back
    router.back()
  } else {
    console.warn('Router instance not available.')
  }
}


const handleSwitchChange = async (value) => {
 
  console.log(value)

  if (value=='project') {
       
          ruleForm.activity_id=null
        // Add your custom logic here
      } else {
        // The switch is active (set to 'Activity Level Indicator')
        console.log('Switch is active');

        
      }


}


</script>

<template>
  <el-card class="indicator-page-card">
    <div
      class="sett-toolbar-row"
      :class="isMobile ? 'sett-toolbar-row--compact' : 'sett-toolbar-row--wide'"
    >
      <div class="sett-toolbar-col sett-toolbar-col--back">
        <el-button type="primary" plain :icon="Back" @click="goBack" size="small">
          Back
        </el-button>
      </div>

      <div class="sett-toolbar-col sett-toolbar-col--search">
        <el-input
          v-model="searchKeyword"
          placeholder="Search Indicator by Name"
          clearable
          @input="handleSearchInput"
          @change="searchByIndicatorName"
          @clear="handleClear"
          style="width: 100%;"
        >
          <template #append>
            <el-button v-loading="searchLoading" :icon="Search" @click="searchByIndicatorName" />
          </template>
        </el-input>
      </div>

      <div class="sett-toolbar-col sett-toolbar-col--actions">
        <div class="sett-toolbar-actions" :class="{ 'sett-toolbar-actions--desktop': !isMobile }">
          <PermissionWrapper :permissions="['indicator:create']">
            <el-tooltip content="Add Indicator" placement="top">
              <el-button @click="AddIndicator" type="primary" :icon="Plus" />
            </el-tooltip>
          </PermissionWrapper>

          <el-tooltip v-if="hasActiveFilters" content="Clear all filters" placement="top">
            <el-button type="primary" @click="handleClear">
              <AppIcon icon="mdi:filter-remove" width="22" height="22" />
            </el-button>
          </el-tooltip>

          <AdjustableTableColumnPicker
            v-model:show-column-picker="showColumnPicker"
            v-model:visible-column-keys="visibleColumnKeys"
            :hideable-columns="hideableColumns"
            @reset="resetColumns"
          />

          <PermissionWrapper :permissions="['indicator:read']">
            <DownloadCustom
              :data="tableDataList"
              :model="model"
              :associated_models="associated_multiple_models"
              :loading="downloadLoading"
              :total="total"
              :filters="filters"
              :filter-values="filterValues"
              @download-start="downloadLoading = true"
              @download-end="downloadLoading = false"
            />
          </PermissionWrapper>
        </div>
      </div>
    </div>








    <div class="indicator-table-wrap">
      <el-table
        fit
        table-layout="fixed"
        :data="tableDataList"
        :loading="loading"
        :show-overflow-tooltip="true"
        class="indicator-table"
        style="width: 100%; margin-top: 10px;"
        border
        row-key="id"
        @header-dragend="onHeaderDragend"
      >
        <el-table-column
          v-if="isColumnVisible('id')"
          column-key="id"
          label="Id"
          prop="id"
          :width="idColumnWidth()"
          :min-width="columnMinWidth('id')"
          sortable
          resizable
        >
          <template #default="{ row }">
            <span>{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('name')"
          column-key="name"
          label="Title"
          prop="name"
          class-name="indicator-col-equal"
          :min-width="flexColumnMinWidth('name')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('activity')"
          column-key="activity"
          label="Activity"
          prop="activity.title"
          class-name="indicator-col-equal"
          :min-width="flexColumnMinWidth('activity')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ row.activity?.title }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('type')"
          column-key="type"
          label="Type"
          prop="type"
          :min-width="flexColumnMinWidth('type')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ row.type }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('format')"
          column-key="format"
          label="Measurement"
          prop="format"
          :min-width="flexColumnMinWidth('format')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ row.format }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isColumnVisible('unit')"
          column-key="unit"
          label="Unit"
          prop="unit"
          :min-width="flexColumnMinWidth('unit')"
          sortable
          resizable
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span>{{ row.unit }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Actions" :width="actionColumnWidth">
          <template #default="{ row }">
            <PermissionWrapper :permissions="['indicator:update', 'indicator:delete']">
              <TableActions :item="row" :buttons="action_buttons" @edit="editIndicator" @delete="DeleteIndicator" />
            </PermissionWrapper>
          </template>
        </el-table-column>
      </el-table>
    </div>


    <ElPagination
      :layout="isMobile ? 'prev, pager, next, total' : 'sizes, prev, pager, next, total'"
      v-model:currentPage="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 15, 20, 50, 100]"
      :total="total"
      :background="true"
      @size-change="onPageSizeChange"
      @current-change="onPageChange"
      class="mt-4"
      :small="isMobile"
      :pager-count="isMobile ? 3 : 7"
    />
  </el-card>

  <el-drawer
    v-model="AddDialogVisible"
    direction="rtl"
    :size="dialogWidth"
    :title="formHeader"
    @close="handleClose"
  >
    <el-steps :active="activeStep" align-center finish-status="success" class="indicator-drawer-steps">
      <el-step title="Indicator details" description="Level, activity & title" />
      <el-step title="Measurement" description="Type, format & unit" />
    </el-steps>

    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-position="top">
      <template v-if="activeStep === 0">
        <el-form-item id="btn1" label="Level" prop="level">
          <el-select v-model="ruleForm.level" placeholder="Level" :onChange="handleSwitchChange" style="width: 100%;">
            <el-option label="Activity" value="activity" />
            <el-option label="Project" value="project" />
          </el-select>
          <p class="field-hint">Activity level ties the indicator to one work package; Project level applies across the whole project.</p>
        </el-form-item>

        <el-form-item v-if="ruleForm.level == 'activity'" id="btn2" label="Activity" prop="activity_id">
          <div class="form-inline-add">
            <el-select
              filterable
              v-model="ruleForm.activity_id"
              placeholder="Select Activity"
              style="width: 100%;"
            >
              <el-option v-for="item in activityOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" @click="AddNewActivity" :icon="Plus" plain />
          </div>
          <p class="field-hint">Sorted alphabetically. Use <strong>+</strong> to create a new activity if it is not listed.</p>
        </el-form-item>

        <el-form-item id="btn3" label="Title" prop="name">
          <el-input v-model="ruleForm.name" placeholder="e.g. Number of beneficiaries reached" style="width: 100%;" />
          <p class="field-hint">Unique name used in reports, dashboards, and M&amp;E configuration.</p>
        </el-form-item>
      </template>

      <template v-else>
        <el-form-item id="btn4" label="Type" prop="type">
          <el-select v-model="ruleForm.type" placeholder="Type" style="width: 100%;">
            <el-option label="Output" value="output" />
            <el-option label="Impact" value="outcome" />
          </el-select>
          <p class="field-hint">Output = immediate results; Impact = longer-term outcomes.</p>
        </el-form-item>

        <el-form-item id="btn5" label="Measurement" prop="format">
          <el-select v-model="ruleForm.format" placeholder="Format" style="width: 100%;">
            <el-option label="Number" value="number" />
            <el-option label="Percent" value="percent" />
            <el-option label="Yes/No (true/false)" value="boolean" />
          </el-select>
          <p class="field-hint">How values are recorded in the field (count, percentage, or yes/no).</p>
        </el-form-item>

        <el-form-item id="btn6" label="Unit" prop="format">
          <el-select clearable filterable v-model="ruleForm.unit" allow-create placeholder="Unit" style="width: 100%;">
            <el-option label="Kilometre" value="Km" />
            <el-option label="Number" value="No." />
            <el-option label="Yes/No" value="Yes/No" />
            <el-option label="Household" value="HH" />
          </el-select>
          <p class="field-hint">Unit of measure shown alongside reported values (e.g. Km, HH).</p>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <div class="drawer-footer-bar">
        <el-button type="primary" plain @click="openHelp = true">Help</el-button>
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="activeStep > 0" @click="prevStep">Previous</el-button>
        <el-button v-if="activeStep < 1" type="primary" @click="nextStep">Next</el-button>
        <el-button v-if="showSubmitBtn && activeStep === 1" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton && activeStep === 1" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </div>
    </template>
  </el-drawer>

  <el-tour v-model="openHelp" z-index="100000">
    <el-tour-step
target="#btn1" title="Level"
      description="Select the level at which the indicator's data will be reported - either Activity level or Project level" />
      
    <el-tour-step
target="#btn3" title="Title"
      description="Enter a unique name for the indicator. This name will be used to identify the indicator in reports and dashboards" />
      
    <el-tour-step
target="#btn4" title="Type"
      description="Select whether this indicator measures an 'Impact' or an 'Output.' Impact: Long-term effects or changes. Output: Immediate results or products of activities" />
      
    <el-tour-step
target="#btn5" title="Measurement"
      description="Specify how the indicator will be calculated - as a Number, Percentage, or Yes/No (boolean) value" />

    <el-tour-step
target="#btn6" title="Unit"
      description="Specify the unit of measurement for this indicator (e.g., Kilometer, Number, Household). You can also create custom units" />

  </el-tour>



  <el-dialog
    v-model="AddActivityDialog"
    @close="handleCloseActivity"
    title="Add Activity"
    :width="dialogWidth"
    draggable
  >
    <el-form ref="ActivityFormRef" :model="activity_form" :rules="freqRules" label-position="top">
      <el-form-item label="Title" prop="title">
        <el-input v-model="activity_form.title" style="width: 100%;" />
        <p class="field-hint">Full descriptive name of the activity.</p>
      </el-form-item>

      <el-form-item label="Short Title" prop="shortTitle">
        <el-input v-model="activity_form.shortTitle" style="width: 100%;" />
        <p class="field-hint">Abbreviated label for <strong>SlumMapper mobile</strong>.</p>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="AddActivityDialog = false">Cancel</el-button>
        <el-button type="primary" @click="submitActivityForm(ActivityFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.sett-toolbar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  min-width: 0;
}

.sett-toolbar-row--compact {
  flex-wrap: nowrap;
}

.sett-toolbar-row--wide {
  flex-wrap: nowrap;
}

.sett-toolbar-col {
  min-width: 0;
}

.sett-toolbar-col--back {
  flex: 0 0 auto;
}

.sett-toolbar-row--wide .sett-toolbar-col--search {
  flex: 1 1 0;
  min-width: 160px;
  max-width: 320px;
}

.sett-toolbar-row--wide .sett-toolbar-col--actions {
  flex: 1 1 auto;
  min-width: 0;
  margin-left: auto;
}

.sett-toolbar-row--compact .sett-toolbar-col--search {
  flex: 1 1 120px;
}

.sett-toolbar-row--compact .sett-toolbar-col--actions {
  flex: 0 0 auto;
}

.sett-toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  flex-wrap: nowrap;
  width: 100%;
}

.sett-toolbar-actions--desktop {
  flex-wrap: wrap;
}

.indicator-page-card {
  width: 100%;
}

.indicator-page-card :deep(.el-card__body) {
  width: 100%;
}

.indicator-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.indicator-table-wrap :deep(.indicator-table),
.indicator-table-wrap :deep(.el-table__inner-wrapper),
.indicator-table-wrap :deep(.el-table__header-wrapper),
.indicator-table-wrap :deep(.el-table__body-wrapper) {
  width: 100% !important;
}

.indicator-table-wrap :deep(.el-table__header colgroup col),
.indicator-table-wrap :deep(.el-table__body colgroup col) {
  min-width: 0;
}

.indicator-table-wrap :deep(.el-table__header table),
.indicator-table-wrap :deep(.el-table__body table) {
  width: 100% !important;
  table-layout: fixed;
}

.indicator-table-wrap :deep(.el-table__empty-block) {
  width: 100% !important;
}

.drawer-footer-bar {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color);
  text-align: right;
}

.indicator-drawer-steps {
  margin-bottom: 20px;
}

.form-inline-add {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
}

.field-hint strong {
  font-weight: 600;
}
</style>
