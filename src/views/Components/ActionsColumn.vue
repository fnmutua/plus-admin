<script setup lang="ts">
import { ref, toRefs,computed, onMounted } from 'vue'
import { ElButton, ElProgress, ElDialog, ElUpload, ElSelect, ElTooltip, ElOption, ElOptionGroup, ElCheckbox, ElTableColumn, ElTable, ElPopconfirm , } from 'element-plus';
import {
  Position,
  TopRight,
  User,
  Plus,
  Edit,
  Delete,
  InfoFilled,
  View,
  Download,
  Filter,
  MessageBox
} from '@element-plus/icons-vue'

 
import { useAppStoreWithOut,useAppStore } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
 
import { useRouter } from 'vue-router'
import {   DeleteRecord,  deleteDocument  } from '@/api/settlements'
 
 

const { push, replace } = useRouter()

console.log("actions column.....")

const props = defineProps({
   model: String,
   Edit: String,
   model: String,
   currentRoute: Object,
  actionColumnWidth:String,

})
 
const { wsCache } = useCache()
const appStore = useAppStore()
 
//const userInfo = wsCache.get(appStore.getUserInfo)
//const isAdmin = (wsCache.get(XappStore.getAdminButtons));


const xappStore = useAppStoreWithOut()

const isAdmin = computed(() => xappStore.getAdminButtons)


 console.log('getAdmin >-----',isAdmin.value)
 


// lifecycle hooks
onMounted(() => {
 
 

})


const editFacility = (data) => {

  console.log(data)
  
push({
 name: props.Edit,
   query: { id: data.id }
 
});
 
  
}

 
const DeleteProject = async (data) => {
  console.log('----->', data)
  
  let formData = {}
  formData.id = data.id
  formData.model = props.model

  await DeleteRecord(formData);

  // Delete documents only if there are any documents to delete 
  if (data.documents && data.documents.length > 0) {
    formData.filesToDelete = data.documents;
    await deleteDocument(formData); // await the result of deleteDocument
  }

  // Now you can access props.currentRoute after awaiting DeleteRecord and deleteDocument
  const path =  props.currentRoute.path;
  const query = props.currentRoute.query;

  console.log('---xx-->', path);

  replace({
    path: '/redirect' + path,
    query: query
  });
}




 

</script>

<template>
 
    <el-table-column fixed="right" label="Actions" :width="actionColumnWidth">
    <template #default="scope">
      <!-- Your action buttons here -->
      <el-tooltip  v-if="isAdmin" content="Edit" placement="top">
        <el-button
          type="success" size="small" :icon="Edit" @click="editFacility(scope.row)"
          circle />
      </el-tooltip>

      <el-tooltip content="View Profile" placement="top">
        <el-button
          type="warning" size="small" :icon="Position" @click="flyTo(scope.row)"
          circle />
      </el-tooltip>

      <el-tooltip content="View Profile" placement="top">
        <el-button v-if="isAdmin"
          type="primary" size="small" :icon="TopRight"
          @click="viewProfile(scope.row)" circle />
      </el-tooltip>

      <el-tooltip  v-if="isAdmin"  content="Delete" placement="top">
        <el-popconfirm
          confirm-button-text="Yes" cancel-button-text="No" :icon="InfoFilled" icon-color="#626AEF"
          title="Are you sure to delete this facility?" width="150"
          @confirm="DeleteProject(scope.row)">
          <template #reference>
            <el-button type="danger" size="small" :icon=Delete circle />
          </template>
        </el-popconfirm>
      </el-tooltip>
    </template>
  </el-table-column>

 
</template>
 