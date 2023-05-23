<script setup>
import { ref, toRefs, onMounted } from 'vue'
 import { ElButton, ElProgress, ElDialog, ElUpload, ElSelect, ElOption, ElOptionGroup } from 'element-plus';
import {
  Position, View, Plus, User, Download, Briefcase, Delete, Edit,
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading
} from '@element-plus/icons-vue'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { ElMessage,  } from 'element-plus'
import { uuid } from 'vue-uuid'
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch } from '@/api/settlements'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'



const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const props = defineProps({
  message: String,
  showDialog: Boolean,
  data: Array,
  model: String,
  field: String
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
  console.log('props----x', props.model)


})


const DocTypes = ref([])
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


    const nestedData = ret.reduce((acc, cur) => {
      const group = cur.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(cur);
      return acc;
    }, {});

    console.log(nestedData.Map)
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
      DocTypes.value.push(doc)

    }
    console.log(DocTypes)

  })
}
getDocumentTypes()


 
const addMoreDocuments = ref(props.showDialog)
const model = ref(props.model)
const currentRow = ref(props.data)
const field_id = ref(props.field)



const addMoreDocs = () => {
   addMoreDocuments.value = true
 
}
const loadingPosting = ref(false)

const submitMoreDocuments = async () => {
  loadingPosting.value=true
 
console.log('loadingPosting.value.......', loadingPosting.value)

  console.log('More files.....', morefileList)

  // uploading the documents 
  const fileTypes = []
  const formData = new FormData()
  let files = []
  for (var i = 0; i < morefileList.value.length; i++) {
    console.log('------>file', morefileList.value[i])
    var format = morefileList.value[i].name.split('.').pop() // get file extension
    //  formData.append("file",this.multipleFiles[i],this.fileNames[i]+"_"+dateVar+"."+this.fileTypes[i]);
    fileTypes.push(format)
    // formData.append('file', fileList.value[i])
    // formData.file = fileList.value[i]

    formData.append('model', model)
    formData.append('createdBy', userInfo.id)

    formData.append('file', morefileList.value[i].raw)
    formData.append('format', morefileList.value[i].name.split('.').pop())
    formData.append('category', documentCategory.value)
    formData.append('field_id', field_id.value)

    formData.append('size', (morefileList.value[i].raw.size / 1024 / 1024).toFixed(2))
    formData.append('code', uuid.v4())
    formData.append(field_id.value , currentRow.value.id)

    console.log('formData',field_id.value)

  }

  addMoreDocuments.value = false

  const res = await uploadFilesBatch(formData)

 if (res.code === "0000") {
  loadingPosting.value=false
      }

}

const onExceeed = async () => {
 ElMessage.warning("Maximum number of files exceeded")
}



</script>

<template>
  <div  v-loading.fullscreen.lock="loadingPosting" element-loading-text="Uploading the files. Please wait.......">
    

    <!-- <el-button type="success" :icon="Plus" circle @click="addMoreDocs()" style="margin-left: 10px;margin-top: 5px" size="small" /> -->

    <el-dialog  v-model="addMoreDocuments" title="Upload More Documents" width="25%">
 
      <el-select :style="{ width: '100% ', marginBottom: '10px' }" v-model="documentCategory" placeholder="Select Type" clearable filterable >
        <el-option-group v-for="group in DocTypes" :key="group.label" :label="group.label">
          <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
        </el-option-group>
      </el-select>
 
      <div>

  </div>
      <el-upload
        ref="upload"
        v-model:file-list="morefileList"
        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
        multiple
        :limit="5"
        :on-exceed="onExceeed"
        :auto-upload="false">
        <el-button :style="{ width: '100% ', marginBottom: '10px' }"  type="primary">Select File(s)</el-button>
      </el-upload>
     
  
<template #footer>
      <span class="dialog-footer">
        <el-button @click="addMoreDocuments = false">Cancel</el-button>
        <el-button type="primary" @click="submitMoreDocuments()" >
          Confirm
        </el-button>
      </span>
    </template>
    </el-dialog>



  </div>
</template>

<style>

.centered-div {
  display: flex;
  justify-content: center;
  align-items: center;
}


</style>