<template>
  <div class="form-container">
    <BaseLayout>
      <el-main>
      <el-card>

    
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
                      </el-card>
                    </div>
                  </el-col>
                </el-row>
              </el-card>
            </el-form>
         
            
        <template #footer>
          <div class="steps-navigation" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;"  v-if="!statusResult">
            <div>
              <el-tooltip content="Help" placement="top">
                <el-button color="#626aef"   type="info" @click="showTour"  :icon="InfoFilled" plain />
              </el-tooltip> 

              <el-button  id="btn9"  v-if="active > 0" @click="prev" type="primary" :icon="ArrowLeft">Previous </el-button>
            </div>
            <div>
               <el-button   id="btn7"   v-if="active < 2" type="primary" @click="next" >
                  Next  <el-icon class="el-icon--right"><ArrowRight /></el-icon>
             </el-button>

              <el-button  id="btn2"  v-if="active === 2" type="primary" @click="submitForm" style="margin-left: 10px;">Submit</el-button>
              <el-button  id="btn8" @click="resetForm" style="margin-left: 10px;">Reset</el-button>
            </div>
          </div>
        </template>

      </el-card>
      </el-main>
    </BaseLayout>

    
  <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
      <el-tour-step
        v-for="(step, index) in filteredTourSteps"
        :key="index"
        :target="step.target"
        :title="step.title"
        :description="step.content"
      />
    </el-tour>


  </div>
</template>

<script setup lang="ts">
import {
  ElMain, ElButton, ElCard, ElForm, ElFormItem, ElInput, ElTour,ElTourStep,
  ElRow, ElCol, ElIcon,ElTooltip
} from 'element-plus';

import BaseLayout from './BaseLayout.vue';
import { getGrievanceStatus } from '@/api/grievance'
import {
  ArrowLeft,
  ArrowRight,
  InfoFilled,
} from '@element-plus/icons-vue'

import { onMounted,  ref } from 'vue'
import { useRoute } from 'vue-router'

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


 
onMounted( async () => {
  const id = route.params.id 
  statusForm.value.id=id
  console.log(id)
  checkStatus()
}) 


 
   

const checkStatus = async () => {

  console.log(statusForm.value)
 const res =  await getGrievanceStatus(statusForm.value)
 console.log(res.data)

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