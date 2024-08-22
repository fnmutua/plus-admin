<template>
  <div class="form-container">
    <BaseLayout>



      <el-main>

        <el-tabs v-model="activeName" class="demo-tabs" >
          <el-tab-pane label="File a Grievance" name="file">

            <el-form :inline="false" :model="grmForm" class="demo-form-inline" label-position="top">
              <el-card shadow="hover">
                <el-row :gutter="10">
                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">

                    <el-form-item label="Name">
                      <el-input v-model="grmForm.name" placeholder="Enter name" />
                    </el-form-item>

                    <el-form-item label="ID No.">
                      <el-input v-model="grmForm.idNo" placeholder="Enter ID number" />
                    </el-form-item>


                    <el-form-item label="Phone">
                      <el-input v-model="grmForm.projectPhoneNumber" placeholder="Enter phone number" />
                    </el-form-item>


                    <el-form-item label="Email">
                      <el-input v-model="grmForm.address" placeholder="Enter address" />
                    </el-form-item>



                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">

                    <el-form-item label="County">
                      <el-select v-model="grmForm.complaintCategory" placeholder="Select County">
                        <el-option label="Land" value="land" />
                        <el-option label="Labour Related" value="labour" />
                        <el-option label="Infrastructure" value="infrastructure" />
                        <el-option label="Others" value="others" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="Subcounty">
                      <el-select v-model="grmForm.complaintCategory" placeholder="Select Subcounty">
                        <el-option label="Land" value="land" />
                        <el-option label="Labour Related" value="labour" />
                        <el-option label="Infrastructure" value="infrastructure" />
                        <el-option label="Others" value="others" />
                      </el-select>
                    </el-form-item>


                    <el-form-item label="Settlement">
                      <el-select v-model="grmForm.complaintCategory" placeholder="Select Settlement">
                        <el-option label="Land" value="land" />
                        <el-option label="Labour Related" value="labour" />
                        <el-option label="Infrastructure" value="infrastructure" />
                        <el-option label="Others" value="others" />
                      </el-select>
                    </el-form-item>

              
                  </el-col>

                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">
                    <el-form-item label="Complaint Category">
                      <el-select v-model="grmForm.complaintCategory" placeholder="Select category">
                        <el-option label="Land" value="land" />
                        <el-option label="Labour Related" value="labour" />
                        <el-option label="Infrastructure" value="infrastructure" />
                        <el-option label="Others" value="others" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="Complaint Description">
                      <el-input
v-model="grmForm.complaintDescription" type="textarea" rows="2"
                        placeholder="Describe your complaint" />
                    </el-form-item>
                    <el-form-item label="Plea/Request">
                      <el-input
v-model="grmForm.pleaRequest" type="textarea" rows="2"
                        placeholder="Enter your plea/request" />
                    </el-form-item>
                     
                  </el-col>

                  <el-col :xs="24" :sm="24" :md="12" :lg="6" :xl="6">
                    
                    <el-form-item label="Witness Name" style="margin-right: 25px;">
                        <el-input v-model="grmForm.witnessName" placeholder="Enter witness name" />
                      </el-form-item>

                      <el-form-item label="Witness Phone" style="margin-right: 5px;">
                        <el-input v-model="grmForm.witnessSignature" placeholder="Enter witness phone" />
                      </el-form-item>

                      <el-form-item label="Witness Statement">
                      <el-input
v-model="grmForm.witnessStatement" type="textarea"  
                        placeholder="Enter witness statement" />
                    </el-form-item>
                  </el-col>

                </el-row>

  
                <el-upload
                  v-model:file-list="fileList"
                  class="upload-demo"
                  action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                  multiple
                  :on-preview="handlePreview"
                  :on-remove="handleRemove"
                  :before-remove="beforeRemove"
                  :limit="3"
                  :on-exceed="handleExceed"
                >
                  <el-button type="primary">Upload Supporting Documentation</el-button>
                  <template #tip>
                    <div class="el-upload__tip">
                      jpg/png files with a size less than 500KB.
                    </div>
                  </template>
                </el-upload>



                <template #footer>
                  <el-button type="primary" @click="submitForm">Submit</el-button>
                  <el-button @click="resetForm">Reset</el-button>

                </template>
              </el-card>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="Check Status of a Grievance" name="status">
            <el-form :inline="false" :model="statusForm" class="status-form" label-position="top">
              <el-card shadow="hover">
                <el-row :gutter="10">
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
                <el-row>
                  <el-col :span="24">
                    <el-button type="primary" @click="checkStatus">Check Status</el-button>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="24">
                    <div class="status-result" v-if="statusResult">
                      <el-card style="margin-top: 10px">
                        <p><strong>Status:</strong> {{ statusResult.status }}</p>
                        <p><strong>Details:</strong> {{ statusResult.details }}</p>
                      </el-card>
                    </div>
                  </el-col>
                </el-row>
              </el-card>
            </el-form>

          </el-tab-pane>

        </el-tabs>


      </el-main>


    </BaseLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  ElMain, ElButton, ElCard, ElForm, ElFormItem, ElInput, ElDivider,ElUpload,
  ElTabPane, ElTabs, ElSelect, ElOption, ElRow, ElCol
} from 'element-plus';
import BaseLayout from './BaseLayout.vue';
const activeName = ref('file')
const labelPosition = ref('left');


const grmForm = ref({
  settlement: '',
  projectPhoneNumber: '',
  complainNo: '',
  preferredLanguage: 'Kiswahili',
  name: '',
  idNo: '',
  telephoneNumber: '',
  address: '',
  settlementLocation: '',
  complaintCategory: '',
  complaintDescription: '',
  pleaRequest: '',
  signature: '',
  date: '',
  witnessName: '',
  witnessSignature: '',
  witnessStatement: '',
  recipientName: '',
  recipientSignature: '',
  recipientDate: '',
  actionTaken: '',
});

const submitForm = () => {
  console.log('Form submitted:', grmForm.value);
};

const resetForm = () => {
  grmForm.value = {
    settlement: '',
    projectPhoneNumber: '',
    complainNo: '',
    preferredLanguage: 'Kiswahili',
    name: '',
    idNo: '',
    telephoneNumber: '',
    address: '',
    settlementLocation: '',
    complaintCategory: '',
    complaintDescription: '',
    pleaRequest: '',
    signature: '',
    date: '',
    witnessName: '',
    witnessSignature: '',
    witnessStatement: '',
    recipientName: '',
    recipientSignature: '',
    recipientDate: '',
    actionTaken: '',
  };
};

const updateLabelPosition = () => {
  labelPosition.value = window.innerWidth < 768 ? 'top' : 'left';
};

onMounted(() => {
  window.addEventListener('resize', updateLabelPosition);
  updateLabelPosition(); // Initial check
});




const statusForm = ref({
  grievanceCode: '',
  phoneNumber: '',
});

const statusResult = ref<{ status: string; details: string } | null>(null);

const checkStatus = () => {
  // Mock data for example purposes
  statusResult.value = {
    status: 'Under Review',
    details: 'Your grievance is currently being reviewed by our team.',
  };
};

</script>



<style>
.form-container {
  max-height: 768px;
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
</style>