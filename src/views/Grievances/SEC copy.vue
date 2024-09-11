<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">


import { ElButton} from 'element-plus'
import {
  
  Back} from '@element-plus/icons-vue'

import { ref } from 'vue'
import {
  ElPagination, 
  ElRow, ElTable, ElTableColumn,ElTableV2, ElCard} from 'element-plus'
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

const sec_officials =ref([])

const extractData = async (dataArray) => {
  // Loop through the array of data
  

  sec_officials.value=[]


  dataArray.forEach(data => {
    let official_details={}
    official_details.county = data.group_location.county
    official_details.settlement = data.settlement_name
    official_details.returning_officer = data.grp_certification.returning_officer
    official_details.date = data.date

    // Check if sec_officials array exists in each data object
    if (data.sec_officials && Array.isArray(data.sec_officials)) {
      // Loop through the sec_officials array within each data object
      data.sec_officials.forEach(official => {
       // console.log(official);  // Print or process each official's data

        official_details.category = official.category
        official_details.gender = official.gender
        official_details.name = official.name
        official_details.sec_position = official.sec_position
        official_details.national_id = official.national_id
        official_details.mobile = official.mobile
        
        sec_officials.value.push(official_details)

        


      });
    }
  });
};


const getSecData = async () => { 
  var formData = {}
  formData.project = "1"
  formData.form = "sec_officials"


  var userToken = localStorage.getItem('collectorToken');
  formData.token =userToken
  await getSubmissions(formData).then((response) => {
    console.log('Subissions', response)

      extractData(response.data)

   console.log(sec_officials.value) 

  })


 
}
 

console.log("projects--->", projects.value)
console.log("forms--->", forms.value)

// temp data 

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 1000)



await loginUserToCollector()

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

    <el-table-v2
    :columns="columns"
    :data="data"
    :width="700"
    :height="400"
    fixed
  />
  

    
  </el-card>
 
</template>
