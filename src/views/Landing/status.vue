<template>
  <BaseLayout>
    <div class="status-container">
      <el-card class="status-card">
        <el-form :inline="false" :model="statusForm" class="status-form" label-position="top">
          <div v-if="!statusResult">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8">
                <el-form-item label="Grievance Code">
                  <el-input v-model="statusForm.grievanceCode" placeholder="GRM-0000-0000" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="24" :md="12" :lg="8" :xl="8">
                <el-form-item label="Phone Number">
                  <el-input v-model="statusForm.phoneNumber" placeholder="254700000000" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="24" :md="24" :lg="8" :xl="8">
                <el-form-item label="&nbsp;">
                  <el-button type="primary" @click="checkStatus" style="width: 100%;">Check Status</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="status-result" v-if="statusResult">
            <el-card class="result-card">
              <h2 class="result-title">Grievance Status</h2>
              <div class="result-content">
                <div class="result-item">
                  <span class="result-label">Reference Code:</span>
                  <span class="result-value">{{ statusResult.code }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Date Reported:</span>
                  <span class="result-value">{{ statusResult.date_reported }} ({{ getDaysSince(statusResult.date_reported) }} days ago)</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Status:</span>
                  <span class="result-value">{{ statusResult.status }}</span>
                </div>

                <div class="documents-section" v-if="files && files.length > 0">
                  <h3 class="documents-title">Supporting Documents</h3>
                  <div class="documents-list">
                    <el-button 
                      v-for="(document, index) in files" 
                      :key="index"
                      type="primary" 
                      plain
                      @click="downloadFile(document)" 
                      class="download-btn"
                    >
                      <Icon icon="mdi:download" class="download-icon" />
                      Download {{ document.name }}
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </el-form>
      </el-card>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import {
  ElButton, ElCard, ElForm, ElFormItem, ElInput,
  ElRow, ElCol, ElMessage
} from 'element-plus';

import BaseLayout from './BaseLayout.vue';
import { getGrievanceStatus, getActionFile } from '@/api/grievance';
import { Icon } from '@iconify/vue';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

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
    { name: 'theme-color', content: '#00DC82' },
    { name: 'msapplication-TileColor', content: '#00DC82' },
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




<style scoped>
.status-container {
  padding: 4rem 2rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background 0.3s ease, color 0.3s ease;
  min-height: 100vh;
}

.status-card {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  background: var(--bg-primary);
}

.status-card :deep(.el-card__body) {
  padding: 2.5rem;
}

/* Form Items */
:deep(.el-form-item) {
  margin-bottom: 1.5rem;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9375rem;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
  line-height: 1.5;
}

/* Input Styling */
:deep(.el-input__wrapper) {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: none;
  background: var(--bg-primary);
}

:deep(.el-input__wrapper:hover) {
  border-color: #00DC82;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

:deep(.el-input__inner) {
  color: var(--text-primary);
  font-size: 0.9375rem;
  line-height: 1.5;
}

/* Button Styling */
:deep(.el-button) {
  padding: 0.875rem 1.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  letter-spacing: -0.01em;
  border: none;
}

:deep(.el-button--primary) {
  background: #00DC82 !important;
  border: 1px solid #00DC82 !important;
  color: white !important;
}

:deep(.el-button--primary:hover) {
  background: #00B86B !important;
  border-color: #00B86B !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 220, 130, 0.3);
}

:deep(.el-button--primary.is-plain) {
  background: transparent !important;
  border: 1px solid #00DC82 !important;
  color: #00DC82 !important;
}

:deep(.el-button--primary.is-plain:hover) {
  background: rgba(0, 220, 130, 0.1) !important;
  border-color: #00B86B !important;
  color: #00B86B !important;
}

/* Status Result */
.status-result {
  margin-top: 2rem;
  animation: fadeIn 0.3s ease-out;
}

.result-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: var(--bg-primary);
}

.result-card :deep(.el-card__body) {
  padding: 2rem;
}

.result-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.result-item:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.result-label {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.result-value {
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.6;
  font-weight: 500;
}

.documents-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
}

.documents-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.documents-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
}

.download-icon {
  font-size: 1rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Card Styling */
:deep(.el-card) {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: var(--bg-primary);
  overflow: hidden;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .status-container {
    padding: 2rem 1rem;
  }
  
  .status-card :deep(.el-card__body) {
    padding: 1.5rem;
  }

  .result-title {
    font-size: 1.5rem;
  }

  .result-card :deep(.el-card__body) {
    padding: 1.5rem;
  }

  .documents-list {
    flex-direction: column;
  }

  .download-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .status-container {
    padding: 1.5rem 1rem;
  }
  
  .status-card :deep(.el-card__body) {
    padding: 1rem;
  }

  .result-title {
    font-size: 1.25rem;
  }

  .result-card :deep(.el-card__body) {
    padding: 1.25rem;
  }

  .result-item {
    padding-bottom: 1rem;
  }
}

/* Dark Mode Support */
.dark-mode .status-card {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-card) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-input__wrapper) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-input__wrapper:hover),
.dark-mode :deep(.el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

.dark-mode .result-item {
  border-color: var(--border-color);
}

.dark-mode .documents-section {
  border-color: var(--border-color);
}
</style>