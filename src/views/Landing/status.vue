<template>
  <div class="form-container">
    <BaseLayout>
      <el-main>
     
            <el-form :inline="false" :model="statusForm" class="status-form" label-position="top">
              <el-card shadow="hover">
                <el-row :gutter="10"  v-if="!statusResult">
                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">
                    <el-form-item label="Grievance Code">
                      <el-input v-model="statusForm.grievanceCode" placeholder="GRM-0000-0000" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">
                    <el-form-item label="Phone Number">
                      <el-input v-model="statusForm.phoneNumber" placeholder="0700 000 0000" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row  v-if="!statusResult">
                  <el-col :span="24">
                    <el-button type="primary" @click="checkStatus">Check Status</el-button>
                  </el-col>
                </el-row>
                <el-row :gutter="10">
                  <el-col :span="24">
                    <div class="status-result" v-if="statusResult">
                      <el-card style="margin-top: 10px">
                        <p style="margin-top: 10px"><strong>Ref:</strong> {{ statusResult.code }}</p>
                        <p style="margin-top: 10px"><strong>Date Reported:</strong> {{ statusResult.date_reported  }} ({{getDaysSince(statusResult.date_reported)}} days ago)</p>
                        <p style="margin-top: 10px"><strong>Status:</strong> {{ statusResult.status }}</p>

                        <p style="margin-top: 10px"><strong>Documents:</strong> </p>

                        <div >
                          <span v-for="(document, index) in files" :key="index">
                              <el-button 
                                type="primary"  plain
                                @click="downloadFile(document)" 
                                style="margin-right: 10px;"
                              >
                                <Icon icon="fa-solid:download" style="margin-right: 5px;" />
                                Download {{ document.name }} ( {{ document.name }}) <!-- Display the document name -->
                              </el-button>
                            </span>
                        </div>


                      </el-card>

                      
                    </div>
                  </el-col>
                </el-row>
              </el-card>
            </el-form>
         
      

   
      </el-main>
    </BaseLayout>

    
 


  </div>
</template>

<script setup lang="ts">
import {
  ElMain, ElButton, ElCard, ElForm, ElFormItem, ElInput, ElTour,ElTourStep,
  ElRow, ElCol, ElIcon,ElTooltip
} from 'element-plus';

import BaseLayout from './BaseLayout.vue';
import { getGrievanceStatus,getActionFile } from '@/api/grievance'

 
import {
  ArrowLeft,
  ArrowRight,
  InfoFilled,
} from '@element-plus/icons-vue'

import { onMounted,  ref } from 'vue'
import { useRoute } from 'vue-router'

import { useHead } from '@unhead/vue'

useHead({
  title: 'Grievance Status Check | KeSMIS Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'Check the status of your grievance with KeSMIS. Track your complaint progress and download related documents using your grievance code and phone number.' },
    { name: 'keywords', content: 'grievance status, complaint tracking, KeSMIS status check, KISIP grievance, complaint progress' },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph tags (for WhatsApp, Facebook, LinkedIn)
    { property: 'og:title', content: 'Grievance Status Check - KeSMIS Kenya Slum Management Information System' },
    { property: 'og:description', content: 'Check the status of your grievance with KeSMIS. Track your complaint progress and download related documents.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/status' },
    { property: 'og:image', content: 'https://kesmis.go.ke/logo.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Grievance Status Check - KeSMIS Kenya Slum Management Information System' },
    { name: 'twitter:description', content: 'Check the status of your grievance with KeSMIS. Track your complaint progress and download related documents.' },
    { name: 'twitter:image', content: 'https://kesmis.go.ke/twitter-card.jpg' },
    { name: 'twitter:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    
    // Additional meta tags for better SEO
    { name: 'theme-color', content: '#684035' },
    { name: 'msapplication-TileColor', content: '#684035' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'format-detection', content: 'telephone=no' }
  ]
})

const route = useRoute()





const active = ref(0);
 

  
const statusForm = ref({
  grievanceCode: '',
  id: '',
  phoneNumber: '',
});

const statusResult = ref(null);

 
 
function getDaysSince(dateString) {
  // Parse the given date
  const givenDate = new Date(dateString);
  
  // Get the current date
  const currentDate = new Date();
  
  // Calculate the difference in time (milliseconds)
  const timeDifference = currentDate - givenDate;
  
  // Convert time difference from milliseconds to days (1000 ms * 60 sec * 60 min * 24 hours)
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  
  return daysDifference;
}

const viewLoading =ref(false)

const downloadFile = async (data) => {
  console.log(data);
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
    const response = await getActionFile(formData);
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
 
onMounted( async () => {
  const id = route.params.id 
  statusForm.value.id=id
  console.log(id)
  checkStatus()
}) 


 
   
const files = ref([])
const checkStatus = async () => {

  console.log(statusForm.value)
  statusForm.value.associated_multiple_models=['grievance_document']

 const res =  await getGrievanceStatus(statusForm.value)
 console.log('res -->', res.data)

 files.value = res.data.grievance_documents
  // Handle checking status logic here
  statusResult.value = {
    code: res.data.code,
    date_reported: res.data.date_reported,
    status: 'The status of your grievance is : '+   res.data.status
  };
};





 

 
 
  

</script>




<style>
.form-container {
  max-height: 100vh;
  /* Set a maximum height for the scrollable area */
  overflow-y: auto;
  /* Enable vertical scrolling */
}

.three-column-form .el-form-item {
  margin-bottom: 20px;
  /* Adjust spacing between form items if needed */
}

.grm-header {
  padding: 100px 20px;
  text-align: center;
  color: #030303;
}
</style>

<style>
.demo-form-inline .el-input {
  --el-input-width: 220px;
}

.demo-form-inline .el-select {
  --el-select-width: 220px;
}

.demo-tabs {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .demo-tabs {
    flex-direction: row;
  }
}



</style>