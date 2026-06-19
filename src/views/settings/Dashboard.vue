<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty, searchByKeyWord } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, ElCard, } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Back,
  Plus,
  Download,
  Filter,
  Edit,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'
import PermissionWrapper from '@/components/PermissionWrapper.vue'
import { ref, reactive, onMounted } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDialog, ElForm, ElFormItem, ElInput, FormRules, ElCol, ElRow, ElCheckbox,
  ElPopconfirm, ElSwitch, ElTable, ElTableColumn, ElTour, ElTourStep
} from 'element-plus'
import { useRouter } from 'vue-router'
import exportFromJSON from 'export-from-json'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import ElementPlusIconPickerField from '@/components/ElementPlusIconPickerField.vue'
import { Icon } from '@/components/Icon'
import DownloadAll from '@/views/Components/DownloadAll.vue';
import { filterDashboardsForUser, isDashboardSettingsAdmin } from '@/utils/documentPermissions'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)

// We  ndeed to get all routes so that 
// we check againt new routes i.e new dashbaords 
const router = useRouter();
const allRoutes = router.getRoutes();
console.log('All Routes:', allRoutes);



const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const categoryOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const page = ref(1)

const selCounties = []
const loading = ref(true)
const pageSize = ref(5)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)
const showSuperAdminButtons = ref(false)



const mobileBreakpoint = 768;
const defaultpSize = 10;
const mobilepSize = 5;
const pSize = ref(defaultpSize);

// Function to update pSize based on window width
const updatepSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pSize.value = mobilepSize;
  } else {
    pSize.value = defaultpSize;
  }
};

// Set up event listener on mount
onMounted(() => {
  window.addEventListener('resize', updatepSize);
  updatepSize(); // Initial check
});



// flag for admin buttons
let filters = []
let filterValues = []

// flag for admin buttons

const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)





// Admins and dashboard managers see all dashboards; others see their own and public ones.
if (isDashboardSettingsAdmin(userInfo)) {
  showSuperAdminButtons.value = true
  filters = []
  filterValues = []
} else {
  filters = []
  filterValues = []
}


console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']

var tblData = []
const associated_Model = ''
const associated_multiple_models = []
const model = 'dashboard'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Dashboard')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)



const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  title: '',
  type: '',
  icon: null,
  main_dashboard: false,
  public: false,
  description: null

})


const typeOptions = [
  {
    value: 'intervention',
    label: 'Intervention'
  },
  {
    value: 'status',
    label: 'Status'
  },

]

const columns: TableColumn[] = [
  {
    field: '#',
    label: t('userDemo.index'),
    type: 'index'
  },

  {
    field: 'title',
    label: t('Title')
  },
  {
    field: 'icon',
    label: t('Icon')
  },

  {
    field: 'description',
    label: t('Description')
  },
  {
    field: 'action',
    label: t('Actions')
  }

]
const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}



const checkIfRouteExists = async (route: any) => {
  // Find the route by name
  const routeName = route;
  const resolvedRoute = allRoutes.find(route => route.name === routeName);

  console.log('Resolved Route:', resolvedRoute);

  if (resolvedRoute) {
    let msg = "Error. A route with same name exists. Try different Name"
    return msg
  } else {
    return null
  }
}






const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  getFilteredData(filters, filterValues)
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


const searchKeyword = ref(null)

const getFilteredData = async (selFilters, selfilterValues) => {
  loading.value = true
  try {
    const formData = {}
    formData.limit = pSize.value
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
    const res = await getSettlementListByCounty(formData)

    console.log('After Querry', res)
    const visibleRows = filterDashboardsForUser(userInfo, res.data)
    tableDataList.value = visibleRows
    total.value = visibleRows.length

    tblData = [] // reset the table data
    visibleRows.forEach(function (arrayItem) {
      var dd = flattenJSON(arrayItem)
      tblData.push(dd)
    })

    console.log('TBL-4f', tblData)
  } finally {
    loading.value = false
  }
}



const getIndicatorOptions = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'programme',
      searchField: 'title',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data

    // pass result to the makeoptions

    categories.value = ret
    makeOptions(categories)
  })
}



const makeOptions = (list) => {
  console.log('making the options..............', list)
  categoryOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.title  
    //  console.log(countyOpt)
    categoryOptions.value.push(countyOpt)
  })
}

const handleDownload = () => {
  downloadLoading.value = true
  const data = tblData
  const fileName = 'indicators.xlsx'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })
}


getIndicatorOptions()
getInterventionsAll()

console.log('Options---->', indicatorsOptions)
const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.title = data.row.title
  ruleForm.icon = data.row.icon
  ruleForm.description = data.row.description
  ruleForm.type = data.row.type
  ruleForm.main_dashboard = data.row.main_dashboard
  ruleForm.public = data.row.public


  formHeader.value = 'Edit Dashboard'


  AddDialogVisible.value = true
}


const DeleteIndicator = async (data: TableSlotDefault) => {
  const formData: any = {
    id: data.row.id,
    model,
    cascade: true,
  }

  try {
    const response = await DeleteRecord(formData)
    if (response?.code === '0000') {
      ElMessage.success(response.message || 'Dashboard and associated cards, tabs, and charts deleted.')
      const index = tableDataList.value.findIndex((row: any) => row.id === data.row.id)
      if (index !== -1) {
        tableDataList.value.splice(index, 1)
      }
    } else {
      ElMessage.error(response?.message || 'Delete failed.')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || error?.message || 'Delete failed.')
  }

  getFilteredData(filters, filterValues)
}


const handleClose = () => {

  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false


  formHeader.value = 'Add Dashboard'

}




const rules = reactive<FormRules>({
  title: [
    { required: true, message: 'Please provide a title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],
  type: [
    { required: true, message: 'Type is required', trigger: 'blur' },
  ],
  description: [
    { required: true, message: 'Description is required', trigger: 'blur' },
    { max: 50, message: 'Length should be 50 characters or less', trigger: 'blur' }

  ],
})

const AddIndicator = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {

    var exists = await checkIfRouteExists(ruleForm.title)

    if (exists) {
      ElMessage.error('A route with same name exists. Try a different Name')
    } else {

      if (valid) {
        ruleForm.model = model
        ruleForm.code = uuid.v4()
        const res = CreateRecord(ruleForm)

      } else {
        console.log('error submit!', fields)
      }
    }


  })
}


const editForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      ruleForm.model = model

      updateOneRecord(ruleForm).then(() => { })

      // dialogFormVisible.value = false


    } else {
      console.log('error submit!', fields)
    }
  })
}


const infoDialog = ref(false)




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


const remoteMethod = async (keyword) => {
  console.log(keyword)
  loading.value = true
  const formData = {}
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'title'
  formData.searchKeyword = searchKeyword.value
  formData.excludeGeom = false
  formData.excludeGeomAssoc = true
  formData.associated_multiple_models = []
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = []
  formData.filterValues = []

  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log("formData", formData)
  const res = await searchByKeyWord(formData)

  console.log("res.data", res.data)

  tableDataList.value = res.data
  total.value = res.total
  loading.value = false

}

const openHelp = ref(false)


</script>

<template>
  <el-card>

    <el-row type="flex" justify="space-between" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>



      <!-- Action Buttons -->
      <div style="display: flex; align-items: right  ; gap: 10px; margin-right: 10px;">

        <PermissionWrapper :permissions="'dashboard:create'">
          <el-tooltip content="Add Dashboard" placement="top">
            <el-button :onClick="AddIndicator" type="primary" :icon="Plus" />
          </el-tooltip>
        </PermissionWrapper>

        <PermissionWrapper :permissions="'dashboard:read'">
          <DownloadAll 
            :data="tblData" 
            :filename="'dashboard_data'" 
            :loading="downloadLoading"
            @download-start="downloadLoading = true"
            @download-complete="downloadLoading = false"
          />
        </PermissionWrapper>

        


      </div>
 
      <!-- Download All Component -->
    </el-row>


    <el-table v-loading="loading" :data="tableDataList" class="dashboards-table" table-layout="auto">
      <el-table-column label="#" type="index" width="50" />
      <el-table-column label="Dashboard" prop="title" min-width="180" show-overflow-tooltip sortable />
      <el-table-column label="Icon" min-width="140">
        <template #default="{ row }">
          <div class="dashboards-table-icon">
            <span v-if="row.icon" class="dashboards-table-icon-preview">
              <Icon
                :icon="row.icon"
                :size="18"
                color="#475569"
              />
            </span>
            <span class="dashboards-table-icon-name">{{ row.icon || '—' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Description" prop="description" min-width="220" show-overflow-tooltip sortable />
      <el-table-column label="Operations" min-width="180" align="right">
        <template #header>
          <el-input
v-model="searchKeyword" size="small" @change="remoteMethod" @blur="remoteMethod" @clear="handleClear"
            placeholder="Type to search" />
        </template>
        <template #default="scope">
         
          <PermissionWrapper :permissions="'dashboard:update'">
            <el-tooltip content="Edit" placement="top">
              <el-button
size="small" type="success" :icon="Edit" @click="editIndicator(scope as TableSlotDefault)"
                plain />
            </el-tooltip>
          </PermissionWrapper>

          <PermissionWrapper :permissions="'dashboard:delete'">
            <el-tooltip content="Delete" placement="top">
              <el-popconfirm
confirm-button-text="Yes" width="380" cancel-button-text="No" :icon="InfoFilled"
                icon-color="#626AEF" title="Delete this dashboard and all its cards, tabs, and charts?"
                @confirm="DeleteIndicator(scope as TableSlotDefault)">
                <template #reference>
                  <el-button size="small" v-if="showAdminButtons" type="danger" :icon=Delete plain />
                </template>
              </el-popconfirm>
            </el-tooltip>
          </PermissionWrapper>



        </template>
      </el-table-column>
    </el-table>




    <ElPagination
       layout="sizes,prev,pager,next, total" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4" />
  </el-card>

  <el-dialog v-model="AddDialogVisible" @close="handleClose" :title="formHeader" width="30%" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules" label-width="120px">

      <el-form-item id="btn1" label="Title" prop="title">
        <el-input v-model="ruleForm.title" />
      </el-form-item>

      <el-form-item id="btn2" label="Type" prop="type">
        <div class="type-field">
          <el-select
            v-model="ruleForm.type"
            clearable
            filterable
            collapse-tags
            placeholder="Select type of dashboard"
            style="width: 100%;"
          >
            <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <p class="field-hint">
            Status — based on entities in the database (settlements, facilities, households, etc.).<br />
            Intervention — based on M&amp;E indicators (outputs and outcomes).
          </p>
        </div>
      </el-form-item>

      <el-form-item id="btn4" label="Public" prop="public">
        <div class="public-field">
          <el-checkbox v-model="ruleForm.public" label="Make this dashboard public" />
          <p class="field-hint">
            When enabled, every user can see this dashboard in the menu. When off, only you (and admins) can see it.
          </p>
        </div>
      </el-form-item>

      <el-form-item id="btn5" label="Icon" prop="icon" class="icon-picker-form-field">
        <ElementPlusIconPickerField v-model="ruleForm.icon" />
      </el-form-item>

      <el-form-item id="btn6" label="Description" prop="description">
        <el-input type="textarea" v-model="ruleForm.description" />
      </el-form-item>
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button type="primary" plain @click="openHelp = true">Help</el-button>
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <PermissionWrapper :permissions="'dashboard:create'">
          <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        </PermissionWrapper>
        <PermissionWrapper :permissions="'dashboard:update'">
          <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
        </PermissionWrapper>
      </span>
    </template>
  </el-dialog>



  <el-dialog v-model="infoDialog" width="40%">
    <div class="info-dialog-content">
      <div class="info-dialog-section">
        <h4 class="info-heading">Status Dashboard:</h4>
        <p>
          Based on entities in the database — settlements, facilities, households, and other system records.
        </p>
      </div>
      <div class="info-dialog-section">
        <h4 class="info-heading">Intervention Dashboard:</h4>
        <p>
          Based on M&amp;E indicators — outputs, outcomes, and intervention reports.
        </p>
      </div>

      <div class="info-dialog-section">
        <h4 class="info-heading">Public Dashboard:</h4>
        <p>
          A dashboard that is accessible to everyone with access to the system. If not public, it is only visible to you and admins.
        </p>
      </div>

    </div>
  </el-dialog>


  <el-tour v-model="openHelp" z-index="100000">
    <el-tour-step target="#btn1" title="Title" description="This is the short name of the dashboards. This is what will appear under the navigation section for dashboards. Use a single short word." />
    <el-tour-step
target="#btn2" title="Type"
      description="Status dashboards use entities in the database (settlements, facilities, households, etc.). Intervention dashboards use M&amp;E indicators (outputs and outcomes)." />
    <el-tour-step
target="#btn4" title="Public"
      description="Make the dashboard visible to all users in the navigation menu. Leave unchecked to keep it private to you." />

    <el-tour-step
target="#btn5" title="Icon"
      description="Use Browse to pick an Element Plus icon, or Paste to enter a name (e.g. House) or legacy Iconify string (e.g. mdi:view-dashboard)." />

 <el-tour-step target="#btn6" title="Description" description="Provide a short narrative about this dashboard." />



  </el-tour>





</template>

<style scoped>
.info-dialog-content {
  padding: 5px;
}

.info-dialog-section {
  margin-bottom: 5px;
}

.info-dialog-section h4 {
  font-size: 1.2em;
  margin-bottom: 10px;
}

.info-dialog-section p {
  line-height: 1.5;
}

.info-heading {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 10px;
}

.dashboards-table {
  width: 100%;
}

.dashboards-table-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboards-table-icon-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.dashboards-table-icon-name {
  min-width: 0;
  word-break: break-word;
}

.icon-picker-form-field :deep(.icon-picker-panel) {
  width: 100%;
}

.public-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.type-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.field-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #94a3b8;
}
</style>