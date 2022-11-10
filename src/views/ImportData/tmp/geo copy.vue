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

const { push } = useRouter()
const type = ref()
const settlement = ref()
const settlementOptions = ref([])
const value_switch = ref(false)
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']


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
    label: 'Polygons',
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
        value: 'county',
        label: 'Counties'
      }
    ]
  },
  {
    label: 'Points',
    options: [
      {
        value: 'schools',
        label: 'Schools'
      },
      {
        value: 'health_care_facility',
        label: 'Health Care Facility'
      }
    ]
  },
  {
    label: 'Linear',
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

const county_fields = [
  {
    field: 'name',
    match: ''
  },
  {
    field: 'id',
    match: ''
  },

  {
    field: 'code',
    match: ''
  }
]


const handleMutlipleSettlements = async () => {

  console.log(value_switch)

  showSettleementSelect.value = !value_switch.value

}




const handleProcess = async (settlements: any) => {
  console.log('mapped fields', settlements)
  console.log('upload--->', uploadObj.value[0])


  console.log("fieldset", fieldSet)
  for (let i = 0; i < uploadObj.value[0].length; i++) {
    //console.log(i, uploadObj.value[0][i])
    let feature = uploadObj.value[0][i].properties
    let conv_feature = {}
    for (var prop in feature) {
      var matched_field = fieldSet.value.filter((obj) => {
        return obj.match === prop
      })

      if (matched_field.length > 0) {
        conv_feature[matched_field[0].field] = feature[prop]  // Assign Field Vlue 
      }
      conv_feature.geom = (uploadObj.value[0][i].geometry)    // Asign Geometry then stringfy it 
      if (type.value != 'settlement') {
        if (!value_switch.value) {
          conv_feature.settlement_id = settlement.value   // if not a settlement, add settleemnt id (remember to remove counties)

        }
      }
    }
    matchedObj.value.push(conv_feature)
  }
  console.log('processed:', matchedObj)



  var formData = {}
  formData.model = type.value
  formData.data = matchedObj.value


  const res = await BatchImportUpsert(formData)
    .catch((error) => {
      console.log('Error------>', error.response.data.message)
      ElMessage.error(error.response.data.message)
    })



  if (res) {
    console.log(res)
  }




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

  } else if (type === 'county') {
    fieldSet.value = county_fields
    console.log('parcel------>', county_fields)

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
    ElMessage.error('Select a Geojson File first!')
  } else {
    var file = fileList.value[0].raw
    let reader = new FileReader()
    reader.onload = readJson

    reader.readAsText(file)
  }
}

const readJson = (event) => {
  let str = event.target.result
  let json = JSON.parse(str)

  console.log('json', json.features)

  const fields = Object.keys(json.features[0].properties) //  get all proterit4s of the first feature

  makeOptions(fields)
  uploadObj.value.push(json.features) // Push to the temporary holder
  show.value = true

  if (value_switch.value) {
    console.log("=====Multiple settleemtns")
    fieldSet.value.push({ field: 'settlement_id', match: '' })

  }

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
          <el-select v-model="scope.row.match" class="m-2" placeholder="Select">
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
