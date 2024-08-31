<script setup>
import { ref, toRefs, onMounted } from 'vue'
import {
  ElButton, ElProgress, ElDialog, ElUpload, ElSelect, ElOption, ElTable, ElTableColumn, ElDropdown,
  ElDropdownItem, ElPopconfirm, ElTooltip, ElInput
} from 'element-plus';
import {
  Position, View, Plus, User, TopRight, Briefcase, Download, Delete, Edit,  
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading,UploadFilled
} from '@element-plus/icons-vue'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { ElMessage, ElPagination } from 'element-plus'
import { uuid } from 'vue-uuid'
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch } from '@/api/settlements'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'
import { getFile } from '@/api/summary'

import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


const props = defineProps({
  message: String,
  showDialog: Boolean,
  data: Array,
  docmodel: String,
  field: String
})
const { show } = toRefs(props)


// const props = defineProps(['message', 'showDialog', 'data', 'docmodel', 'field']);
// const { show } = toRefs(props);

const searchQuery = ref('');

const filterDocuments = () => {
  const query = searchQuery.value.toLowerCase();
  tableDocumentsFiltered.value = tableDocuments.value.filter(document => 
    document.name.toLowerCase().includes(query)
  );
};


const onSearch = () => {
  filterDocuments();
};


// lifecycle hooks
onMounted(() => {

  console.log('data----x', props.data)
  console.log('userInfo----x', userInfo)
  filterDocuments();


})


const tableDocuments = ref([])
const tableDocumentsFiltered = ref([])
//tableDocuments.value = []
tableDocuments.value = props.data.documents ? props.data.documents : []

//const cmodel = ref(props.data.docmodel)

// // Hide buttons if not admin 
const userIsAdmin = ref(false)
const showEditButtons = ref(false)
const documentOwner = ref(false)
const denyDownload = ref(false)

if (userInfo.roles.includes("admin") || (userInfo.roles.includes("super_admin"))) {
  userIsAdmin.value = true
  showEditButtons.value = true
}
console.log('tableDocuments', tableDocuments)


const protectedFile = ref(false)



if (tableDocuments.value.length > 0) {
  if (userInfo.id == tableDocuments.value[0].createdBy) {
    documentOwner.value = true
    console.log("Document owner is logged in",)

  }
  if (userIsAdmin.value) {
    tableDocumentsFiltered.value = tableDocuments.value
  } else {
    //tableDocumentsFiltered.value = tableDocuments.value.filter(obj => obj.protectedFile == false);
    tableDocumentsFiltered.value = tableDocuments.value.filter(obj => obj.protectedFile === false || obj.createdBy === userInfo.id);


  }



  console.log(tableDocumentsFiltered)


}

if (userInfo.roles.includes("public")) {
  denyDownload.value = true

}


const downloadStarted = ref(false)

 


const downloadFile = async (data) => {
  console.log(data.name);
  viewLoading.value = true;
  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  // Add a flag to track if the download has started


  // Attach a 'beforeunload' event listener to the window
  window.addEventListener('beforeunload', () => {
    if (viewLoading.value) {
      console.log('Download has started.');
      viewLoading.value = false;
    }
  });

  try {
    const response = await getFile(formData);
    console.log(response);

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', data.name);
    document.body.appendChild(link);
    link.click();
    viewLoading.value = false;
  } catch (error) {
    ElMessage.error('Failed');
    viewLoading.value = false;
  }
};



const docFormats = []
 

const viewLoading = ref(false)

const viewDocument = async (data) => {
  viewLoading.value = true
  const documentUrl = data.url; // Use 'data.url' to access the document URL

  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  try {
    const response = await getFile(formData);
    const blobData = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blobData);
    const newTab = window.open(url, '_blank');

    if (newTab) {
      // Attach a load event listener to the new tab's window object
      newTab.addEventListener('load', () => {
        // The new tab has fully loaded
        console.log('New tab has fully loaded.');
        viewLoading.value = false
      });
    } else {
      console.error('Failed to open a new tab.');
      ElMessage.error('Failed to open the document.');
      viewLoading.value = false
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to load the document.');
    viewLoading.value = false
  }
};



const removeDocument = (data) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = props.data.docmodel
  formData.filesToDelete = [data.name]
  deleteDocument(formData)


  // remove the deleted object from array list 
  let index = tableDocumentsFiltered.value.indexOf(data);
  if (index !== -1) {
    tableDocumentsFiltered.value.splice(index, 1);
  }

}



const totalItems = ref(10)

const pageSize = ref(5)
const currentPage = ref(1)
const handlePageChange = async (newPage) => {

  currentPage.value = newPage;
}

//<el-table  :data="docs.slice((currentPage - 1) * pageSize, currentPage * pageSize)"

const emit = defineEmits(['openDialog']);

const addDocument = () => {
  emit('openDialog');
};
</script>

 

<template>

  <div  >

    <div class="search-add-container">
      <el-input 
        v-model="searchQuery" 
        placeholder="Search documents..." 
        clearable
        style="margin-left: 10px ; width:95%"
       
        @input="onSearch"
      />
   

      <el-tooltip content="Import Documents" placement="top">
        <el-button  
        type="primary" 
         :icon="UploadFilled"
        @click="addDocument"
      >Import</el-button>
    </el-tooltip>


    </div>


    <ul v-infinite-scroll="tableDocumentsFiltered"   v-loading="viewLoading" :infinite-scroll-disabled="disabled"   class="infinite-list" style="overflow: auto">
      <li v-for="(document, index) in tableDocumentsFiltered" :key="document.id" class="list-item">
        <span class="document-name">{{ index + 1 }}. {{ document.name }}</span>

      <div class="button-container">
        <el-button size="small" type="primary" @click="viewDocument(document)" :icon="TopRight" plain />
        <el-button size="small" v-loading="downloadStarted" type="success" @click="downloadFile(document)" :icon="Download" plain />
        <el-popconfirm
          confirm-button-text="Yes"
          cancel-button-text="No"
          :icon="InfoFilled"
          width="290px"
          icon-color="#626AEF"
          title="Are you sure to delete this document?"
          @confirm="removeDocument(document)"
        >
          <template #reference>
            <el-button size="small" type="danger" v-if="userIsAdmin || documentOwner" :icon="Delete" plain />
          </template>
        </el-popconfirm>
      </div>
    </li>
  </ul>
    <p v-if="loading">Loading...</p>
    <p v-if="noMore">No more</p>
  </div>
 

 
</template>


<style>
.infinite-list {
  height: 150px;
  padding: 0;
  margin: 0;
  width: 60%;

  list-style: none;
}
.infinite-list .infinite-list-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  background: var(--el-color-primary-light-9);
  margin: 10px;
  color: var(--el-color-primary);
}
.infinite-list .infinite-list-item + .list-item {
  margin-top: 10px;
}
</style>

<style scoped>
.pagination-wrapper {
  margin-top: 5px;
  display: flex;
  justify-content: center;
}

.pagination-center {
  text-align: center;

}
</style>


<style scoped>
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid #ebeef5;
}

.document-name {
  flex-grow: 1;
  max-width: 70%; /* Takes up 70% of the space */
  margin-right: 10px;
  color: rgb(71, 111, 186);
  word-wrap: break-word; /* Ensures text wraps */
  white-space: normal; /* Allows text to wrap */
  font-size: 0.9em; /* Makes the text smaller */
  font-style: italic; /* Makes the text italic */
}
.search-add-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  width:60%
}

.el-button {
  margin-left: 5px;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Adjusts space between content and buttons */
  padding: 8px;
  border-bottom: 1px solid #ebeef5;
}
.list {
  height: 300px;
  padding: 0;
  margin: 0;
  list-style: none;
}

</style>