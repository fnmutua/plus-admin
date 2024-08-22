<template>
  <div class="grm-form">
    <el-form :model="grmForm" label-width="150px">
      <el-card>
        <h2>GRIEVANCE REDRESS FORM</h2>
        
        <el-form-item label="Settlement">
          <el-input v-model="grmForm.settlement" placeholder="Enter settlement"/>
        </el-form-item>

        <el-form-item label="Project Phone Number">
          <el-input v-model="grmForm.projectPhoneNumber" placeholder="Enter phone number"/>
        </el-form-item>

        <el-form-item label="Complain No.">
          <el-input v-model="grmForm.complainNo" placeholder="Enter complaint number"/>
        </el-form-item>

        <el-form-item label="Preferred Language">
          <el-radio-group v-model="grmForm.preferredLanguage">
            <el-radio label="Kiswahili">Kiswahili</el-radio>
            <el-radio label="English">English</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider/>

        <h3>1. Complainant’s personal details</h3>

        <el-form-item label="Name">
          <el-input v-model="grmForm.name" placeholder="Enter name"/>
        </el-form-item>

        <el-form-item label="ID No.">
          <el-input v-model="grmForm.idNo" placeholder="Enter ID number"/>
        </el-form-item>

        <el-form-item label="Telephone Number">
          <el-input v-model="grmForm.telephoneNumber" placeholder="Enter telephone number"/>
        </el-form-item>

        <el-form-item label="Address (postal/email)">
          <el-input v-model="grmForm.address" placeholder="Enter address"/>
        </el-form-item>

        <el-form-item label="Settlement/Location">
          <el-input v-model="grmForm.settlementLocation" placeholder="Enter settlement/location"/>
        </el-form-item>

        <el-divider/>

        <h3>2. Nature of your complaint</h3>

        <el-form-item label="Complaint Category">
          <el-select v-model="grmForm.complaintCategory" placeholder="Select category">
            <el-option label="Land" value="land"/>
            <el-option label="Labour Related" value="labour"/>
            <el-option label="Infrastructure" value="infrastructure"/>
            <el-option label="Others" value="others"/>
          </el-select>
        </el-form-item>

        <el-form-item label="Complaint Description">
          <el-input v-model="grmForm.complaintDescription" type="textarea" rows="4" placeholder="Describe your complaint"/>
        </el-form-item>

        <el-divider/>

        <h3>3. What is your plea/request?</h3>

        <el-form-item label="Plea/Request">
          <el-input v-model="grmForm.pleaRequest" type="textarea" rows="4" placeholder="Enter your plea/request"/>
        </el-form-item>

        <el-divider/>

        <el-form-item label="Signature">
          <el-input v-model="grmForm.signature" placeholder="Enter your signature"/>
        </el-form-item>

        <el-form-item label="Date">
          <el-date-picker v-model="grmForm.date" placeholder="Select date"/>
        </el-form-item>

        <el-divider/>

        <h3>4. Name of Witness if any</h3>

        <el-form-item label="Witness Name">
          <el-input v-model="grmForm.witnessName" placeholder="Enter witness name"/>
        </el-form-item>

        <el-form-item label="Witness Signature">
          <el-input v-model="grmForm.witnessSignature" placeholder="Enter witness signature"/>
        </el-form-item>

        <el-form-item label="Witness Statement">
          <el-input v-model="grmForm.witnessStatement" type="textarea" rows="4" placeholder="Enter witness statement"/>
        </el-form-item>

        <el-divider/>

        <h3>5. Name of the recipient</h3>

        <el-form-item label="Recipient Name">
          <el-input v-model="grmForm.recipientName" placeholder="Enter recipient name"/>
        </el-form-item>

        <el-form-item label="Recipient Signature">
          <el-input v-model="grmForm.recipientSignature" placeholder="Enter recipient signature"/>
        </el-form-item>

        <el-form-item label="Date">
          <el-date-picker v-model="grmForm.recipientDate" placeholder="Select date"/>
        </el-form-item>

        <el-divider/>

        <h3>6. Action Taken</h3>

        <el-form-item label="Action Taken">
          <el-input v-model="grmForm.actionTaken" type="textarea" rows="4" placeholder="Describe the action taken"/>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm">Submit</el-button>
          <el-button @click="resetForm">Reset</el-button>
        </el-form-item>
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage,ElMain,ElMenu,ElMenuItem,ElButton,ElCard,ElForm,ElFormItem,ElInput,ElInputNumber,ElDivider } from 'element-plus';

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
</script>

<style scoped>
.grm-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2, h3 {
  margin-bottom: 10px;
}

.el-divider {
  margin: 20px 0;
}
</style>
