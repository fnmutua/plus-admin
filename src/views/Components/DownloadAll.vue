<template>
  <div   v-loading="downloading"  style="display: inline-block; margin-left: 5px">
    <el-tooltip content="Download All" placement="top">
      <el-button    :onClick="DownloadViaComponent" type="primary" :icon="Finished" />
    </el-tooltip>
  </div>

  <el-dialog  v-model="showSelectFields" title="Select Fields" width="70%">
    <div>
    <el-row v-if="model_fields && model_fields.length > 0">
      <el-col :span="6" v-for="(field, index) in model_fields" :key="index">
        <el-checkbox v-model="selectedFields" :label="field">{{ field }}</el-checkbox>
      </el-col>
    </el-row>
    <div v-else>
      No data to Download.
    </div>
  </div>
  <el-button  v-if="model_fields && model_fields.length > 0"   type="success" @click="handleDownloadSelectFields()">Download</el-button>
</el-dialog>


</template>

<script setup>
import { ref, onMounted, defineProps, toRefs } from 'vue';
import {
  ElButton, ElTooltip, ElDialog, ElRow, ElCol, ElCheckbox
  // Import other Element Plus components here
} from 'element-plus';
import {
  Finished
  // Import other icons from '@element-plus/icons-vue'
} from '@element-plus/icons-vue';
// Import your APIs, store, and other dependencies here
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import xlsx from "json-as-xlsx"

const props = defineProps({
  model: String,
  associated_models: Array
 
});

const { show } = toRefs(props);

const flattenedData = ref([]);
const showSelectFields = ref(false);
const selectedFields =ref([])
const downloading =ref(false)


const model_fields = ref([])

const model = ref()
const associated_multiple_models = ref([])

onMounted(() => {
  console.log('data----x', props.model);
  model.value=props.model
  associated_multiple_models.value=props.associated_models
  console.log('userInfo----x' ,props.associated_models  );
});

const flattenJSON = (obj = {}, res = {}, extraKey = '') => {
  for (let key in obj) {
    if (
      key !== 'geom' &&
      key !== 'createdAt' &&
      key !== 'updatedAt' &&
      key !== 'email' &&
      key !== 'phone' &&
      key !== 'isApproved' &&
      key !== 'createdBy' &&
      key !== 'isActive' &&
      key !== 'documents' &&
      key !== 'user'
    ) {
      if (
        (typeof obj[key] !== 'object' || obj[key] === null)
      ) {
        res[extraKey + key] = obj[key];
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item, index) => {
          flattenJSON(item, res, `${extraKey}${key}.${index}.`);
        });
      } else {
        flattenJSON(obj[key], res, `${extraKey}${key}_`);
      }
    }
  }
  return res;
};

const DownloadViaComponent = async () => {
  flattenedData.value = [];
  downloading.value=true
  try {
    const response = await getListWithoutGeo({
      params: {
        curUser: 1,
        model: model.value,
        associated_multiple_models: associated_multiple_models.value,
        searchField: 'name',
        searchKeyword: '',
        sort: 'ASC'
      }
    });

    response.data.forEach(arrayItem => {
      const dd = flattenJSON(arrayItem);
      flattenedData.value.push(dd);

      model_fields.value  = Object.keys(dd);


  console.log(dd);
    });
    downloading.value=false

    showSelectFields.value = true;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

 
const handleDownloadSelectFields = async () => {
 //  console.log('selectedFields ---', selectedFields.value)

  if (selectedFields.value.length < 1) {
    ElMessage.warning('Specify the fields you want on the exported file')
    return 
    
   }

 

  let fields =[]

  for (let i = 0; i < selectedFields.value.length; i++) { 
    var fld = {}
    fld.label=selectedFields.value[i]
    fld.value = selectedFields.value[i]
    fields.push(fld)
  }

 // console.log(fields)

   


  // Preprae the data object 
  var dataObj = {}
  dataObj.sheet = 'data'
  dataObj.columns = fields

  let dataHolder = []
  // loop through the table data and sort the data 
  // change here !
  for (let i = 0; i < flattenedData.value.length; i++) {
    let thisRecord = {}

 //   console.log('flattened ??',i,  flattenedData.value[i])
     
    thisRecord.index = i + 1

    for (let j = 0; j < fields.length; j++) {
      var fld = fields[j].label
      thisRecord[fld] = flattenedData.value[i][fld]

   //   console.log('fld',thisRecord)


    }
   

    dataHolder.push(thisRecord)
  }
  dataObj.content = dataHolder




  let settings = {
    fileName: model.value, // Name of the resulting spreadsheet
    writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
  }

  // Enclose in array since the fucntion expects an array of sheets
  xlsx([dataObj], settings) //  download the excel file

}

</script>
