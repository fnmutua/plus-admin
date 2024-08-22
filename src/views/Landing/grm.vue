<template>

  <BaseLayout>

    <div class="form-container">

      <el-main>
        <el-form  :inline="true"  :model="grmForm"  class="demo-form-inline"  :label-position="labelPosition" >
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>Your voice matters. Please provide the details of your concern below, and our team will work diligently to address it.</span>
              </div>
            </template>

            <el-row>
              <el-col :span="12" :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
                
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
              <el-col :span="12" :xs="24" :sm="24" :md="24" :lg="12" :xl="12">

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
            </el-row>

            <el-divider content-position="center">Grievance Details</el-divider>


            <el-row>
              <el-col :span="12" :xs="24" :sm="24" :md="24" :lg="12" :xl="12">
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
              <el-col :span="12">

                <el-form-item label="Witness Name">
                  <el-input v-model="grmForm.witnessName" placeholder="Enter witness name" />
                </el-form-item>

                <el-form-item label="Witness Phone">
                  <el-input v-model="grmForm.witnessSignature" placeholder="Enter witness signature" />
                </el-form-item>

                <el-form-item label="Witness Statement">
                  <el-input
v-model="grmForm.witnessStatement" type="textarea" rows="2"
                    placeholder="Enter witness statement" />
                </el-form-item>


              </el-col>

            </el-row>
 
 
 

            <template #footer>
              <el-button type="primary" @click="submitForm">Submit</el-button>
              <el-button @click="resetForm">Reset</el-button>

            </template>
          </el-card>
        </el-form>
      </el-main>
    </div>

  </BaseLayout>

</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMain, ElButton, ElCard, ElForm, ElFormItem, ElInput, ElDivider, ElSelect, ElOption, ElRow, ElCol } from 'element-plus';
import BaseLayout from './BaseLayout.vue';

 

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



const labelPosition = ref('left');


</script>

<style scoped>
.about-page {
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.header-content,
.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.logo img {
  height: 50px;
}

.about-content {
  padding: 100px 20px;
  text-align: center;
  color: #030303;
}

.about-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: bold;
  color: #070707;
}

.about-content p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #696969;
}

.footer-content {
  border-top: 1px solid #e5e5e5;
  text-align: center;
  padding: 20px;
  color: #666;
}

.footer-content ul {
  display: flex;
  justify-content: center;
  list-style-type: none;
  padding: 0;
}

.footer-content ul li {
  margin-left: 1.5rem;
}

.footer-content ul li a {
  color: #666;
  text-decoration: none;
}

.footer-content ul li a:hover {
  color: #409eff;
}
</style>

<style>
.form-container {
  max-height: 600px;
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