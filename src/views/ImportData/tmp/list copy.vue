<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable vue/no-deprecated-slot-scope-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getSettlementListByCounty, uploadFiles, BatchImportUpsert } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import {
  ElButton,
  ElSelect,
  ElTable,
  ElIcon,
  ElTableColumn,
  ElInput,
  ElSwitch,
  ElOptionGroup,
  ElOption
} from 'element-plus'
import { ElUpload } from 'element-plus'
import {

  Upload,
  Tools
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElDivider } from 'element-plus'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'
import type { XlsxRead, XlsxTable, XlsxSheets, XlsxJson, XlsxWorkbook, XlsxSheet, XlsxDownload } from 'vue3-xlsx'
import readXlsxFile from 'read-excel-file'




const { push } = useRouter()
const type = ref()
const settlement = ref()
const settlementOptions = ref([])
const value_switch = ref(false)
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']


///---------------------xlsx-
const file = ref()
const selectedSheet = ref()
const sheetName = ref()
const tbl = ref()

//// ------------------parameters -----------------------////
const matchOptions = ref([])
const uploadObj = ref([])
const matchedObj = ref([])
const fieldSet = ref([])
const show = ref(false)
const showSettleementSelect = ref(false)
const showSwitch = ref(false)
const { t } = useI18n()


const uploadOptions = [
  {
    label: 'Settlement',
    options: [
      {
        value: 'settlement',
        label: 'Settlements'
      },
      {
        value: 'parcel',
        label: 'Parcels'
      },
      {
        value: 'intervention',
        label: 'Interventions'
      }
    ]
  },
  {
    label: 'Households',
    options: [
      {
        value: 'households',
        label: 'Households'
      },
      {
        value: 'beneficiary',
        label: 'Beneficiaries'
      },
      {
        value: 'beneficiary_parcel',
        label: 'Parcel Owners'
      }
    ]
  },
  {
    label: 'Facilities',
    options: [
      {
        value: 'road',
        label: 'Roads'
      },
      {
        value: 'path',
        label: 'Paths'
      }
    ]
  }
]

const settlement_fields = [
{
    field: 'id',
    match: ''
  },
  {
    field: 'name',
    match: ''
  },
  {
    field: 'county_id',
    match: ''
  },
  {
    field: 'settlement_type',
    match: ''
  },
  {
    field: 'area',
    match: ''
  },
  {
    field: 'population',
    match: ''
  },
  {
    field: 'code',
    match: ''
  }
]

const parcel_fields = [
  {
    field: 'parcel_no',
    match: ''
  },

  {
    field: 'landuse_id',
    match: ''
  },
  {
    field: 'area_ha',
    match: ''
  },

  {
    field: 'code',
    match: ''
  }
]

const hh_fields = [
  {
    field: 'name',
    match: ''
  },

  {
    field: 'national_id',
    match: ''
  },
  {
    field: 'gender',
    match: ''
  },
  {
    field: 'hh_code',
    match: ''
  },
  {
    field: 'hh_size_03',
    match: ''
  },
  {
    field: 'hh_size_414',
    match: ''
  },
  {
    field: 'hh_size_1520',
    match: ''
  },
  {
    field: 'hh_size_2125',
    match: ''
  },
  {
    field: 'hh_size_2655',
    match: ''
  },
  {
    field: 'hh_size_gt55',
    match: ''
  },
  {
    field: 'over_80',
    match: ''
  }




]

const interventions_fields = [
  {
    field: 'intervention_type_id',
    match: ''
  },
  {
    field: 'year',
    match: ''
  },
  {
    field: 'intervention_phase',
    match: ''
  },

  {
    field: 'cluster_id',
    match: ''
  },
]

const beneficiary_parcels = [
  {
    field: 'hh_id',
    match: ''
  },
  {
    field: 'intervention_id',
    match: ''
  },
  {
    field: 'intervention_phase',
    match: ''
  },

  {
    field: 'benefit_type_id',
    match: ''
  },

  {
    field: 'beneficiary_id',
    match: ''
  },

  {
    field: 'parcel_id',
    match: ''
  },
  {
    field: 'hh_code',
    match: ''
  },
]

const beneficiary_fields= [
  {
    field: 'hh_id',
    match: ''
  },

  {
    field: 'intervention_id',
    match: ''
  },
  {
    field: 'intervention_phase',
    match: ''
  },
  {
    field: 'benefit_type_id',
    match: ''
  },
  {
    field: 'hh_code',
    match: ''
  },
 
  


]






const handleMutlipleSettlements = async () => {

  console.log(value_switch)

  showSettleementSelect.value = !value_switch.value

}



const handleProcess = async (settlements: any) => {
  console.log('mapped fields', settlements)
  console.log('upload--->', uploadObj.value)
  for (let i = 0; i < uploadObj.value.length; i++) {
    //console.log(i, uploadObj.value[0][i])
    let feature = uploadObj.value[i]
    let conv_feature = {}
    for (var prop in feature) {
      var matched_field = fieldSet.value.filter((obj) => {
        return obj.match === prop
      })

      if (matched_field.length > 0) {
        conv_feature[matched_field[0].field] = feature[prop]  // Assign Field Vlue 
      }
      //   conv_feature.geom = (uploadObj.value[0][i].geometry)    // Asign Geometry then stringfy it 
      //console.log("showSettleementSelect, ",value_switch.value)
      // console.log("type, ",type.value)

      if (type.value != 'settlement' && !value_switch.value) {
        conv_feature.settlement_id = settlement.value   // if not a settlement, add settleemnt id (remember to remove counties)
        console.log("Setting up settlement ID")
      }
    }
    matchedObj.value.push(conv_feature)
  }
  console.log('processed:', matchedObj)



  var formData = {}
  formData.model = type.value
  formData.data = matchedObj.value


  console.log("importData--->", formData)


  // ************** Send data to server ***************** //
  await BatchImportUpsert(formData)
    .catch((error) => {
      console.log('Error------>', error.response.data.message)
      ElMessage.error(error.response.data.message)
    })




}


const makeOptions = (list) => {
  for (let i = 0; i < list.length; i++) {
    var opt = {}
    opt.value = list[i]
    opt.label = list[i]
    matchOptions.value.push(opt)
  }
}

const handleClear = async () => {
  console.log('cleared....')
  type.value = ''
  settlement.value = ''
  // clear all the fileters -------
}

const handleSelectType = async (type: any) => {
  type = type
  console.log(type)
  if (type != 'settlement' && !value_switch.value) {
    showSettleementSelect.value = true
    showSwitch.value = true
  } else {
    showSettleementSelect.value = false
    showSwitch.value = false

  }


  if (type === 'settlement') {
    fieldSet.value = settlement_fields
    console.log('settlements------>', type)
  } else if (type === 'parcel') {
    fieldSet.value = parcel_fields
    console.log('parcel------>', parcel_fields)

  }
  else if (type === 'households') {
    fieldSet.value = hh_fields
    console.log('households------>', hh_fields)

  }
  else if (type === 'intervention') {
    fieldSet.value = interventions_fields
    console.log('interventions_fields------>', interventions_fields)

  }

  else if (type === 'beneficiary_parcel') {
    fieldSet.value = beneficiary_parcels
    console.log('beneficiary_parcel------>', beneficiary_parcels)

  }
  else if (type === 'beneficiary') {
    fieldSet.value = beneficiary_fields
    console.log('beneficiary_fields------>', beneficiary_fields)

  }



  

  



}

const handleSelectSettlement = async (settlement: any) => {
  settlement = settlement
}






const getSettlementsOptions = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'settlement',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data



    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      settlementOptions.value.push(countyOpt)
    })

    console.log('Options', settlementOptions)
  })
}


getSettlementsOptions()


const fileList = ref<UploadUserFile[]>([])

const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  console.log(file, uploadFiles)
  show.value = false
  uploadObj.value=[]
  matchedObj.value=[]
  fieldSet.value=[]
 
}

const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  console.log(uploadFile)
}

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  ElMessage.warning(
    `The limit is 1, you selected ${files.length} files this time, add up to ${files.length + uploadFiles.length
    } totally`
  )
}

const beforeRemove: UploadProps['beforeRemove'] = (uploadFile) => {
  return ElMessageBox.confirm(`Cancel the transfert of ${uploadFile.name} ?`).then(
    () => true,
    () => false
  )
}

const submitFiles = async () => {
  console.log('on Submit....', fileList.value.length)
  if (fileList.value.length == 0) {
    ElMessage.error('Select a  File first!')
  } else {
    var rfile = fileList.value[0].raw

    console.log("File type", rfile.name.split('.').pop())

    let reader = new FileReader()

    let ftype = rfile.name.split('.').pop()
    if (ftype == 'json') {
      console.log('------Json----')
      reader.onload = readJson
    } else if (ftype == 'xlsx')  {

      reader.onload = readXLSX(rfile)
    }
    
    
    else {
      console.log('------csv----')

      reader.onload = readCsv


    }


    reader.readAsText(rfile)
  }
}

const readJson = (event) => {
  let str = event.target.result
  //console.log("file type", str)
  let json = JSON.parse(str)

  console.log('json', json)

  const fields = Object.keys(json[0]) //  get all proterit4s of the first feature
  console.log("fields-->", fields)
  makeOptions(fields)
  uploadObj.value.push(json) // Push to the temporary holder
  show.value = true

  if (value_switch.value) {
    console.log("=====Multiple settleemtns")
    fieldSet.value.push({ field: 'settlement_id', match: '' })

  }
}

const readCsv = (event) => {
  let str = event.target.result

  const lines = str.split('\n') // 1️⃣
  const header = lines[0].split(',') // 2️⃣
  const csv = lines.slice(1).map(line => {
    const fields = line.split(',') // 3️⃣
    return Object.fromEntries(header.map((h, i) => [h, fields[i]])) // 4️⃣
  })



  const fields = Object.keys(csv[0]) //  get all proterit4s of the first feature
  console.log("fields-->", fields)
  makeOptions(fields)

  var newArray = csv.filter((obj) => { return obj.name !== '' }) // remove any empty rows
  var newArray = newArray.filter((obj) => { return obj.name !== 'name' })  // remove header row 



  for (let j = 1; j < newArray.length; j++) { 
    uploadObj.value.push(newArray[j]) // Push each record to the temporary holder


  }


  show.value = true
  console.log('csv----newr--->', newArray)


  if (value_switch.value) {
    console.log("=====Multiple settleemtns")
    fieldSet.value.push({ field: 'settlement_id', match: '' })

  }
}

const readXLSX = async (event) => {
  console.log('on file change.......', event)
  //file.value = event.target.files ? event.target.files[0] : null;   // Direct upload 
  file.value = event   // called from the uplaod funtion 

  console.log('The file---->', file)

  readXlsxFile(file.value).then((rows) => {
    const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
    console.log("fields-->", fields)
    makeOptions(fields)
    var newArray = rows.filter((obj) => { return obj.name !== '' }) // remove any empty rows
 
  
  
    for (let j = 1; j < rows.length; j++) {
      var record = {}
      for (let i = 0; i < fields.length; i++) {
        var f = fields[i] 
        var v = rows[j][i]
        record[f]=v
    //    console.log(record)
      }

      uploadObj.value.push(record) // Push to the temporary holder
     }  // remove header row
    
     console.log('rows-xlsx------>', uploadObj)    

    show.value = true

    if (value_switch.value) {
      console.log("=====Multiple settlements")
      fieldSet.value.push({ field: 'settlement_id', match: '' })

    } 

  })


}


</script>

<template>
  <ContentWrap :title="t('Upload Data')" :message="t('Select Data Type')">
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select v-model="type" :onChange="handleSelectType" :onClear="handleClear" placeholder="Filter by Type">
        <el-option-group v-for="group in uploadOptions" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>
    </div>
    <div style="display: inline-block; margin-left: 20px">

      <el-switch v-model="value_switch" size="large" v-if="showSwitch" @click="handleMutlipleSettlements"
        active-text="Multiple Settlements" />

    </div>
    <div style="display: inline-block; margin-left: 20px">
      <el-select v-if="showSettleementSelect" v-model="settlement" :onChange="handleSelectSettlement"
        :onClear="handleClear" clearable filterable collapse-tags placeholder="Filter by Settlement">
        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>





    <el-divider border-style="dashed" content-position="left">Upload</el-divider>
    <el-upload class="upload-demo" drag action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple
      v-model:file-list="fileList" :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove"
      :limit="1" :on-exceed="handleExceed" :auto-upload="false">
      <div class="el-upload__text"> Drop file here or <em>click to upload</em> </div>
    </el-upload>

    <el-button class="mt-4" style="width: 100%" @click="submitFiles" type="primary">
      Upload<el-icon class="el-icon--right">
        <Upload />
      </el-icon>
    </el-button>
    <el-table size="small" v-if="show" :data="fieldSet" stripe="stripe">
      <el-table-column prop="column" label="Field">
        <template #default="scope">
          <el-input v-model="scope.row.field" controls-position="left" />
        </template>
      </el-table-column>
      <el-table-column prop="match" label="Match">
        <template #default="scope">
          <el-select v-model="scope.row.match" filterable placeholder="Select">
            <el-option v-for="item in matchOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>
    <el-button v-if="show" class="mt-4" style="width: 100%" @click="handleProcess" type="link">
      Process<el-icon class="el-icon--right">
        <Tools />
      </el-icon>
    </el-button>
    <!-- <section>
      <input type="file" @change="readXLSX" />
    </section> -->


  </ContentWrap>


</template>

<style scoped>
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>

.custom-icon { font-size: 2rem; }
