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
import DownloadAll from '@/views/Components/DownloadAll.vue';


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





// filter Charts only admins can see all 
if (userInfo.roles.includes("admin") || userInfo.roles.includes("super_admin")) {
  showSuperAdminButtons.value = true
  filters = []
  filterValues = []
}
else {

  filters = ['createdBy']
  filterValues = [[userInfo.id]]
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
  //console.log(formData)
  const res = await getSettlementListByCounty(formData)

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

    loading.value = false
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
    countyOpt.label = arrayItem.title + '(' + arrayItem.id + ')'
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
  console.log('--xxx--->', data.row.id)
  let formData = {}
  formData.id = data.row.id
  formData.model = model


  await DeleteRecord(formData).then(response => {
    console.log(response)
    // remove the deleted object from array list 
    let index = tableDataList.value.indexOf(data);
    if (index !== -1) {
      tableDataList.value.splice(index, 1);

    }

  })
    .catch(error => {
      console.log(error)
      ElMessage.error(error)
    });



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

    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>



      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px;">

        <el-tooltip content="Add Dashboard" placement="top">
          <el-button :onClick="AddIndicator" type="primary" :icon="Plus" />
        </el-tooltip>

        <el-tooltip content="Download" placement="top">
          <el-button :onClick="handleDownload" type="primary" :icon="Download" />
        </el-tooltip>

        <el-tooltip content="Clear" placement="top">
          <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </el-tooltip>


      </div>
      <DownloadAll v-if="showEditButtons" :model="model" :associated_models="associated_multiple_models" />

      <!-- Download All Component -->
    </el-row>


    <el-table :data="tableDataList" style="width: 100%">
      <el-table-column label="#" type="index" width="50" />
      <el-table-column label="Title" prop="title" />
      <el-table-column label="Description" prop="description" />
      <el-table-column align="right">
        <template #header>
          <el-input
v-model="searchKeyword" :onChange="remoteMethod" :onBlur="remoteMethod" :onClear="handleClear"
            placeholder="Type to search" />
        </template>
        <template #default="scope">
          <el-button size="small" @click="editIndicator(scope)">
            Edit
          </el-button>

          <el-button size="small" type="danger" @click="DeleteIndicator(scope)">
            Delete
          </el-button>


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
        <el-select
v-model="ruleForm.type" :onClear="handleClear" clearable filterable collapse-tags
          placeholder="Select Type of dashboard">
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>

 
      </el-form-item>
      <el-row>

        <el-col :xs="12" :sm="24" :md="12" :lg="12" :xl="12">
          <el-form-item id="btn3" label="Main" prop="main_dashboard">
            <el-switch v-model="ruleForm.main_dashboard" />
          </el-form-item>
        </el-col>


        <el-col :xs="12" :sm="24" :md="12" :lg="12" :xl="12">
          <el-form-item id="btn4" prop="public" v-if="showSuperAdminButtons">
            <el-checkbox v-model="ruleForm.public" label="Public" />
          </el-form-item>
        </el-col>
      </el-row>


      <el-form-item id="btn5" label="Icon" prop="icon">
        <el-tooltip class="item" effect="dark" placement="top">
          <template #content>
            <div>
              <p>Get Icons from <a href="https://iconify.design/" target="_blank">https://iconify.design/</a></p>
            </div>
          </template>
          <el-input v-model="ruleForm.icon" />
        </el-tooltip>
        <a
v-if="ruleForm.icon" :href="'https://icnoffydesign.com/icons/' + ruleForm.icon" target="_blank"
          rel="noopener noreferrer">
        </a>
      </el-form-item>

      <el-form-item id="btn6" label="Description" prop="description">
        <el-input type="textarea" v-model="ruleForm.description" />
      </el-form-item>
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button type="primary" plain @click="openHelp = true">Help</el-button>
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>



  <el-dialog v-model="infoDialog" width="40%">
    <div class="info-dialog-content">
      <div class="info-dialog-section">
        <h4 class="info-heading">Status Dashboard:</h4>
        <p>
          A dashboard that draws data from the entities within the system. It allows configurations of summaries related
          to settlements, facilities, etc.
        </p>
      </div>
      <div class="info-dialog-section">
        <h4 class="info-heading"> Interventions Dashboard:</h4>
        <p>
          A dashboard that draws data exclusively from slum interventions such as construction of infrastructure,
          issuance
          of titles, and more. The dashboard draws data from the indicator reports (output and outcomes).
        </p>
      </div>

      <div class="info-dialog-section">
        <h4 class="info-heading">Public Dashboard:</h4>
        <p>
          A dashboard that is accessible to everyone with access to the system, else exclusive to the creator.
        </p>
      </div>

      <div class="info-dialog-section">
        <h4 class="info-heading">Main Dashboard:</h4>
        <p>
          The Default dashboard. There can only be on such dashboard.
        </p>
      </div>


    </div>
  </el-dialog>


  <el-tour v-model="openHelp" z-index="100000">
    <el-tour-step target="#btn1" title="Title" description="This is the short name of the dashboards. This is what will appear under the navigation section for dashboards. Use a single short word." />
    <el-tour-step
target="#btn2" title="Type"
      description="The system supports two types of dashboards 'Status' : draws on the various entities within the system eg settlements, facilities, households e.t.c. The 'Intervention' type draws data exclusively from the M&E indicators" />
    <el-tour-step
target="#btn3" title="Main"
      description="A main dashboard remains after creation and cannot be deleted. For custom dashboards, keep this disabled" />
    <el-tour-step
target="#btn4" title="Public"
      description=" Allows the dashboards to be visible to every user. Keep it unchecked for your own custom dashboards" />

    <el-tour-step
target="#btn5" title="Icon"
      description="This is the icon to appear on the dashboards navigation menu/navbar. The icons are available from https://icon-sets.iconify.design/?category=General. Copy the icon name and paste here." />

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
</style>