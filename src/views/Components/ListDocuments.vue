<script setup>
import { ref, toRefs, onMounted } from 'vue'
import {
  ElButton, ElProgress, ElDialog, ElUpload, ElSelect, ElOption, ElTable, ElTableColumn, ElDropdown,
  ElDropdownItem,ElPopconfirm, ElTooltip
} from 'element-plus';
import {
  Position, View, Plus, User, TopRight, Briefcase, Download, Delete, Edit,
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading
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

 
// lifecycle hooks
onMounted(() => {
 
   console.log('data----x', props.data)
  console.log('userInfo----x', userInfo)
    

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

if (userInfo.roles.includes("admin") || (userInfo.roles.includes("super_admin") ) ){
  userIsAdmin.value = true
  showEditButtons.value = true
}
console.log('tableDocuments',tableDocuments)


const protectedFile = ref(false)

 

if (tableDocuments.value.length>0) {
  if (userInfo.id==tableDocuments.value[0].createdBy) {
  documentOwner.value = true
  console.log("Document owner is logged in", )
 
  }
  if (userIsAdmin.value) {
    tableDocumentsFiltered.value  = tableDocuments.value
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

const xdownloadFile = async (data) => {

console.log(data.name)

const formData = {}
 
let fname 
  const filename = data.row.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
         fname=filename + '.'+data.row.format
      } else {
        fname = filename

      }

  formData.filename =fname
  console.log("file name:", formData)


formData.doc_id = data.id
formData.responseType = 'blob'
await getFile(formData)
  .then(response => {
    console.log(response)

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
   // link.setAttribute('download', data.name)
    const filename = data.row.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
        link.setAttribute('download', `${filename}.${data.row.format}`);
        
      } else {
        link.setAttribute('download', filename);
      }


    document.body.appendChild(link)
    link.click()

  })
  .catch(error => {
    ElMessage.error('Failed')  });

}


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
const xviewDocument = async (data) => {
  const documentUrl = data.url; // Use 'data.url' to access the document URL

  const formData = {};
  formData.filename = data.name;
  formData.doc_id = data.id;
  formData.responseType = 'blob';

  try {
    const response = await getFile(formData);
    const blobData = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blobData);
    window.open(url, '_blank');
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to load the document.');
  }
};

const viewLoading = ref(false)

const viewDocument = async (data) => {
  viewLoading.value=true
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
        viewLoading.value=false
      });
    } else {
      console.error('Failed to open a new tab.');
      ElMessage.error('Failed to open the document.');
      viewLoading.value=false
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to load the document.');
    viewLoading.value=false
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

 

  const totalItems=ref(10)
 
const pageSize = ref(5)
const currentPage = ref(1)
const handlePageChange = async (newPage) => {

currentPage.value = newPage;
}

//<el-table  :data="docs.slice((currentPage - 1) * pageSize, currentPage * pageSize)"

 
</script>



<template>
  
  <el-table v-loading="viewLoading" stripe="true"  empty-text="No Documents"  height="250"  show-header="false" :data="tableDocumentsFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize)" border style="width: 100%">

    
  <el-table-column label="Name" prop="name"  sortable />
  <el-table-column label="Type" prop="document_type.type"  sortable/>
  <el-table-column label="Size(mb)" prop="size"  sortable/>
  <el-table-column  v-if="!denyDownload"  label="Actions" >
    <template #default="scope">
      <el-dropdown v-if="isMobile">
        <span class="el-dropdown-link">Actions</span>
        <el-dropdown-menu>
          <el-dropdown-item @click="downloadFile(scope.row)">Download</el-dropdown-item>
          <el-dropdown-item @click="viewDocument(scope.row)">View</el-dropdown-item> <!-- New "View" button -->
          <el-dropdown-item v-if="userIsAdmin || documentOwner"  @click="removeDocument(scope.row)">Remove</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <div v-else>
        <el-tooltip content="Download" placement="top">
        <el-button  size="small" v-loading="downloadStarted"  type="success"  @click="downloadFile(scope.row)"  :icon="Download" circle />
      </el-tooltip>

      <el-tooltip content="View" placement="top">
        <el-button  size="small"  type="primary"  @click="viewDocument(scope.row)"  :icon="TopRight" circle />

      </el-tooltip>
      <el-tooltip content="Delete" placement="top">
        <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" width="290px" icon-color="#626AEF"
              title="Are you sure to delete this document?" @confirm="removeDocument(scope.row)">
              <template #reference>
                <el-button size="small"  type="danger"  v-if="userIsAdmin || documentOwner"   :icon="Delete" circle />

               </template>
            </el-popconfirm>
          </el-tooltip>

       </div>
    </template>
  </el-table-column>
</el-table>


<div class="pagination-wrapper" v-if="tableDocumentsFiltered.length > 5">
    <div class="pagination-center">
      <el-pagination
        :page-size="5"
         small
        layout="prev, pager, next"
        :total="tableDocumentsFiltered.length"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>
 



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