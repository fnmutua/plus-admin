<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getCountyListApi } from '@/api/counties'

import { getGrievances } from '@/api/grievance'

import { ElButton, ElSelect, ElCheckbox,ElCol,} from 'element-plus'
import {
  Plus,
  Download,
  Filter, More,
  Edit,
  Back,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDialog, ElForm, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElFormItem, ElRow, ElInput, FormRules, ElPopconfirm, ElTable, ElTableColumn, ElCard, ElDrawer
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import xlsx from "json-as-xlsx"
 
import writeXlsxFile from 'write-excel-file';



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)


const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "160px"

}


function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const { push } = useRouter()
const value1 = ref([])
const value2 = ref([])
var value3 = ref([])
const indicatorsOptions = ref([])
const GrvOptions = ref([])
const categories = ref([])
const filteredIndicators = ref([])
const page = ref(1)

const selCounties = []
const loading = ref(true)
const currentPage = ref(1)
const total = ref(0)
const downloadLoading = ref(false)



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


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)




let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = ['status']
var filterValues = [['Open']]
var tblData = []
const associated_Model = ''
const associated_multiple_models = ['county', 'settlement', 'grievance_document']
const model = 'grievance'
//// ------------------parameters -----------------------////

const { t } = useI18n()
const AddDialogVisible = ref(false)
const formHeader = ref('Add Grievance')
const showSubmitBtn = ref(true)
const showEditSaveButton = ref(false)







const handleClear = async () => {
  console.log('cleared....')

  // clear all the fileters -------
  filterValues = []
  filters = []
  value1.value = ''
  value2.value = ''
  value3.value = ''
  pageSize.value = 5
  currentPage.value = 1
  tblData = []
  //----run the get data--------
  getInterventionsAll()
}


const handleSelectActivity = async (indicator: any) => {
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
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
  pageSize.value = size
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


const getFilteredData = async (selFilters, selfilterValues) => {
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model
  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchKeyword = ''
  //--Single Filter -----------------------------------------

  formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = selFilters
  formData.filterValues = selfilterValues
  formData.associated_multiple_models = associated_multiple_models

  //-------------------------
  //console.log(formData)
  const res = await getGrievances(formData)

  console.log('After Querry', res)
  tableDataList.value = res.data

  availableFields.value = extractFields(tableDataList.value);



  total.value = res.total
}



const getIndicatorOptions = async () => {
  const res = await getCountyListApi({
    params: {
      //   pageIndex: 1,
      //   limit: 100,
      curUser: 1, // Id for logged in user
      model: 'grievance',
      searchField: 'name',
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
  GrvOptions.value = []
  list.value.forEach(function (arrayItem: { id: string; type: string }) {
    var countyOpt = {}
    countyOpt.value = arrayItem.id
    countyOpt.label = arrayItem.code
    //  console.log(countyOpt)
    GrvOptions.value.push(countyOpt)
  })
}




console.log('Options---->', indicatorsOptions)
const editIndicator = (data: TableSlotDefault) => {
  showSubmitBtn.value = false
  showEditSaveButton.value = true
  console.log(data)
  ruleForm.id = data.row.id
  ruleForm.title = data.row.title
  ruleForm.shortTitle = data.row.shortTitle



  formHeader.value = 'Edit Component'


  AddDialogVisible.value = true
}


const DeleteIndicator = async (data: TableSlotDefault) => {
  console.log('----->', data.id)
  let formData = {}
  formData.id = data.id
  formData.model = model
  await DeleteRecord(formData)

  // remove the deleted object from array list 
  let index = tableDataList.value.indexOf(data);
  if (index !== -1) {
    console.log('Remove index', index)

    tableDataList.value.splice(index, 1);
    console.log(tableDataList.value)

  }




  getFilteredData(filters, filterValues)
}

const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive({
  title: '',
  shortTitle: ''
})
const handleClose = () => {

  console.log("Clsoing the dialoig")
  showSubmitBtn.value = true
  showEditSaveButton.value = false

  ruleForm.id = ''
  ruleForm.title = ''
  ruleForm.shortTitle = ''
  formHeader.value = 'Add Activity'

}




const rules = reactive<FormRules>({
  title: [
    { required: true, message: 'Please provide A title', trigger: 'blur' },
    { min: 3, message: 'Length should be at least 3 characters', trigger: 'blur' }
  ],

})

const AddComponent = () => {
  AddDialogVisible.value = true
}


const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      ruleForm.model = model
      ruleForm.code = uuid.v4()
      const res = await CreateRecord(ruleForm)
      console.log('inserted object', res.data)
      tableDataList.value.push(res.data)  // Add the added object on the list 


    } else {
      console.log('error submit!', fields)
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



getIndicatorOptions()
getInterventionsAll()


const DownloadXlsx = async () => {
  console.log(tableDataList.value)

  // change here !
  let fields = [
    { label: "S/No", value: "id" }, // Top level data
    { label: "Title", value: "title" }, // Top level data
    { label: "Code", value: "code" }, // Custom format

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
    thisRecord.id = tableDataList.value[i].id
    thisRecord.title = tableDataList.value[i].title
    thisRecord.code = tableDataList.value[i].code


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

const tableRowClassName = (data) => {
  // console.log('Row Styling --------->', data.row)
  if (data.row.documents.length > 0) {
    return 'warning-row'
  }
  return ''
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


const drawer = ref(false)

const handleCloseGrievance = () => {
  drawer.value = false
}

const getGrievanceDetails = (data) => {
 // drawer.value = true

  push({
     name: 'GrievanceDetails',
    params: { id: data.row.id }
  })


  console.log(data)
}

const ActionOptions = [
  {
    value: 'Resolved',
    label: 'Mark as Resolved',
  },
  {
    value: 'Escalated',
    label: 'Escalate to next Level',
  },

  
  {
    value: 'Document Requested',
    label: 'Ask for Documentation from complainant',
  },
]
const formAction = ref({
  grievance_id : null ,
  action_type : null ,
  action_by : null ,
  date_actioned : null ,
  prev_status : null ,
  new_status : null ,
});
  
const showDownloadDialog = ref(false);

const selectedFields = ref([]);
const availableFields = ref([]);

const selectDownload = () => {
showDownloadDialog.value = true;
};


const extractFields = (data) => {
  const fields = new Set();

  function traverse(obj, prefix = "", isNested = false) {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (isNested) {
          // In nested objects or arrays, include only id, name, or title
          if (["id", "name", "title"].includes(key)) {
            fields.add(fullPath);
          }
        } else {
          // In the main array, exclude geo fields
          if (!isGeoField(fullPath)) {
            if (typeof obj[key] === "object" && obj[key] !== null) {
              if (Array.isArray(obj[key])) {
                if (obj[key].length > 0 && typeof obj[key][0] === "object") {
                  traverse(obj[key][0], fullPath, true); // Nested array
                }
              } else {
                traverse(obj[key], fullPath, true); // Nested object
              }
            } else {
              fields.add(fullPath);
            }
          }
        }
      }
    }
  }

  function isGeoField(fieldName) {
    const geoKeywords = ["geo", "lat", "lng", "coordinate", "longitude", "latitude","createdAt"];
    return geoKeywords.some(keyword => fieldName.toLowerCase().includes(keyword));
  }

  data.forEach(item => traverse(item));
  return Array.from(fields);
};

// Function to extract data based on selected fields
const extractData = (data, selectedFields) => {
  return data.map(row => {
    const extractedRow = {};
    selectedFields.forEach(field => {
      if (row.hasOwnProperty(field)) {
        extractedRow[field] = row[field];
      }
    });
    return extractedRow;
  });
};


const downloadCSV = async() => {
  // Implement your CSV download logic here
console.log(selectedFields.value)
 

const formattedData = computed(() => extractData( tableDataList.value, selectedFields.value));


console.log(formattedData.value)


 
  // Define column headers
  // Define column headers
  const  columns = selectedFields.value.map(field => ({
      type: String,
      value: field,
      fontWeight: 'bold',
      width: 20 // Set the width for each column

    }));


     
    console.log(columns)
      // Format data according to selected fields
 const formatDataForExport = () => {
      return tableDataList.value.map(row => {
        return selectedFields.value.map(field => {
          return {
            type: String,
            value: row[field] ? String(row[field]) : '',
          };
        });
      });
    };
   // Function to download the Excel file
 
      const rows = formatDataForExport();
       // Prepend the headers (columns) as the first row
       rows.unshift(columns);

      await writeXlsxFile(rows, {
        columns: columns,
        fileName: 'data.xlsx',
      });
 


};

 
 
 
 
</script>

<template>
  <el-card>
    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center;">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>

      <!-- Title Search -->
      <el-select
v-model="value3" :onChange="handleSelectActivity" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Search Grievance" style=" margin-right: 5px;">
        <el-option v-for="item in GrvOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>

      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px; ">

        <el-tooltip content="Add Activity" placement="top">
          <el-button v-if="showAdminButtons" :onClick="AddComponent" type="primary" :icon="Plus" />
        </el-tooltip>

        <el-tooltip content="Clear" placement="top">
          <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </el-tooltip>

        <el-tooltip content="Download" placement="top">
          <el-button @click="selectDownload" type="primary" :icon="Download" />
        </el-tooltip>

         
    
      </div>

      <!-- Download All Component -->
      <DownloadAll v-if="showAdminButtons" :model="model" :associated_models="associated_multiple_models" />
    </el-row>


    <el-table :data="tableDataList" :loading="loading" size="small" border>
      <el-table-column label="#" width="80" prop="id" sortable>
        <template #default="scope">
          <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
            <span>{{ scope.row.id }}</span>
            <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Code" prop="code" sortable />
      <el-table-column label="Complainant" prop="name" sortable />
      <el-table-column label="Description" prop="description" sortable />
      <el-table-column label="County" prop="county.name" sortable />
      <el-table-column label="Settlement" prop="settlement.name" sortable />
      <el-table-column prop="date" label="Date Reported" width="180">
        <!-- Use a scoped slot to customize the rendering of the date column -->
        <template #default="scope">
          <span>{{ formatDate(scope.row.date_reported) }}</span>
        </template>
      </el-table-column>

      <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
        <template #default="scope">
          <el-dropdown v-if="isMobile">
            <span class="el-dropdown-link">
              <Icon icon="ic:sharp-keyboard-arrow-down" width="24" />
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)" :icon="Edit"
                  color="green">Edit</el-dropdown-item>
                <el-dropdown-item
v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div v-else>
            <el-button size="small" type="primary" :icon="More" @click="getGrievanceDetails(scope)">
              More
            </el-button>
            <el-tooltip v-if="showEditButtons" content="Edit" placement="top">
              <el-button
type="success" size="small" :icon="Edit" @click="editIndicator(scope as TableSlotDefault)"
                circle />
            </el-tooltip>
          </div>
        </template>

      </el-table-column>
    </el-table>

    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>

  <el-drawer v-model="drawer" title="I am the title" direction="ltr" :before-close="handleCloseGrievance">
    <span>Hi, there!</span>
  </el-drawer>


  <el-dialog v-model="AddDialogVisible" @close="handleClose"  title="Grievance Actions" :width="dialogWidth" draggable>
    <el-form ref="ruleFormRef" :model="ruleForm" :rules="rules">
     
      <el-form-item label="Action">
        <el-select
        v-model="formAction.action_type"
        placeholder="Select"
        style="width: 100%"
      >
        <el-option
          v-for="item in ActionOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      </el-form-item> 
      <el-form-item label="Short Title">
        <el-input v-model="ruleForm.shortTitle" :style="{ width: '100%' }" />
      </el-form-item>
    </el-form>
    <template #footer>

      <span class="dialog-footer">
        <el-button @click="AddDialogVisible = false">Cancel</el-button>
        <el-button v-if="showSubmitBtn" type="primary" @click="submitForm(ruleFormRef)">Submit</el-button>
        <el-button v-if="showEditSaveButton" type="primary" @click="editForm(ruleFormRef)">Save</el-button>
      </span>
    </template>
  </el-dialog>
 
 
  <el-dialog
    title="Select Fields"
    v-model="showDownloadDialog"
    width="60%" 
  >
    <el-form>
      <el-form-item  >
        <el-row :gutter="20"> <!-- Add gutter for spacing between columns -->
          <el-col
            v-for="(field) in availableFields"
            :key="field"
            :span="6"
          >
            <el-checkbox :label="field" v-model="selectedFields">
              {{ field }}
            </el-checkbox>
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>
    <div class="dialog-footer">
      <el-button @click="showDownloadDialog = false">Cancel</el-button>
      <el-button type="primary" @click="downloadCSV">Download CSV</el-button>
    </div>
  </el-dialog>
</template>
