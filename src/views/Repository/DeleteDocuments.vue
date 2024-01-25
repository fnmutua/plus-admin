<!-- eslint-disable prettier/prettier -->
<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import { useI18n } from '@/hooks/web/useI18n'
import { Table } from '@/components/Table'
import { getSettlementListByCounty } from '@/api/settlements'
import { getCountyListApi } from '@/api/counties'
import { ElButton, ElSelect, ElCheckTag, ElCheckbox  } from 'element-plus'
import { ElMessage, ElText, ElTable,ElTableColumn } from 'element-plus'
import {
  Position,
  TopRight,
  User,
  Plus,
  Download,
  Filter,
  MessageBox,
  Edit,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'

import { ref, reactive } from 'vue'
import {
  ElPagination, ElTooltip, ElOption, ElDivider, ElDialog, ElForm,ElSwitch,
  ElFormItem, ElInput, FormRules,   ElPopconfirm
} from 'element-plus'
 
import { useAppStoreWithOut } from '@/store/modules/app'
import { useCache } from '@/hooks/web/useCache'
import { deleteRawFiles,   getRawFiles } from '@/api/settlements'
import { getFile } from '@/api/summary'


const { wsCache } = useCache()
const appStore = useAppStoreWithOut()
const userInfo = wsCache.get(appStore.getUserInfo)


console.log("userInfo--->", userInfo)





 
const page = ref(1)
const pSize = ref(10)
const selCounties = []
const loading = ref(true)
const pageSize = ref(10)
const currentPage = ref(1)
const total = ref(0)
 const showAdminButtons = ref(false)

// flag for admin buttons
if (userInfo.roles.includes("admin" )  || userInfo.roles.includes("super_admin" )   ) {
  showAdminButtons.value = true
}


console.log("Show Buttons -->", showAdminButtons)



let tableDataList = ref([])
//// ------------------parameters -----------------------////
//const filters = ['intervention_type', 'intervention_phase', 'settlement_id']
var filters = []
var filterValues = []
 
//// ------------------parameters -----------------------////

const { t } = useI18n()
 
 

 
 

 

const onPageChange = async (selPage: any) => {
  console.log('on change change: selected counties ', selCounties)
  page.value = selPage
  getFilteredData(filters, filterValues)
}

const onPageSizeChange = async (size: any) => {
  pSize.value = size
  getFilteredData(filters, filterValues)
}

 
console.log('window.innerHeight1',window.innerHeight)

if (window.innerHeight < 600) {
        pageSize.value = 4; // Set page size to 5 for small screens
      } else if (window.innerHeight < 900) {
        pageSize.value = 5; // Set page size to 10 for medium screens
      } else {
        pageSize.value = 10; // Set page size to 15 for large screens
      }

 


const getFilteredData = async (selFilters, selfilterValues) => {
  const res = await getRawFiles({
    params: {
       page: page.value,
       perPage: pSize.value,
      sort: 'ASC'
    }
  }).then((response: { data: any }) => {
    console.log('Received response:', response)
 
    tableDataList.value =[]
    for (const name of  response.documents) {
      const newObj = {
        name: name,
        // You can add more properties here if needed
      };

      tableDataList.value.push(newObj);
    }
 
  total.value = response.pageInfo.totalItems

    loading.value = false
  
  })
}


 

const downloading = ref(false)
const downloadFile = async (data) => {
  downloading.value = true
  console.log(data)
  console.log(data.row.name)
 

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


  formData.responseType = 'blob'
  await getFile(formData)
    .then(response => {
      console.log(response)
      downloading.value = false
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      //link.setAttribute('download', data.row.name + data.row.format )
      const filename = data.row.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
        link.setAttribute('download', `${filename}.${data.row.format}`);
        console.log("file name has no extension")
      } else {
        link.setAttribute('download', filename);
        console.log("file name has   extension")

      }

      document.body.appendChild(link)
      link.click()
      downloading.value = false

    })
    .catch(error => {
      console.error('Error downloading file2:', error);
      ElMessage.error('Download failed.');

      downloading.value = false

    });

}

 
const viewDocument = async (data) => {
  downloading.value=true
 
  const formData = {};
 

  
  let fname 
  const filename = data.name;
      // Check if the filename has an extension
      if (!/\.\w+$/.test(filename)) {
         fname=filename + '.'+data.format
      } else {
        fname = filename

      }
      formData.filename =fname


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
        downloading.value=false
      });
    } else {
      console.error('Failed to open a new tab.');
      ElMessage.error('Failed to open the document.');
      downloading.value=false
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('Failed to load the document.');
    downloading.value=false
  }
};
 



const DeleteIndicator = async (data: TableSlotDefault) => {
  console.log('--xxx--->', data.row.name)
  let formData = {}
  formData.fileName = data.row.name
   
 
 await  deleteRawFiles(formData).then(response => {
    console.log(response)
    // remove the deleted object from array list 
    let index = tableDataList.value.indexOf(data.row);
    if (index !== -1) {
      tableDataList.value.splice(index, 1);
      total.value=total.value-1
      
    }

  })
    .catch(error => {
      console.log(error)
      ElMessage.error(error)
    });

  

 
}

 
 

  getFilteredData(filters, filterValues)

</script>

 
<template>
  <ContentWrap :title="t('Documents')" :message="t('Cleanup')">
    <el-divider border-style="dashed" content-position="left">Notice</el-divider>

    <p >
      This section allows you to review and cleanup any orphan documents within the system. It exposes all the files uploaded on the system and will include even files that are not associated with any entity. Use it to manage storage space. 
    </p>

 
     <el-table :data="tableDataList" style="width: 98%; margin-top: 20px;" border  select="true"  >
      <el-table-column type="index" label="#"  width="50" />
     <el-table-column prop="name" label="Name"   />
     <el-table-column fixed="right" label="Action" width="150">
      <template #default="data">
        <el-button type="warning" @click="downloadFile(data)" :icon="Download" circle />
        <el-button type="primary"  @click="viewDocument(data.row)"  :icon="TopRight" circle />

        <el-tooltip content="Delete" placement="top">
          <el-popconfirm
confirm-button-text="Yes" cancel-button-text="No"   width="350" :icon="InfoFilled" icon-color="#626AEF"
            title="Are you sure to delete this document?" @confirm="DeleteIndicator(data as TableSlotDefault)">
            <template #reference>
              <el-button v-if="showAdminButtons" type="danger" :icon="Delete" circle />
            </template>
          </el-popconfirm>
        </el-tooltip>
      </template>
    </el-table-column>

   </el-table>


   
    <ElPagination
layout="sizes,prev,pager,next, total" v-model:currentPage="currentPage" v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50, 200, 10000]" :total="total" :background="true" @size-change="onPageSizeChange"
      @current-change="onPageChange" class="mt-4" />
  </ContentWrap>

  

 

</template>

<style scoped>
.info-dialog-content {
  padding: 5px;
}

.info-dialog-section {
  margin-bottom: 5px;
}

.info-dialog-section h4 {
  font-size: 1.2em;
  margin-bottom: 10px;
}

.info-dialog-section p {
  line-height: 1.5;
}

.info-heading {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 10px;
}
</style>