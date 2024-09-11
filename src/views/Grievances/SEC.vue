<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">


import { ElButton} from 'element-plus'
import {
  
  Back} from '@element-plus/icons-vue'

import { ref } from 'vue'
import {
  ElPagination, 
  ElRow, ElTable, ElTableColumn, ElCard} from 'element-plus'
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import {
    getCollectorData, loginCollector,
    getCollectorDataCSV, getWithMedia,getSubmissions,
    getCollectorDataFlattened, getGeoJSON, getRawCSV, getSubmitters
} from '@/api/collector'




const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)

 

console.log("userInfo--->", userInfo)

const projects =ref([])
const forms =ref([])
const loginUserToCollector = async () => { 
    var formData = {}
    formData.email = "kisip.mis@gmail.com"
    formData.password = "Admin@2011"

 


    await loginCollector(formData).then((response) => {
        // Assuming the token is in the response data
        const token = response.token;
        // Save the token to localStorage
        localStorage.setItem('collectorToken', token);
        console.log('collectorToken:', response);
        const all_projects = JSON.parse(response.data);
        console.log('projects:', projects);

        // loop through each project 
        all_projects.forEach(function (project) {
            
          projects.value.push(project)

            project.formList.forEach(function (form) {
                
              forms.value.push(form)


            })

        })


        getSecData()
         
    })



}


const getSecData = async () => { 
  var formData = {}
  formData.project = "1"
  formData.form = "sec_officials"


  var userToken = localStorage.getItem('collectorToken');
  formData.token =userToken
  await getSubmissions(formData).then((response) => {
    console.log('Subissions', response)

  })


 
}
 
await loginUserToCollector()

console.log("projects--->", projects.value)
console.log("forms--->", forms.value)


</script>

<template>
  <el-card>
    <el-row type="flex" justify="start" gutter="10" style="display: flex; flex-wrap: nowrap; align-items: center; margin-bottom:10px">

      <div class="max-w-200px">
        <el-button type="primary" plain :icon="Back" @click="goBack" style="margin-right: 10px;">
          Back
        </el-button>
      </div>

   
      <!-- Download All Component -->
    </el-row>


    <el-table :data="tableDataList" :loading="loading" size="small" border>
      <el-table-column label="#" width="80" prop="id" sortable>
        <template #default="scope">
          <div v-if="scope.row.grievance_documents.length > 0" style="display: inline-flex; align-items: center;">
            <span>{{ scope.row.id }}</span>
            <Icon icon="material-symbols:attachment" style="margin-left: 4px;" />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Code" prop="code" sortable />
      <el-table-column label="Complainant" prop="name" sortable />
      <el-table-column label="Description" prop="description" sortable />
      <el-table-column label="County" prop="county.name" sortable />
      <el-table-column label="Settlement" prop="settlement.name" sortable />
      
   
    </el-table>

    <ElPagination
layout="sizes, prev, pager, next, total" v-model:currentPage="currentPage"
      v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true"
      @size-change="onPageSizeChange" @current-change="onPageChange" class="mt-4" />
  </el-card>

 
 
</template>
