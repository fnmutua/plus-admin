<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n'
import { getCountyListApi } from '@/api/counties'

import { getGrievances } from '@/api/grievance'

import { ElButton, ElSelect, ElCheckbox, ElCol, ElIcon, ElTag } from 'element-plus'
import {
  Plus, Download, Filter, More, ArrowLeft, ArrowRight, Upload, UploadFilled,
  Edit,
  Back,
  InfoFilled, Position,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive, onMounted, computed } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDialog, ElForm, ElDropdown, ElDropdownItem, ElDropdownMenu, ElTour, ElTourStep, ElUpload,
  ElFormItem, ElRow, ElInput, FormRules, ElStep, ElSteps, ElTable, ElTableColumn, ElCard, ElDrawer, ElMessage, ElTabPane,ElSwitch
} from 'element-plus'
import { useRouter } from 'vue-router'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { CreateRecord, DeleteRecord, updateOneRecord } from '@/api/settlements'
import { uuid } from 'vue-uuid'
import type { FormInstance } from 'element-plus'
import xlsx from "json-as-xlsx"

import writeXlsxFile from 'write-excel-file';
import DownloadCustom from '@/views/Components/DownloadCustom.vue';
import type { UploadProps, UploadUserFile } from 'element-plus'

import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { uploadGrievanceDocuments, generateGrievance, logGrievanceAction, batchImportGrievances, getByKeyword } from '@/api/grievance'
import { getModelSpecs } from '@/api/fields'
import exportFromJSON from 'export-from-json'
import Papa from 'papaparse';



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

const countiesOptions = ref([])
const settlementOptions = ref([])


console.log("userInfo--->", userInfo)



// Check for the "grm" role and get its level, field, and fieldvalue
const isNationalStaff = ref(false)
const grmRole = userInfo.roles.map(role => {
  if (role.name === "grm") {
    let field = null;
    let fieldvalue = null;

    // Determine the field and fieldvalue based on the location level
    if (role.user_roles.location_level === "county") {
      isNationalStaff.value = false
      field = "county_id";
      fieldvalue = role.user_roles.county_id;
    } else if (role.user_roles.location_level === "settlement") {
      isNationalStaff.value = false
      field = "settlement_id";
      fieldvalue = role.user_roles.settlement_id;
    } else if (role.user_roles.location_level === "national" || role.user_roles.location_level === null) {
      // If the level is national or not defined, return empty roles filter
      isNationalStaff.value = true
      return {
        model: "national",
        field: null,
        fieldvalue: null
      };
    } else {
      field = "location_id";
      fieldvalue = role.user_roles.location_id; // Fallback to location_id
    }

    return {
      model: role.user_roles.location_level,  // The level (county/settlement)
      field: field,                          // Field name (county_id/settlement_id/location_id)
      fieldvalue: fieldvalue                 // Actual value of the ID
    };
  }
  return null;
}).filter(role => role !== null);

console.log('grmRole', grmRole);

// Check for super_admin role
const isSuperAdmin = userInfo.roles.some(role => role.name === "super_admin");

// Determine the field_filter and value_filter based on roles
let roles_filters = [];

if (isSuperAdmin) {
  // If user is a super_admin, no filters needed
  roles_filters = [];
} else if (grmRole.length > 0 && grmRole[0].model === "national") {
  // If user has a grm role at national level, no filters needed
  roles_filters = [];
} else if (grmRole.length > 0) {
  // Otherwise, set filters based on the grm role's field and fieldvalue
  const field_filter = grmRole[0].field;
  const value_filter = grmRole[0].fieldvalue;
  roles_filters.push({
    field: field_filter,
    value: value_filter
  });
}

console.log('roles_filters', roles_filters);




const isMobile = computed(() => appStore.getMobile)

console.log('IsMobile', isMobile)

const dialogWidth = ref()
const actionColumnWidth = ref()

if (isMobile.value) {
  dialogWidth.value = "90%"
  actionColumnWidth.value = "75px"
} else {
  dialogWidth.value = "25%"
  actionColumnWidth.value = "100px"

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
const pageHeight = ref(600);
const paginationLayout = ref("sizes, prev, pager, next, total")
const pagerCount = ref()
// Function to update pageSize based on window width
const updatePageSize = () => {
  if (window.innerWidth <= mobileBreakpoint) {
    pageSize.value = mobilePageSize;

    paginationLayout.value = ("prev, pager, next")
    pagerCount.value = 2


  } else {
    pageSize.value = defaultPageSize;
    paginationLayout.value = ("sizes, prev, pager, next, total")
    pagerCount.value = undefined
  }

  pageHeight.value = window.innerHeight - 250

  console.log(' pageHeight.value', pageHeight.value)

};

onMounted(async () => {


  window.addEventListener('resize', updatePageSize);
  updatePageSize(); // Initial check


})


const showAdminButtons = ref(appStore.getAdminButtons)
const showEditButtons = ref(appStore.getEditButtons)




let tableDataList = ref<UserType[]>([])
//// ------------------parameters -----------------------////

// Prepare filters array

var filters = ['status'];
var filterValues = [['Resolved', 'Rejected', 'Closed']];
var filterFunction = ['notIn'];

// const operatorMap = {
//       eq: op.eq,
//       ne: op.ne,
//       like: op.like,
//       iLike: op.iLike,
//       in: op.in,
//       notIn: op.notIn,
//       gt: op.gt,
//       lt: op.lt,
//       gte: op.gte,
//       lte: op.lte
//     };



if (roles_filters.length > 0) {
  filters.push(roles_filters[0].field);  // Add the field to filters if roles_filters is not empty
}

// Prepare filterValues array
if (roles_filters.length > 0) {
  filterValues.push([roles_filters[0].value]);  // Add the value to filterValues if roles_filters is not empty
}

console.log('filters', filters);
console.log('filterValues', filterValues);

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


const handleSelectGrievance = async (indicator: any) => {
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
  formData.filterFunctions = filterFunction

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



const xuploadFiles = async (grievance_id) => {
  console.log('grievance_id', grievance_id)


  const formData = new FormData();

  // Assuming `fileList` is an array of file objects and `grievance_id` is defined
  for (var i = 0; i < fileList.value.length; i++) {
    console.log('------>file', fileList.value[i]);
    formData.append('files', fileList.value[i].raw);
    formData.append('format', fileList.value[i].name.split('.').pop());
    formData.append('grievance_id', grievance_id);
    formData.append('protected_file', true);
    formData.append('size', (fileList.value[i].raw.size / 1024 / 1024).toFixed(2));
    formData.append('code', uuid.v4());
  }

  // Printing out the contents of formData
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  const res = await uploadGrievanceDocuments(formData)

  console.log("Docuemnts Uploaded", res)




}



const uploadFiles = async (action_id, grievance_id) => {
  const formData = new FormData();

  // Assuming `fileList` is an array of file objects and `grievance_id` is defined
  for (var i = 0; i < fileList.value.length; i++) {
    console.log('------>file', fileList.value[i]);
    formData.append('files', fileList.value[i].raw);
    formData.append('format', fileList.value[i].name.split('.').pop());
    formData.append('grievance_id', grievance_id);
    formData.append('action_id', action_id);
    formData.append('protected_file', true);
    formData.append('type', 'Supporting Documentation');
    formData.append('size', (fileList.value[i].raw.size / 1024 / 1024).toFixed(2));
    formData.append('code', uuid.v4());
  }

  // Printing out the contents of formData
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  const res = await uploadGrievanceDocuments(formData)

  console.log("Docuemnts Uploaded", res)




}


const logAction = async (grievance) => {
  console.log('Log---->grievance', grievance)


  const formData = {};

  formData.grievance_id = grievance.id
  formData.action_type = 'Reported'
  formData.action_by = null
  formData.date_actioned = grievance.date_reported
  formData.prev_status = grievance.status
  formData.new_status = grievance.status
  formData.current_level = 'settlement'



  const res = await logGrievanceAction(formData)
  console.log("Log Successful", res)
  return res.data




}



const submitForm = async () => {
  grmForm.value.date_reported = new Date();
  grmForm.value.status = 'Sorting'
  grmForm.value.model = 'grievance';
  grmForm.value.current_level = 'settlement';


  if (grmForm.value.isgbv) {
        grmForm.value.current_level = 'national';

      }
      else {
        grmForm.value.current_level = 'settlement';

      }




  const formInstance = dynamicFormRef

  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      console.log('Is Valid', grmForm)

      //1. Submit teh greivance 
      const grv = await generateGrievance(grmForm.value)
      console.log('res', grv)


      // 2 Log the entry
      let log = await logAction(grv.data)



      console.log('log', log)

      // 3. Uplaod docuemnts 

      await uploadFiles(log.id, grv.data.id)


      ElMessage({
        message: grv.message,
        type: 'success'
      })


    } else {
      console.log('is Not Valid')
      ElMessage({
        message: 'Invalid Form',
        type: 'error'
      })    // felix - show message on success request 

    }
  });


};

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

if (userInfo) {
  getInterventionsAll()

}


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
  grievance_id: null,
  action_type: null,
  action_by: null,
  date_actioned: null,
  prev_status: null,
  new_status: null,
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
    const geoKeywords = ["geo", "lat", "lng", "coordinate", "longitude", "latitude", "createdAt"];
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
      // Split field by dot notation
      const keys = field.split('.');
      let value = row;

      // Traverse through the object using the keys
      for (let key of keys) {
        if (value && value.hasOwnProperty(key)) {
          value = value[key];
        } else {
          value = null;
          break;
        }
      }

      // Assign the extracted value to the extractedRow
      extractedRow[field] = value;
    });

    return extractedRow;
  });
};


const downloadCSV = async () => {
  // Implement your CSV download logic here
  console.log('selectedFields.value', selectedFields.value)
  console.log('tableDataList.value', tableDataList.value)


  const formattedData = computed(() => extractData(tableDataList.value, selectedFields.value));


  console.log('formattedData', formattedData.value)



  // Define column headers
  // Define column headers
  const columns = selectedFields.value.map(field => ({
    type: String,
    value: field,
    fontWeight: 'bold',
    width: 20 // Set the width for each column

  }));



  console.log(columns)
  // Format data according to selected fields
  const formatDataForExport = () => {
    return formattedData.value.map(row => {
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

  console.log('rows', rows)
  // Prepend the headers (columns) as the first row
  rows.unshift(columns);

  await writeXlsxFile(rows, {
    columns: columns,
    fileName: 'data.xlsx',
  });



};



const handleCloseDialog = () => {
  AddDialogVisible.value = false
}


/// Add GRM 

const dynamicFormRef = ref<FormInstance>()

const grmForm = ref({
  name: '',
  gender: '',
  age: '',
  national_id: '',
  phone: '',
  email: '',
  county_id: '',
  settlement_id: '',
  address: '',
  nature: '',
  isgbv: false,
  description: '',
  plea: '',

  self_reported:false,
  reporter_name : userInfo.name,
  reporter_phone:userInfo.phone,
  witness: '',
  witness_phone: '',
  witness_statement: '',
});

const validationRules = ({
  // Validation rules for each step
  step1: {
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
    gender: [{ required: true, message: 'Gender is required', trigger: 'change' }],
    age: [{ required: true, message: 'Age is required', trigger: 'change' }],
    national_id: [{ required: true, message: 'National ID is required', trigger: 'blur' }],
    phone: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],

  },

  step2: {
    county_id: [{ required: true, message: 'County is required', trigger: 'change' }],
    settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'change' }],
    nature: [{ required: true, message: 'Nature of complaint is required', trigger: 'change' }],
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    plea: [{ required: true, message: 'Plea/request is required', trigger: 'blur' }],
  },



});



const ageRanges = [
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: '46-55', label: '46-55' },
  { value: '56-65', label: '56-65' },
  { value: '65+', label: '65+' },
];

const currentStepRules = computed(() => {
  const stepRulesKey = `step${active.value + 1}`;
  console.log('stepRulesKey', stepRulesKey)
  return validationRules[stepRulesKey];
});


const active = ref(0);



const next = async () => {
  console.log(grmForm.value)
  const formInstance = dynamicFormRef
  formInstance.value.validate((valid: boolean) => {
    if (valid) {
      console.log(formInstance)
      active.value++;
    }
  });


};


const xxnext = () => {
  active.value++;
};


const prev = () => {
  active.value--;
};


const resetForm = () => {
  const formRef = dynamicFormRef.value;
  if (formRef) {
    formRef.resetFields();
  }
};


const handlePreview = (file) => {
  console.log('Preview:', file);
};

const handleRemove = (file, fileList) => {
  console.log('Remove:', file, fileList);
};

const beforeRemove = (file) => {
  return true;
};

const handleExceed = (files, fileList) => {
  ElMessage.warning('You can only upload up to 3 files.');
};

const isTourVisible = ref(false)



const showTour = () => {

  isTourVisible.value = true


}

const filteredTourSteps = computed(() => {

  const fil = tourSteps.value.filter(step => step.step == active.value && step.visible == true);
  console.log('filteredTourSteps', fil)
  return fil
});



const fileList = ref<UploadUserFile[]>([

])


const tourSteps = ref([
  {
    step: 0,
    target: '#btn1',
    title: 'Name',
    content: 'Please provide the name of the complainant as it appears on the National ID. Fill ANONYMOUS if  they  want anonymity.',
    visible: true
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Gender',
    content: 'Please select gender.',
    visible: true
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Age',
    content: 'Select age bracket',
    visible: true
  },
  {
    step: 0,
    target: '#btn4',
    title: 'National ID',
    content: 'Enter the national ID especially for land related complaints',
    visible: true
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Phone',
    content: 'Please provide the complainants phone number. We require this for  communication on the status of the complaint',
    visible: true
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Email(optional)',
    content: 'Please provide an email address if available. We may use this for our communication on the status of the complaint',
    visible: true
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Next',
    content: 'Click here to fill in the complaint details',
    visible: true
  },


  {
    step: 0,
    target: '#btn8',
    title: 'Clear Form',
    content: 'Click here to clear this form',
    visible: true
  },


  {
    step: 1,
    target: '#btn10',
    title: 'County Selection',
    content: 'Select the county where the project  is implemented.',
    visible: true
  },

  {
    step: 1,
    target: '#btn11',
    title: 'Settlement Selection',
    content: 'Select the settlement within the selected county.',
    visible: true
  },
  {
    step: 1,
    target: '#btn12',
    title: 'Address',
    content: 'Enter the complainants address e.g-: near XXX Primary school, Plot No. XXX.',
    visible: true
  },
  {
    step: 1,
    target: '#btn13',
    title: 'GBV Related Complaint',
    content: 'Indicate if the complaint is related to Gender-Based Violence.',
    visible: true
  },
  {
    step: 1,
    target: '#btn14',
    title: 'Nature of Complaint',
    content: 'Select the category that best describes the nature of the complaint.',
    visible: true
  },
  {
    step: 1,
    target: '#btn15',
    title: 'Complaint Description',
    content: 'Provide a detailed description of the complaint.',
    visible: true
  },
  {
    step: 1,
    target: '#btn16',
    title: 'Plea/Request',
    content: 'Enter the complainants plea or request regarding the complaint.',
    visible: true
  },

  {
    step: 1,
    target: '#btn9',
    title: 'Previous',
    content: 'Click here to go back one page',
    visible: true
  },


  {
    step: 2,
    target: '#btn17',
    title: 'Witness Name',
    content: 'Enter the name of the witness related to the grievance.',
    visible: true
  },

  {
    step: 2,
    target: '#btn18',
    title: 'Witness Phone',
    content: 'Enter the phone number of the witness.',
    visible: true
  },

  {
    step: 2,
    target: '#btn19',
    title: 'Witness Statement',
    content: 'Provide a statement from the witness regarding the grievance.',
    visible: true
  },
  {
    step: 2,
    target: '#btn20',
    title: 'Supporting Documentation',
    content: 'Upload any supporting documents related to the grievance. Only pdf/jpg/png files with a size less than 10mb are allowed.',
    visible: true
  },
  {
    step: 2,
    target: '#btn21',
    title: 'Submit',
    content: 'Click to submit the form. The complainant  will receive a notification on SMS with a link for future followups.',
    visible: true
  }



]);


const getCounties = async () => {

  const formData = {}
  formData.model = 'county'
  await getCountyAuth({}).then((response) => {
    console.log('List of counties:', response)
    //tableDataList.value = response.data
    var cnty = response.data



    cnty.forEach(function (arrayItem) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })


    // sort by value
    countiesOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

getCounties()



const getSettlementByCounty = async (selectCounty) => {
  // nullify selection after change 
  settlementOptions.value = []
  grmForm.value.settlement_id = null


  console.log("County:", selectCounty)

  const formData = {}
  formData.model = 'settlement'
  await getSettlementByCountyAuth({ county_id: selectCounty }).then((response) => {
    console.log('List of settlement:', response)
    //tableDataList.value = response.data
    var opt = response.data



    opt.forEach(function (arrayItem) {
      var item = {}
      item.value = arrayItem.id
      item.label = arrayItem.name
      item.county_id = arrayItem.county_id
      item.subcounty_id = arrayItem.subcounty_id
      item.ward_id = arrayItem.ward_id

      settlementOptions.value.push(item)
    })


    // sort by value
    settlementOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

const handleSelectSettlement = async (settlementId) => {
  console.log(settlementId)
  const filteredOptions = settlementOptions.value.filter(option => option.value === settlementId);
  console.log(filteredOptions[0].subcounty_id)
  grmForm.value.subcounty_id = filteredOptions[0].subcounty_id
  grmForm.value.ward_id = filteredOptions[0].ward_id

}


function convertPhoneNumber(phoneNumber: string | undefined) {

  // console.log(phoneNumber)
  let trimmedPhoneNumber = phoneNumber.replace(/\s+/g, '').trim();
  console.log(trimmedPhoneNumber.startsWith('0'))


  if (trimmedPhoneNumber.startsWith('0')) {
    trimmedPhoneNumber = '254' + trimmedPhoneNumber.slice(1);
  }

  console.log(trimmedPhoneNumber)
  // return trimmedPhoneNumber;
  grmForm.value.phone = trimmedPhoneNumber

}


const uploadDialog = ref(false)

const field_set = ref([])
const uploadData = async () => {
  uploadDialog.value = true
  console.log('Uploading data.......')
  var formData = {}
  formData.model = 'grievance'
  await getModelSpecs(formData).then((response) => {
    console.log(response.data)
    field_set.value = response.data
  })

}

const DownloadTemplate = async () => {

  const data = field_set.value
  const fileName = 'grievance_template'
  const exportType = exportFromJSON.types.csv
  if (data) exportFromJSON({ data, fileName, exportType })

}




function convertStringArraysToProperArrays(data) {
  return data.map(item => {
    const newItem = { ...item }; // Create a shallow copy of the object

    for (const key in newItem) {
      if (newItem.hasOwnProperty(key)) {
        const value = newItem[key];

        // Check if the value is a string and can be parsed as an array
        if (typeof value === 'string') {
          try {
            const parsedValue = JSON.parse(value);

            if (Array.isArray(parsedValue)) {
              newItem[key] = parsedValue;
            }
          } catch (e) {
            // Handle any JSON parsing errors
            console.error(`Error parsing string to array for key ${key}:`, e);
          }
        }
      }
    }

    return newItem;
  });
}



const ImportGrievances = async () => {

  //console.log('deleted_locations',deleted_locations)
  var form = {}
  form.model = 'grievance'

  const dta = convertStringArraysToProperArrays(parsedData.value)
  console.log('dta', dta)


  form.data = dta
  console.log('formData', form)

  const results = await batchImportGrievances(form)

  console.log('BatchImportUpsert', results.insertedDocuments)




}





const handleCsvUpload = async (file) => {

  if (file.raw) {
    parseCSV(file.raw);
  }
}

const parsedData = ref([])

const parseCSV = async (file) => {
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: (result) => {
      parsedData.value = result.data;

      console.log('parsedData.value', parsedData.value)
      ImportGrievances()
    },
    error: (error) => {
      console.error('Error parsing CSV:', error);
    },
  });
}

const tableRowClassName = (data) => {
  if (data.row.status == 'Sorting') {
    console.log(data.row.status)
    return 'warning-row'
  }

  if (data.row.status == 'Resolved') {
    return 'resolved-row'
  }

  if (data.row.status == 'Rejected') {
    return 'rejected-row'
  }

  if (data.row.status == 'Escalated') {
    return 'escalated-row'
  }

  if (data.row.status == 'Closed') {
    return 'closed-row'
  }



  return ''
}


const getFilteredBySearchData = async (searchKey) => {
  console.log('getFilteredBySearchData')
  const formData = {}
  formData.limit = pageSize.value
  formData.page = page.value
  formData.curUser = 1 // Id for logged in user
  formData.model = model

  //-Search field--------------------------------------------
  formData.searchField = 'name'
  formData.searchString = searchKey
  //--Single Filter -----------------------------------------

  //formData.assocModel = associated_Model

  // - multiple filters -------------------------------------
  formData.filters = filters.value
  formData.filterValues = filterValues.value
  formData.associated_multiple_models = associated_multiple_models
  formData.nested_models = []
  //formData.cache_key = 'SeacrchByKey_' + search_string.value

  //-------------------------
  console.log(formData)

  const res = await getByKeyword(formData)

  console.log('---->', res.data)

  tableDataList.value = res.data




  total.value = res.total
  loading.value = false


}




const handleSelectStatus = async (status: any) => {
  var selectOption = 'status'
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

  if (!filterValues.includes(status) && status.length > 0) {
    filterValues.splice(index, 0, status) //will insert item into arr at the specified index (deleting 0 items first, that is, it's just an insert).
  }

  // expunge the filter if the filter values are null
  if (status.length === 0) {
    filters.splice(index, 1)
  }

  console.log('FilterValues:', filterValues)

  getFilteredData(filters, filterValues)
}

const StatusOptions = [
  {
    value: 'Sorting',
    label: 'Sorting',
  },
  {
    value: 'Investigation',
    label: 'Investigation',
  },

  {
    value: 'Escalated',
    label: 'Escalated',
  },
  {
    value: 'Resolved',
    label: 'Resolved',
  },
  {
    value: 'Rejected',
    label: 'Rejected',
  },
  {
    value: 'Referred',
    label: 'Referred',
  },
  {
    value: 'Closed',
    label: 'Closed',
  },
]








const searchByName = async (filterString: any) => {

  getFilteredBySearchData(filterString)
}

const filterStatus = (value: string, row) => {
  return row.status === value
}

const filterHandler = (
  value: string,
  row: row,
  column: TableColumnCtx<row>
) => {
  const property = column['property']
  return row[property] === value
}


const handleRowDblClick = (row) => {

  console.log('Double clicked row:', row);


  push({
    name: 'GrievanceDetails',
    params: { id: row.id }
  })

}

</script>

<template>
  <el-card>
    <el-row type="flex" justify="start" gutter="10"
      style="display: flex; flex-wrap: nowrap; align-items: center; margin-bottom:10px">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>


      <el-select v-model="value3" multiple clearable filterable remote :remote-method="searchByName" reserve-keyword
        placeholder="Search by Name, settlement, complaint,phone .." style=" margin-right: 5px;" />

      <!-- Title Search -->
      <el-select v-model="value3" :onChange="handleSelectGrievance" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter by Code" style=" margin-right: 5px;">
        <el-option v-for="item in GrvOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>


      <!-- status Search -->
      <el-select v-model="value3" :onChange="handleSelectStatus" :onClear="handleClear" multiple clearable filterable
        collapse-tags placeholder="Filter By Status" style=" margin-right: 5px;">
        <el-option v-for="item in StatusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>


      <!-- Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; margin-right: 10px; ">


        <el-tooltip v-if="isNationalStaff || isSuperAdmin" content="Import Data" placement="top">
          <el-button @click="uploadData" type="primary" :icon="UploadFilled" />
        </el-tooltip>

        <el-tooltip content="Add Grievance" placement="top">
          <el-button :onClick="AddComponent" type="primary" :icon="Plus" />
        </el-tooltip>

        <el-tooltip content="Clear" placement="top">
          <el-button :onClick="handleClear" type="primary" :icon="Filter" />
        </el-tooltip>

        <el-tooltip content="Download" placement="top">
          <el-button @click="selectDownload" type="primary" :icon="Download" />
        </el-tooltip>
        <DownloadCustom v-if="showEditButtons" :data="tableDataList" :model="model"
          :associated_models="associated_multiple_models" />



      </div>

      <!-- Download All Component -->
    </el-row>


    <el-table :data="tableDataList" :loading="loading" style="width: 100%" :max-height="pageHeight"
      @row-click="handleRowDblClick" border :row-class-name="tableRowClassName">
      <el-table-column label="#" width="80" prop="id" sortable>
        <template #default="scope">
          <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
            <span>{{ scope.row.id }}</span>
            <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="date" label="Date Reported" width="150">
        <!-- Use a scoped slot to customize the rendering of the date column -->
        <template #default="scope">
          <span>{{ formatDate(scope.row.date_reported) }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="Status" width="100" sortable>
        <template #default="scope">
          <el-tag :type="scope.row.status == 'Closed' ? 'info'
          : scope.row.status == 'Escalated' ? 'secondary'
            : scope.row.status == 'Referred' ? 'warning'
              : scope.row.status == 'Rejected' ? 'danger'
                : 'success'" disable-transitions>{{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>


      <el-table-column label="Code" prop="code" sortable width="150" />
      <el-table-column label="Level" prop="current_level" sortable width="150" />
      <el-table-column label="Complainant" prop="name" sortable width="150" />
      <el-table-column label="Reported By" width="150">
        <template #default="scope">
          <span v-if="scope.row.self_reported === true">Self</span>
          <span v-else>{{ scope.row.reporter_name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Description" prop="description" sortable width="350" />
      <el-table-column label="Location" sortable width="350">
        <template #default="scope">
          <span>{{ scope.row.settlement.name }}, {{ scope.row.county.name }}</span>
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
                <el-dropdown-item v-if="showEditButtons" @click="editIndicator(scope as TableSlotDefault)" :icon="Edit"
                  color="green">Edit</el-dropdown-item>
                <el-dropdown-item v-if="showAdminButtons" @click="DeleteIndicator(scope.row as TableSlotDefault)"
                  :icon="Delete" color="red">Delete</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <div v-else>
            <el-button size="small" type="primary" plain :icon="Position" @click="getGrievanceDetails(scope)">
              More
            </el-button>

          </div>
        </template>

      </el-table-column>
    </el-table>

    <ElPagination :layout="paginationLayout" v-model:currentPage="currentPage" :pager-count="pagerCount"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />


  </el-card> 

  <el-dialog title="Select Fields" v-model="showDownloadDialog" width="60%">
    <el-form>
      <el-form-item>
        <el-row :gutter="20"> <!-- Add gutter for spacing between columns -->
          <el-col v-for="(field) in availableFields" :key="field" :span="6">
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
 


  <el-dialog v-model="AddDialogVisible" @close="handleCloseDialog" title="File a grievance" width="65%" draggable>

    <el-steps :active="active" finish-status="success">
      <el-step title="Complainant Details" />
      <el-step title="Grievance Details" />
      <el-step title="Review & Submit" />
    </el-steps>

    <el-form :model="grmForm" class="demo-form-inline" label-position="top" :rules="currentStepRules"
      ref="dynamicFormRef">
      <el-card shadow="hover">
        <el-row v-if="active === 0" :gutter="10">
          <!-- Step 1: Personal Details -->
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item id="btn1" label="Name of Complainant" prop="name">
              <el-input v-model="grmForm.name" placeholder="Enter name" style="width:90%" />
            </el-form-item>

            <el-form-item id="btn2" label="Gender" prop="gender">
              <el-select v-model="grmForm.gender" placeholder="Select" style="width:90%">
                <el-option label="Female" value="female" />
                <el-option label="Male" value="male" />
                <el-option label="Unspecified" value="unspecified" />
              </el-select>
            </el-form-item>

            <el-form-item id="btn3" label="Age" prop="age">
              <el-select v-model="grmForm.age" placeholder="Select" style="width:90%">
                <el-option v-for="item in ageRanges" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>


          </el-col>


          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item id="btn4" label="National ID" prop="national_id">
              <el-input v-model="grmForm.national_id" placeholder="Enter ID number" style="width:90%" />
            </el-form-item>

            <el-form-item id="btn5" label="Phone" prop="phone">
              <el-input v-model="grmForm.phone" placeholder="Enter phone number" style="width:90%"
                :onChange="convertPhoneNumber" />
            </el-form-item>

            <el-form-item id="btn6" label="Email" prop="email">
              <el-input v-model="grmForm.email" placeholder="Enter Email" style="width:90%" />
            </el-form-item>
          </el-col>


        </el-row>



        <el-row v-if="active === 1" :gutter="10">
          <!-- Step 2: Grievance Details -->
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
            <el-form-item id="btn10" label="County" prop="county_id">
              <el-select filterable v-model="grmForm.county_id" placeholder="County" @change="getSettlementByCounty"
                style="width:90%">
                <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item id="btn11" label="Settlement" prop="settlement_id">
              <el-select filterable v-model="grmForm.settlement_id" placeholder="Settlement"
                @change="handleSelectSettlement" style="width:90%">
                <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label"
                  :value="item.value" />
              </el-select>
            </el-form-item>

            <el-form-item id="btn12" label="Address" prop="address">
              <el-input v-model="grmForm.address" placeholder="Enter address" style="width:90%" />
            </el-form-item>



            <el-checkbox id="btn13" v-model="grmForm.isgbv" label="Is this complaint related to Gender-Based Violence?"
              size="large" style="margin-bottom:5px" />


          </el-col>
          <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">

            <el-form-item v-if="!grmForm.isgbv" id="btn14" label="Nature of Complaint" prop="nature">
              <el-select filterable v-model="grmForm.nature" placeholder="Select category" style="width:90%">
                <el-option label="Land" value="land" />
                <el-option label="Labour Related" value="labour" />
                <el-option label="Infrastructure" value="infrastructure" />
                <el-option label="Others" value="others" />
              </el-select>
            </el-form-item>

            <el-form-item id="btn15" label="Complaint Description" prop="description">
              <el-input v-model="grmForm.description" type="textarea" rows="2" placeholder="Describe your complaint"
                style="width:90%" />
            </el-form-item>

            <el-form-item id="btn16" label="Plea/Request" prop="plea">
              <el-input v-model="grmForm.plea" type="textarea" rows="2" placeholder="Enter your plea/request"
                style="width:90%" />
            </el-form-item>
          </el-col>


        </el-row>

        <el-row v-if="active === 2" :gutter="10">
          <!-- Step 3: Review & Submit -->
          <el-col :xs="12" :sm="21" :md="12" :lg="12" :xl="12">
            <el-form-item id="btn17" label="Witness Name" prop="witness">
              <el-input v-model="grmForm.witness" placeholder="Enter witness name" style="width:90%" />
            </el-form-item>

            <el-form-item id="btn18" label="Witness Phone" prop="witness_phone">
              <el-input v-model="grmForm.witness_phone" placeholder="Enter witness phone" style="width:90%" />
            </el-form-item>

            <el-form-item id="btn19" label="Witness Statement" prop="witness_statement">
              <el-input v-model="grmForm.witness_statement" type="textarea" placeholder="Enter witness statement"
                style="width:90%" />
            </el-form-item>
          </el-col>


          <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">

            <el-form-item  id="btn17" label="Are you the complainant?" prop="witness">
                
              <el-switch disabled
              v-model="grmForm.self_reported"
              class="ml-2"
              inline-prompt
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              active-text="Yes"
              inactive-text="No"
            />

            </el-form-item>

            <el-form-item  v-if="!grmForm.self_reported" id="btn18" label="Your Name" prop="reporter_name">
              <el-input disabled v-model="grmForm.reporter_name" placeholder="Your Name" style="width:90%" />
            </el-form-item>

            <el-form-item v-if="!grmForm.self_reported"  id="btn19" label="Your Phone" prop="reporter_phone">
              <el-input disabled v-model="grmForm.reporter_phone" type="text" placeholder="Your Phone"
                style="width:90%" />
            </el-form-item>



            <el-upload id="btn20" class="upload-demo"
              action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple :on-preview="handlePreview"
              :on-remove="handleRemove" :before-remove="beforeRemove" :limit="3" v-model:file-list="fileList"
              :auto-upload="false" :on-exceed="handleExceed">
              <el-button type="primary">Upload Supporting Documentation</el-button>
              <template #tip>
                <div class="el-upload__tip">pdf/jpg/png files with a size less than 500KB.</div>
              </template>
            </el-upload>





          </el-col>

        </el-row>
      </el-card>
    </el-form>

    <template #footer>
      <div class="steps-navigation"
        style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
        <div>
          <el-tooltip content="Help" placement="top">
            <el-button color="#626aef" type="info" @click="showTour" :icon="InfoFilled" plain />
          </el-tooltip>

          <el-button id="btn9" v-if="active > 0" @click="prev" type="primary" :icon="ArrowLeft">Previous </el-button>
        </div>
        <div>
          <el-button id="btn7" v-if="active < 2" type="primary" @click="next">
            Next <el-icon class="el-icon--right">
              <ArrowRight />
            </el-icon>
          </el-button>

          <el-button id="btn2" v-if="active === 2" type="primary" @click="submitForm"
            style="margin-left: 10px;">Submit</el-button>
          <el-button id="btn8" @click="resetForm" style="margin-left: 10px;">Reset</el-button>
        </div>
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="uploadDialog" title="Import Document" width="400" @close="uploadDialog = false">
    <span>
      To upload data on projects, use this
      <button @click="DownloadTemplate" class="template-link">template</button>
      , then upload it below.
    </span>


    <el-upload class="upload-demo" :on-change="handleCsvUpload" drag :auto-upload="false"
      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15">
      <div class="el-upload__text">
        Drop file here or <em>click to upload</em>
      </div>

    </el-upload>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="uploadDialog = false">Cancel</el-button>
        <el-button type="primary" @click="uploadData">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>


  <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
    <el-tour-step v-for="(step, index) in filteredTourSteps" :key="index" :target="step.target" :title="step.title"
      :description="step.content" />
  </el-tour>
</template>



<style scoped>
.upload-demo {
  width: 300px;
}

.template-link {
  text-decoration: underline;
  color: #409EFF;
  /* Optional: change link color */
}




.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .el-pagination {
    font-size: 12px;
    /* Adjust font size for small screens */
  }

  .el-pagination .el-pagination__sizes {
    display: none;
    /* Hide size selector on small screens */
  }

  .el-pagination .el-pagination__total {
    display: none;
    /* Hide total count on small screens */
  }



}
</style>



<style>
.el-table .danger-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .success-row {
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .warning-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

.el-table .rejected-row {
  --el-table-tr-bg-color: var(--el-color-danger-light-9);
  --el-table-tr-text-color: var(--el-color-danger);
  color: var(--el-table-tr-text-color);
}

.el-table .referred-row {
  --el-table-tr-bg-color: var(--el-color-warning-light-9);
  --el-table-tr-text-color: var(--el-color-warning);
  color: var(--el-table-tr-text-color);
}

.el-table .escalated-row {
  --el-table-tr-bg-color: var(--el-color-secondary);
  --el-table-tr-text-color: var(--el-color-secondary);
  color: var(--el-table-tr-text-color);
}

.el-table .resolved-row {
  --el-table-tr-bg-color: var(--el-color-success-light-9);
  --el-table-tr-text-color: var(--el-color-success);
  color: var(--el-table-tr-text-color);
}

.el-table .closed-row {
  --el-table-tr-bg-color: var(--el-color-info-light-9);
  --el-table-tr-text-color: var(--el-color-info);
  color: var(--el-table-tr-text-color);
}

.item {
  margin-top: 10px;
  margin-right: 40px;
}
</style>