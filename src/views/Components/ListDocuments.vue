<script setup>
import { ref, toRefs, onMounted } from 'vue'
 import { ElButton, ElProgress, ElDialog, ElUpload, ElSelect, ElOption, ElTable, ElTableColumn } from 'element-plus';
import {
  Position, View, Plus, User, Download, Briefcase, Delete, Edit,
  Filter, InfoFilled, CopyDocument, Search, Setting, Loading
} from '@element-plus/icons-vue'
import { getCountyListApi, getListWithoutGeo } from '@/api/counties'
import { ElMessage,  } from 'element-plus'
import { uuid } from 'vue-uuid'
import { getSettlementListByCounty, getHHsByCounty, uploadFilesBatch } from '@/api/settlements'
import { CreateRecord, DeleteRecord, updateOneRecord, deleteDocument, uploadDocuments, getfilteredGeo } from '@/api/settlements'



const props = defineProps({
  message: String,
  showDialog: Boolean,
  data: Array,
  model: String,
  field: String
})
const { show } = toRefs(props)


 
// lifecycle hooks
onMounted(() => {
 
    console.log('data----x', props.data.documents)
 

})

const tableData = ref(props.data.documents)

 

 



const downloadFile = async (data) => {

console.log(data.name)

const formData = {}
formData.filename = data.name
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
    console.error('Error downloading file:', error);
  });

}


const removeDocument = (data: TableSlotDefault) => {
  console.log('----->', data)
  let formData = {}
  formData.id = data.id
  formData.model = model
  formData.filesToDelete = [data.name]
  deleteDocument(formData)
}

 


</script>

<template>
  
 
  <el-table :data="tableData" border style="width: 100%">
    <el-table-column label="Name" prop="name" />
                  <el-table-column label="Type" prop="document_type.type" />
                  <el-table-column label="Size(mb)" prop="size" />
                  <el-table-column label="Actions">
                    <template #default="scope">
                      <el-dropdown v-if="isMobile">
                        <span class="el-dropdown-link">Actions</span>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="downloadFile(scope.row)">Download</el-dropdown-item>
                          <el-dropdown-item
v-if="showAdminButtons"
                            @click="removeDocument(scope.row)">Remove</el-dropdown-item>
                        </el-dropdown-menu>
                      </el-dropdown>
                      <div v-else>
                        <el-button type="success" @click="downloadFile(scope.row)">Download</el-button>
                        <el-button
type="danger" v-if="showAdminButtons"
                          @click="removeDocument(scope.row)">Remove</el-button>
                      </div>
                    </template>
  </el-table>
</template>
 


