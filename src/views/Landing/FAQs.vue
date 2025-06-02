<template>
    <div class="form-container" :class="{ 'dark-mode': isDarkMode }">
  <BaseLayout>



      <el-main>
      
  <el-tabs tab-position="left" style="height: 700px;  " class="demo-tabs">
    <el-tab-pane label="Introduction"> 
       Advanced Geospatial Solutions operates the Kenya Slum information System( the"System") and the SlumMapper (the "App"). This page informs you of our policies regarding the collection, use, and disclosure of personal information we receive from users of the App.
    </el-tab-pane>

    <el-tab-pane label=" Personal Information">We may ask you to provide certain personally identifiable information that
      can be used to contact or identify you. Personally identifiable information may include, but is not limited to, your name, email, and phone number ("Personal Information")</el-tab-pane>

    <el-tab-pane label="Usage Data">
      <p>We may also collect information that your mobile device sends whenever you use our App ("Usage Data").This Usage Data may include information such as your device's Internet Protocol ("IP") address, device  type, operating system version, the pages of our App that you visit, the time and date of your visit, the  time spent on those pages, and other statistics. We do not plan to access IMEI or any other device identifiable information.</p>
    </el-tab-pane>

    <el-tab-pane label="Use of Information">We may use your Personal Information and Usage Data to provide and improve the App. By using the App, you agree to the collection and use of information in accordance with this policy. We may collect and analyze  Usage Data to monitor the usage of the App, troubleshoot technical issues, and improve the overall user experience.</el-tab-pane>

    <el-tab-pane label="Disclosure of Information">We may only disclose your Personal Information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency).</el-tab-pane>

    <el-tab-pane label="Security">The security of your Personal Information is important to us. We strive to implement and maintain reasonable security measures to protect against unauthorized access, alteration, disclosure, or  destruction of your Personal Information.</el-tab-pane>
   
    <el-tab-pane label="Links to Other Websites">Our App may contain links to other websites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.</el-tab-pane>

    <el-tab-pane label="Children's Privacy">Our App does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally  identifiable information from Children. If you are a parent or guardian and you are aware that your Child has provided us with Personal Information, please contact us. If we become aware that we have collected  Personal Information from a Child without verification of parental consent, we will take steps to remove that information from our servers.</el-tab-pane>
 
 
    <el-tab-pane label="Right to Erasure"> <p>The user reserves the right to have their data deleted from the system at any given time. Should a user desire so, write us an email requesting for data deletion through  <a  href="mailto:info@ags.co.ke">info@ags.co.ke</a></p>
</el-tab-pane>
 
    <el-tab-pane label="Changes to This Privacy Policy"><p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p></el-tab-pane>
    <el-tab-pane label="Contact Us"> <p>If you have any questions about this Privacy Policy, please contact us at <a
      href="mailto:info@ags.co.ke">info@ags.co.ke</a>.</p></el-tab-pane>
 
      </el-tabs>
      </el-main>
   

  </BaseLayout>
</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMain, ElButton,  ElTabPane,ElTabs } from 'element-plus';
import BaseLayout from './BaseLayout.vue';

const isDarkMode = ref(false);

// Function to check system dark mode preference
const checkDarkMode = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  isDarkMode.value = savedTheme ? savedTheme === 'dark' : prefersDark;
};

// Watch for system theme changes
onMounted(() => {
  checkDarkMode();
  
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDarkMode.value = e.matches;
    }
  });
});

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

:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #2c3e50;
  --text-secondary: #606266;
  --border-color: #dcdfe6;
  --accent-color: #409eff;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --card-bg: #ffffff;
  --hover-bg: #f5f7fa;
  --disabled-bg: #f5f7fa;
  --disabled-text: #c0c4cc;
}

.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2c2c2c;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --border-color: #3a3a3a;
  --accent-color: #4a9eff;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  --card-bg: #2c2c2c;
  --hover-bg: #363636;
  --disabled-bg: #2c2c2c;
  --disabled-text: #666666;
}

.faqs-container {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.3s ease;
  padding: 2rem;
}

.faqs-content {
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  padding: 2rem;
  margin: 0 auto;
  max-width: 1200px;
}

.faq-item {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: var(--accent-color);
  box-shadow: var(--card-shadow);
}

.faq-question {
  color: var(--text-primary);
  font-weight: 600;
  padding: 1rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-answer {
  color: var(--text-secondary);
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

:deep(.el-collapse-item__header) {
  background-color: var(--card-bg);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-collapse-item__content) {
  background-color: var(--card-bg);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-collapse-item__header:hover) {
  background-color: var(--hover-bg);
}

@media (max-width: 768px) {
  .faqs-container {
    padding: 1rem;
  }
  
  .faqs-content {
    padding: 1rem;
  }
}

</style>