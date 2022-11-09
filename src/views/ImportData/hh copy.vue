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
const value_switch = ref(true)


//// ------------------parameters -----------------------////
const model = 'households'            // the model 
const code = 'settlement_code'
const parent_key = 'settlement_id'   // the parent foregin key in the model 
const parentModel = 'settlement'      // the parent model


///---------------------xlsx-
const file = ref()


//// ------------------parameters -----------------------////
const matchOptions = ref([])
const uploadObj = ref([])
const matchedObj = ref([])
const matchedObjwithparent = ref([])
const fieldSet = ref([])
const show = ref(false)
const showSettleementSelect = ref(false)
const { t } = useI18n()



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
    field: 'code',
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


fieldSet.value = (hh_fields)


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

      //console.log(conv_feature)

      if (model != 'settlement' && !value_switch.value) {
        conv_feature.settlement_id = settlement.value   // if not a settlement, add settleemnt id (remember to remove counties)
        console.log("Setting up settlement ID")
      }
    }
    matchedObj.value.push(conv_feature)
  }
  console.log('processed:', matchedObj)



  var formData = {}
  formData.model = model
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


const getParentOptions = async () => {

  await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: parentModel,
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
    //tableDataList.value = response.data
    var ret = response.data
    parentObj.value = (ret).map(({ id, code }) => {
      var obj = {}
      //    console.log(obj)
      obj[parent_key] = id
      obj['parent_code'] = code
      return obj
    });




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




getParentOptions()





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
    if (ftype == 'json') {
      console.log('------Json----')
      reader.onload = readJson
    } else if (ftype == 'xlsx') {

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
    console.log("=====Multiple settlemes")
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


    for (let j = 1; j < rows.length; j++) {
      var record = {}
      for (let i = 0; i < fields.length; i++) {
        var f = fields[i]
        var v = rows[j][i]
        record[f] = v
        //    console.log(record)
      }

      uploadObj.value.push(record) // Push to the temporary holder
    }  // remove header row

    console.log('rows-uploadObj------>', uploadObj)
    console.log('rows-parentObj------>', parentObj)


    let mapped = parentObj.value.reduce((a, c) => (a[c.parent_code] = c, a), {})
    matchedObjwithparent.value = uploadObj.value.map(o => Object.assign(o, mapped[o[code]]));


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
    <el-divider border-style="dashed" content-position="left">Filters</el-divider>




    <div style="display: inline-block; margin-left: 20px">

      <el-switch v-model="value_switch" size="large" @click="handleMutlipleSettlements"
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
