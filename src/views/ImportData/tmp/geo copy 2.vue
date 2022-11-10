<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable vue/no-deprecated-slot-scope-attribute -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { getParentIds, BatchImportUpsert } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import {
  ElButton,
  ElSelect,
  ElTable,
  ElIcon,
  ElTableColumn,
  ElInput,
  ElSwitch,
  ElOption
} from 'element-plus'
import { ElUpload } from 'element-plus'
import {
  Upload,
  Tools
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import { ElDivider } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'
import readXlsxFile from 'read-excel-file'

const settlement = ref()
const settlementOptions = ref([])
const parentObj = ref([])
const value_switch = ref(false)


//// ------------------parameters -----------------------////
const model = ref()          // the model 
const code = ref()  // the parent code as per the imported excel file 
const parent_key = ref()       // the parent foregin key in the model 
const parentModel = ref()      // the parent model


///---------------------xlsx-
const file = ref()


//// ------------------parameters -----------------------////
const matchOptions = ref([])
const uploadObj = ref([])
const matchedObj = ref([])
const matchedObjwithparent = ref([])
const fieldSet = ref([])
const show = ref(false)
const showSwitch = ref(false)
const showSettleementSelect = ref(false)
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

const getParentOptions = async () => {

  await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: parentModel.value,
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {

    //tableDataList.value = response.data
    const ret = response.data
    console.log('Received response:', ret)
    // parentObj.value = (ret).map(({ id, code }) => {
    //   var obj = {}
    //   //    console.log(obj)
    //   obj[parent_key.value] = id
    //   obj['parent_code'] = code
    //   return obj
    // });



    parentObj.value = ret.map(elem => {
      elem[parent_key.value] = elem.id    // add the parent_key as is representd on the child 
      elem['parent_code'] = elem.code     // add the parent  as is representd on the child 
      return elem;
    });



    console.log('Received 3:', parentObj.value)


    ret.forEach(function (arrayItem: { id: string; type: string }) {
      var settOpt = {}
      settOpt.value = arrayItem.id
      settOpt.label = arrayItem.name + '(' + arrayItem.id + ')'
      //  console.log(countyOpt)
      settlementOptions.value.push(settOpt)
    })

    console.log('Options', settlementOptions)
  })
}





const handleSelectType = async (type: any) => {
  type = type
  console.log(type)
  if (type != 'settlement' && !value_switch.value) {
    showSettleementSelect.value = true
    showSwitch.value = true
  } else {
    showSettleementSelect.value = false
    showSwitch.value = true

  }

  if (type === 'settlement') {
    model.value = 'settlement'
    parentModel.value = 'county'
    parent_key.value = 'county_id'
    code.value = 'county_code'
    fieldSet.value = settlement_fields

    getParentOptions()
    console.log('settlements------>', type)
  } else if (type === 'parcel') {

    model.value = 'parcel'
    parentModel.value = 'settlement'
    parent_key.value = 'settlement_id'
    code.value = 'settlement_code'
    fieldSet.value = settlement_fields
    getParentOptions()


    fieldSet.value = parcel_fields
    console.log('parcel------>', parcel_fields)

  }







}


const handleMutlipleSettlements = async () => {

  console.log(value_switch)
  showSettleementSelect.value = !value_switch.value

}



const handleProcess = async () => {
  console.log('upload--->', matchedObjwithparent.value)
  for (let i = 0; i < matchedObjwithparent.value.length; i++) {

    let feature = matchedObjwithparent.value[i]
    let conv_feature = {}
    for (var prop in feature) {
      var matched_field = fieldSet.value.filter((obj) => {
        // console.log('+++++', obj)
        return obj.match === prop
      })
      //  console.log(i, matched_field)
      if (matched_field.length > 0) {
        conv_feature[matched_field[0].field] = feature[prop]  // Assign Field Vlue 
      }

      console.log('conv_feature----', matchedObjwithparent[i])

      conv_feature.geom = (matchedObjwithparent[i].geometry)    // Asign Geometry then stringfy it 


      console.log('conv_feature----', conv_feature)

      if (model.value != 'settlement' && !value_switch.value) {
        conv_feature.settlement_id = settlement.value   // if not a settlement, add settleemnt id (remember to remove counties)
        console.log("Setting up settlement ID")
      }
    }
    matchedObj.value.push(conv_feature)
  }
  console.log('processed:', matchedObj)


  // ************** prepare data to server ***************** //

  var formData = {}
  formData.model = model.value
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
  settlement.value = ''
  // clear all the fileters -------
}

const handleSelectSettlement = async (settlement: any) => {
  settlement = settlement

}








const fileList = ref<UploadUserFile[]>([])

const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  console.log(file, uploadFiles)
  show.value = false
  uploadObj.value = []
  matchedObj.value = []
  fieldSet.value = []

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

    console.log('------Json----')
    reader.onload = readJson




    reader.readAsText(rfile)
  }
}

const readJson = (event) => {
  let str = event.target.result
  let json = JSON.parse(str)

  console.log('json', json.features)

  // makeOptions(fields)
  for (let i = 0; i < json.features.length; i++) {
    uploadObj.value.push(json.features[i]) // Push to the temporary holder

  }
  show.value = true



  console.log('rows-uploadObj------>', uploadObj.value)
  console.log('rows-parentObj------>', parentObj.value)

  let mapped = parentObj.value.reduce((a, c) => (a[c.parent_code] = c, a), {})
  console.log("mapped---", mapped)



  matchedObjwithparent.value = uploadObj.value.map(o => Object.assign(o, mapped[o['properties'][code.value]]));

  console.log("matched---", matchedObjwithparent.value)
  const mergedfields = (Object.getOwnPropertyNames(matchedObjwithparent.value[0].properties));  // get properties from first row

  var pkeys = Object.keys(matchedObjwithparent.value[0])
  var ckeys = Object.keys(matchedObjwithparent.value[0].properties)
  var array1 = pkeys.concat(ckeys);

  console.log(array1)

  if (value_switch.value) {
    console.log("=====Multiple settlements")
    fieldSet.value.push({ field: 'settlement_id', match: '' })

  }
  makeOptions(array1)

}


const readXLSX = async (event) => {
  console.log('on file change.......', event)
  //file.value = event.target.files ? event.target.files[0] : null;   // Direct upload 
  file.value = event   // called from the uplaod funtion 

  console.log('The file---->', file)

  readXlsxFile(file.value).then((rows) => {
    const fields = Object.values(rows[0]) //  get all proterit4s of the first feature
    console.log("fields-->", fields)


    for (let j = 1; j < rows.length; j++) {
      var record = {}
      for (let i = 0; i < fields.length; i++) {
        var f = fields[i]
        var v = rows[j][i]
        record[f] = v
        //  console.log(record)
      }

      uploadObj.value.push(record) // Push to the temporary holder
    }  // remove header row



    let mapped = parentObj.value.reduce((a, c) => (a[c.parent_code] = c, a), {})
    matchedObjwithparent.value = uploadObj.value.map(o => Object.assign(o, mapped[o[code.value]]));

    console.log('rows-msapped------>', mapped)
    console.log('rows-matchedObjwithparent------>', matchedObjwithparent)

    const mergedfields = (Object.getOwnPropertyNames(matchedObjwithparent.value[0]));  // get properties from first row


    makeOptions(mergedfields)





    show.value = true

    if (value_switch.value) {
      console.log("=====> Multiple settlements")
      fieldSet.value.push({ field: 'settlement_id', match: '' })

    }

  })


}


</script>

<template>
  <ContentWrap :title="t('Upload Households Data')"
    :message="t('Ensure you have settlement ID in the data incase of batch import')">
    <el-divider border-style="dashed" content-position="left">Data</el-divider>

    <div style="display: inline-block; margin-left: 20px">
      <el-select v-model="type" :onChange="handleSelectType" :onClear="handleClear" placeholder="Select data to import">
        <el-option-group v-for="group in uploadOptions" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>
    </div>


    <div style="display: inline-block; margin-left: 20px">

      <el-switch v-model="value_switch" v-if="showSwitch" size="large" @click="handleMutlipleSettlements"
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
