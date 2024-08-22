<template>
  <div class="about-page">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="logo">
            <img src="@/assets/imgs/1logo.png" alt="Your Company Logo" />
          </div>
          <nav>
            <el-menu mode="horizontal" :default-active="activeIndex" @select="handleSelect">
              <el-menu-item index="1">Home</el-menu-item>
              <el-menu-item index="2">Dashboard</el-menu-item>
              <el-menu-item index="3">GRM</el-menu-item>
              <el-menu-item index="4">About</el-menu-item>
            </el-menu>
          </nav>
        </div>
      </el-header>
      <div class="form-container">

      <el-main>
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
      </el-main>
</div>
      <el-footer>
        <div class="footer-content">
          <p>&copy; 2024 Kenya Informal Settlements Improvement Project. All rights reserved.</p>
          <nav>
            <ul>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </nav>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
 import { ElMessage,ElMain,ElMenu,ElMenuItem,ElButton,ElCard,ElForm,ElFormItem,ElInput,ElDatePicker,ElFooter,ElContainer,ElDivider , ElSelect,ElOption,ElRow,ElCol,ElRadio,ElRadioGroup} from 'element-plus';

const activeIndex = ref('4');
const router = useRouter();

const handleSelect = (index: string) => {
  activeIndex.value = index;
  
  switch (index) {
    case '1':
      router.push('/landing'); // Navigate to Home
      break;
    case '2':
      router.push('/login'); // Navigate to Dashboard
      break;
    case '3':
      router.push('/grm'); // Navigate to GRM
      break;
    case '4':
      router.push('/about'); // Stay on About
      break;
    default:
      ElMessage.warning('Page not found.');
  }
};

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
  max-height: 600px; /* Set a maximum height for the scrollable area */
  overflow-y: auto; /* Enable vertical scrolling */
}

.three-column-form .el-form-item {
  margin-bottom: 20px; /* Adjust spacing between form items if needed */
}
</style>