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
import { ElMessage,  } from 'element-plus'
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


 
// lifecycle hooks
onMounted(() => {
 
   console.log('data----x', props.data)
  console.log('userInfo----x', userInfo)
    

})

const tableDocuments = ref([])
const tableDocumentsFiltered = ref([])
//tableDocuments.value = []
tableDocuments.value = props.data.documents ? props.data.documents : []

console.log('tableDocuments',tableDocuments)
 const cmodel = ref(props.data.docmodel)
 
// // Hide buttons if not admin 
const userIsAdmin = ref(false)
const showEditButtons = ref(false)
const documentOwner = ref(false)
const denyDownload = ref(false)

if (userInfo.roles.includes("admin")) {
  userIsAdmin.value = true
  showEditButtons.value = true
}


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

 

const downloadFile = async (data) => {

console.log(data.name)

const formData = {}
formData.filename = data.name
formData.doc_id = data.id
formData.responseType = 'blob'
await getFile(formData)
  .then(response => {
    console.log(response)

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', data.name)
    document.body.appendChild(link)
    link.click()

  })
  .catch(error => {
    ElMessage.error('Failed')  });

}


const docFormats = []
const viewDocument = async (data) => {
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




const removeDocument = (data) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = cmodel.value
  formData.filesToDelete = [data.name]
  deleteDocument(formData)


   // remove the deleted object from array list 
   let index = tableDocumentsFiltered.value.indexOf(data);
  if (index !== -1) {
    tableDocumentsFiltered.value.splice(index, 1);
  }

}

 


</script>

<template>
  
  <el-table :data="tableDocumentsFiltered" border style="width: 100%">
  <el-table-column label="Name" prop="name" />
  <el-table-column label="Type" prop="document_type.type" />
  <el-table-column label="Size(mb)" prop="size" />
  <el-table-column  v-if="!denyDownload"  label="Actions">
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
        <el-button type="success"  @click="downloadFile(scope.row)"  :icon="Download" circle />
      </el-tooltip>

      <el-tooltip content="View" placement="top">
        <el-button type="primary"  @click="viewDocument(scope.row)"  :icon="TopRight" circle />

      </el-tooltip>
      <el-tooltip content="Delete" placement="top">
        <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" width="290px" icon-color="#626AEF"
              title="Are you sure to delete this document?" @confirm="removeDocument(scope.row)">
              <template #reference>
                <el-button type="danger"  v-if="userIsAdmin || documentOwner"   :icon="Delete" circle />

               </template>
            </el-popconfirm>
          </el-tooltip>

       </div>
    </template>
  </el-table-column>
</el-table>

</template>
 


