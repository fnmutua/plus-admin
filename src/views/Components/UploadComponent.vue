<script setup>
import { ref, toRefs, onMounted } from 'vue'
import { ElButton, ElProgress, ElDialog, ElUpload, ElSelect, ElTooltip, ElOption, ElOptionGroup, ElCheckbox  } from 'element-plus';
import {
  Position, View, Plus, User, Download, Briefcase, Delete, Edit,
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading, UploadFilled, CircleCloseFilled,
} from '@element-plus/icons-vue'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { ElMessage,  } from 'element-plus'
import { uuid } from 'vue-uuid'
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import axios from 'axios';
import state from '@/config/axios'

const prod = import.meta.env.VITE_APP_HOST // remove the port for production

 

const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const props = defineProps({
  message: String,
  showDialog: Boolean,
  data: Array,
  umodel: String,
  field: String,
  filterOptions:String

})
const { show } = toRefs(props)



// reactive state
const count = ref(0)
const morefileList = ref([])
const documentCategory = ref()
// functions that mutate state and trigger updates
 

// lifecycle hooks
onMounted(() => {
 
  console.log(props.message)
  console.log(props.showDialog)
  console.log('data----x', props.data)
 
  console.log('filterOptions----x', props.filterOptions)
  console.log('DocTypes----x', DocTypes.value)


})


const DocTypes = ref([])
const DocTypesFiltered = ref([])
const DocTypesAll = ref([])
const getDocumentTypes = async () => {
  const res = await getCountyListApi({
    params: {
      pageIndex: 1,
      limit: 100,
      curUser: 1, // Id for logged in user
      model: 'document_type',
      searchField: 'name',
      searchKeyword: '',
      sort: 'ASC'
    }
  }).then((response) => {
     //tableDataList.value = response.data
    var ret = response.data
    console.log('filterOptions---Docypes-x', response.data)


    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cur);
      return acc;
    }, {});

    //console.log(nestedData.Map)
    for (let property in nestedData) {
      let opts = nestedData[property];
      var doc = {}
      doc.label = property
      doc.options = []

      opts.forEach(function (arrayItem) {
        let opt = {}
        opt.value = arrayItem.id
        opt.label = arrayItem.type
        doc.options.push(opt)

      })
      console.log('doc, ',doc)
      
      DocTypes.value.push(doc)

      if (props.filterOptions &&  doc.label == props.filterOptions) {
        console.log("Filtred", props.filterOptions)
        DocTypesFiltered.value.push(doc)

      } else {
        console.log("Not Filtred", props.filterOptions)
        DocTypesAll.value.push(doc)

        //
      }

    }
    console.log(DocTypes)

  })

  if (props.filterOptions  ) {
    DocTypes.value = DocTypesFiltered.value
  }
}
getDocumentTypes()


 
const addMoreDocuments = ref(props.showDialog)
 //const xmodel = ref(props.umodel)
//const currentRow = ref(props.data)
//const field_id = ref(props.field)



const addMoreDocs = () => {
   addMoreDocuments.value = true
 
}
const loadingPosting = ref(false)


const beforeUpload = (files) => {


for (var i = 0; i < files.length; i++) {


  var isPng = false;
  var isJPG = false;
  var isXls = false;
  var isXlsx = false;
  var isPdf = false;
  var isDoc = false;
  var isZip = false;
  var isDocx = false;
  if (documentCategory.value === 21) {   // Photos
    console.log('Photos', documentCategory.value, files[i].raw.type)
    isPng = files[i].raw.type === 'image/png'
    isJPG = files[i].raw.type === 'image/jpeg'

    if (!isPng && !isJPG) {
      //this.$message.error('Upload only Excel files')
      ElMessage.error('Use png/jpg  formats for photos')

    }

  }
  else {

    isXls = files[i].raw.type === 'application/vnd.ms-excel'
    isXlsx = files[i].raw.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    isPdf = files[i].raw.type === 'application/pdf'
    isZip = files[i].raw.type === 'application/zip'
    isZip = files[i].raw.type === 'application/x-zip-compressed'
    isDoc = files[i].raw.type === 'application/msword'
    isDocx = files[i].raw.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    if (!isXls && !isXlsx && !isPdf && !isZip && !isDoc && !isDocx) {
      //this.$message.error('Upload only Excel files')
      ElMessage.error('Upload only pdf/xls/xlsx/zip/doc/docx files')

    }

  }


  const isLt50M = files[i].raw.size / 1024 / 1024 < 50;


  if (!isLt50M) {
    // this.$message.error('File size should not exceed 5MB')
    ElMessage.error('File size should not exceed 50MB')
  }
  return (isXls || isXlsx || isPdf || isZip || isDoc || isDocx || isPng || isJPG) && isLt50M
}
}

const protectedFile =ref(false)

const uploadProgress = ref()

const submitMoreDocuments = async () => {
 
console.log('loadingPosting.value.......', morefileList.value.length)
 
 
  if (morefileList.value.length == 0) {
    ElMessage.error('Select at least one file!')
  }

 
  else {
  // uploading the documents 
  loadingPosting.value=true

    const fileTypes = []
  const formData = new FormData()
  let files = []
  for (var i = 0; i < morefileList.value.length; i++) {
    console.log('------>file', morefileList.value[i])
    var format = morefileList.value[i].name.split('.').pop() // get file extension
    //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
    fileTypes.push(format)
    // formData.append('files', fileList.value[i])
    // formData.file = fileList.value[i]

    formData.append('model', props.umodel)
    formData.append('createdBy', userInfo.id)

    formData.append('files', morefileList.value[i].raw)
    formData.append('format', morefileList.value[i].name.split('.').pop())
    formData.append('category', documentCategory.value)
    formData.append('field_id', props.field)
    formData.append('protected', protectedFile.value)

    formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
    formData.append('code', uuid.v4())
    formData.append(props.field, props.data.id)

    console.log('formData',props.field)

  }

 // addMoreDocuments.value = false

 const res = await uploadFilesBatch(formData)

 
 

 if (res.code === "0000") {
   loadingPosting.value = false
   addMoreDocuments.value = false
      }

  }



}

const onExceeed = async () => {
 ElMessage.warning("Maximum number of files (10) exceeded!")
}

const trackFileAvailability = async (progress) => {
       console.log('prgress', progress)
}

const handleFileChange = async (file, fileList) => {
      // Handle the file change event
      console.log('File selected:', file);
      console.log('File list:', fileList[0].status);

      // Start tracking the file availability
      trackFileAvailability();
}

const showUpload = ref(false)

const handleSelect = async (selected) => {
  showUpload.value=true 
    }

    const dialogWidth = '30%'

</script>

<template>
  <div class="responsive-container">
    <el-dialog v-model="addMoreDocuments" title="Upload More Documents" :width="dialogWidth" >
      <el-select
        class="dialog-select"
        v-model="documentCategory"
        placeholder="Select Type"
        clearable
        filterable
        :onChange="handleSelect"
      >
        <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>

      <div class="dialog-upload">
        <el-upload
          ref="upload"
          v-if="showUpload"
          v-model:file-list="morefileList"
           multiple
          :limit="10"
          :on-exceed="onExceeed"
          :auto-upload="false"
        >
           <el-button class="full-width"  type="primary" :icon="UploadFilled"> Select File(s)  </el-button>

        </el-upload>
      </div>


      <el-tooltip
        class="box-item"
        effect="dark"
        content="Only the Owner and Admin can view Private documents"
        placement="right-end"
      >
      <el-checkbox v-model="protectedFile">Private File</el-checkbox>
      </el-tooltip>

      <div class="dialog-progress">
        <el-progress
          :stroke-width="20"
          :show-text="false"
          :percentage="loadingPosting ? '50' : ''"
          :format="format"
          :indeterminate="true"
        />
      </div>

      <template #footer>
        <span class="dialog-footer">
    
          <el-row class="mb-4">

          <el-tooltip content="Cancel" placement="top">
          <el-button type="danger"   :icon="CircleCloseFilled"  @click="addMoreDocuments = false"  circle />
        </el-tooltip>

          <!-- <el-button type="primary" @click="submitMoreDocuments()">
            <i class="el-icon-check"></i>
          </el-button> -->
          <el-tooltip content="Submit" placement="top">
          <el-button type="success"   :icon="UploadFilled" @click="submitMoreDocuments()"   circle />
        </el-tooltip>
      </el-row >
    </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.responsive-container {
  max-width: 30%;
  padding: 10px;
}

.dialog-select {
  width: 100%;
  margin-bottom: 10px;
}

.dialog-upload {
  margin-bottom: 10px;
}

.dialog-progress {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .dialog-select {
    width: 100% !important;
  }
}
</style>
