<template>
  <div class="form-container">
    <BaseLayout>
      <el-main>
      <el-card>

   
        <el-tabs v-model="activeName"  :tab-position="tabPosition">
          
          <el-tab-pane label="File a Grievance" name="file">
            <el-steps :active="active" finish-status="success">
              <el-step title="Personal Details" />
              <el-step title="Grievance Details" />
              <el-step title="Review & Submit" />
            </el-steps>

            <el-form :model="grmForm" class="demo-form-inline" label-position="top" :rules="currentStepRules" ref="dynamicFormRef">
              <el-card shadow="hover">
                <el-row v-if="active === 0" :gutter="10">
                  <!-- Step 1: Personal Details -->
                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item  id="btn1" label="Name" prop="name" >
                      <el-input v-model="grmForm.name" placeholder="Enter name"  style="width:90%"/>
                    </el-form-item>

                    <el-form-item  id="btn2"  label="Gender" prop="gender">
                      <el-select v-model="grmForm.gender" placeholder="Select" style="width:90%">
                        <el-option label="Female" value="female" />
                        <el-option label="Male" value="male" />
                        <el-option label="Unspecified" value="unspecified" />
                      </el-select>
                    </el-form-item>

                    <el-form-item  id="btn3"  label="Age" prop="age">
                      <el-select v-model="grmForm.age" placeholder="Select" style="width:90%">
                        <el-option v-for="item in ageRanges" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-form-item>

                     
                  </el-col>


                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item  id="btn4"   label="National ID" prop="national_id" >
                      <el-input v-model="grmForm.national_id" placeholder="Enter ID number" style="width:90%" />
                    </el-form-item>

                    <el-form-item  id="btn5"  label="Phone" prop="phone">
                      <el-input v-model="grmForm.phone" placeholder="Enter phone number" style="width:90%" />
                    </el-form-item>

                    <el-form-item   id="btn6"  label="Email" prop="email">
                      <el-input v-model="grmForm.email" placeholder="Enter Email" style="width:90%" />
                    </el-form-item>
                  </el-col >


                </el-row>



                <el-row v-if="active === 1" :gutter="10">
                  <!-- Step 2: Grievance Details -->
                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item  id="btn10"  label="County" prop="county_id">
                      <el-select v-model="grmForm.county_id" placeholder="County" @change="getSettlementByCounty" style="width:90%">
                        <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-form-item>

                    <el-form-item  id="btn11"  label="Settlement" prop="settlement_id">
                      <el-select v-model="grmForm.settlement_id" placeholder="Settlement" @change="handleSelectSettlement" style="width:90%">
                        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-form-item>

                    <el-form-item   id="btn12" label="Address" prop="address">
                      <el-input v-model="grmForm.address" placeholder="Enter address"  style="width:90%"/>
                    </el-form-item>

                   

                    <el-checkbox   id="btn13"  v-model="grmForm.isgbv" label="Is this complaint related to Gender-Based Violence?" size="large" style="margin-bottom:5px" />

                   
                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">

                  <el-form-item  id="btn14"  label="Nature of Complaint" prop="nature">
                      <el-select v-model="grmForm.nature" placeholder="Select category" style="width:90%">
                        <el-option label="Land" value="land" />
                        <el-option label="Labour Related" value="labour" />
                        <el-option label="Infrastructure" value="infrastructure" />
                        <el-option label="Others" value="others" />
                      </el-select>
                    </el-form-item>
               
                    <el-form-item   id="btn15" label="Complaint Description" prop="description">
                      <el-input v-model="grmForm.description" type="textarea" rows="2" placeholder="Describe your complaint" style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn16"  label="Plea/Request" prop="plea">
                      <el-input v-model="grmForm.plea" type="textarea" rows="2" placeholder="Enter your plea/request" style="width:90%" />
                    </el-form-item>
                  </el-col>


                </el-row>

                <el-row v-if="active === 2" :gutter="10">
                  <!-- Step 3: Review & Submit -->
                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                    <el-form-item  id="btn17"  label="Witness Name" prop="witness">
                      <el-input v-model="grmForm.witness" placeholder="Enter witness name" style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn18"   label="Witness Phone" prop="witness_phone">
                      <el-input v-model="grmForm.witness_phone" placeholder="Enter witness phone" style="width:90%" />
                    </el-form-item>

                    <el-form-item id="btn19"  label="Witness Statement" prop="witness_statement">
                      <el-input v-model="grmForm.witness_statement" type="textarea" placeholder="Enter witness statement"  style="width:90%"/>
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">

                    <el-upload
                       id="btn20" 
                      class="upload-demo"
                      action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
                      multiple
                      :on-preview="handlePreview"
                      :on-remove="handleRemove"
                      :before-remove="beforeRemove"
                      :limit="3"
                      v-model:file-list="fileList"
                      :auto-upload="false"
                       :on-exceed="handleExceed"
                    >
                      <el-button type="primary">Upload Supporting Documentation</el-button>
                      <template #tip>
                        <div class="el-upload__tip">pdf/jpg/png files with a size less than 500KB.</div>
                      </template>
                    </el-upload>


                   

   
                  </el-col>
                 
                </el-row>
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
                <el-row :gutter="10">
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
        <template #footer>
          <div class="steps-navigation" style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
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
import { ref ,onMounted,onBeforeUnmount, computed} from 'vue';
import {
  ElMain, ElButton, ElCard, ElForm, ElFormItem, ElInput, ElUpload, ElCheckbox,ElTour,ElTourStep,
  ElTabPane, ElTabs, ElSelect, ElOption, ElRow, ElCol, ElMessage, ElStep, ElSteps,ElIcon,ElTooltip
} from 'element-plus';

import BaseLayout from './BaseLayout.vue';
import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { uploadGrievanceDocuments,generateGrievance,logGrievanceAction } from '@/api/grievance'
import {
  ArrowLeft,
  ArrowRight,
  Delete,
  InfoFilled,
  Edit,
  Share,
} from '@element-plus/icons-vue'
import type { UploadProps, UploadUserFile } from 'element-plus'
import { uuid } from 'vue-uuid'
import { useRouter } from 'vue-router';


const activeName = ref('file');
const active = ref(0);

const grmForm = ref({
  name: '',
  gender: '',
  age: '',
  national_id: '',
  phone: '',
  email: '',
  county_id: '',
  settlement_id: '',
  address: '',
  nature: '',
  isgbv: false,
  description: '',
  plea: '',
  witness: '',
  witness_phone: '',
  witness_statement: '',
});

 

const fileList = ref<UploadUserFile[]>([
 
])


const validationRules = ({
  // Validation rules for each step
  step1: {
    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
      gender: [{ required: true, message: 'Gender is required', trigger: 'change' }],
      age: [{ required: true, message: 'Age is required', trigger: 'change' }],
      national_id: [{ required: true, message: 'National ID is required', trigger: 'blur' }],
      phone: [{ required: true, message: 'Phone number is required', trigger: 'blur' }],
      email: [{ required: true, message: 'Email is required', trigger: 'blur' }],
  },

  step2: {
  county_id: [{ required: true, message: 'County is required', trigger: 'change' }],
  settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'change' }],
  address: [{ required: true, message: 'Address is required', trigger: 'blur' }],
  nature: [{ required: true, message: 'Nature of complaint is required', trigger: 'change' }],
  description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
  plea: [{ required: true, message: 'Plea/request is required', trigger: 'blur' }],
  },
 
 
   
});


const currentStepRules = computed(() => {
  const stepRulesKey = `step${active.value + 1}`;
  console.log('stepRulesKey',stepRulesKey)
  return validationRules[stepRulesKey];
});

console.log('currentStepRules',currentStepRules)

const statusForm = ref({
  grievanceCode: '',
  phoneNumber: '',
});

const statusResult = ref(null);

 
const ageRanges = [
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: '46-55', label: '46-55' },
  { value: '56-65', label: '56-65' },
  { value: '65+', label: '65+' },
];

const countiesOptions = ref([])
const settlementOptions = ref([])

const getCounties = async () => {

  const formData = {}
  formData.model = 'county'
  await getCountyAuth({}).then((response) => {
    console.log('List of counties:', response)
    //tableDataList.value = response.data
    var cnty = response.data



    cnty.forEach(function (arrayItem) {
      var countyOpt = {}
      countyOpt.value = arrayItem.id
      countyOpt.label = arrayItem.name
      //  console.log(countyOpt)
      countiesOptions.value.push(countyOpt)
    })


    // sort by value
    countiesOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

getCounties()


 
const getSettlementByCounty = async (selectCounty) => {
  // nullify selection after change 
  settlementOptions.value = []
  grmForm.value.settlement_id = null


  console.log("County:", selectCounty)

  const formData = {}
  formData.model = 'settlement'
  await getSettlementByCountyAuth({ county_id: selectCounty }).then((response) => {
    console.log('List of settlement:', response)
    //tableDataList.value = response.data
    var opt = response.data



    opt.forEach(function (arrayItem) {
      var item = {}
      item.value = arrayItem.id
      item.label = arrayItem.name
      item.county_id = arrayItem.county_id
      item.subcounty_id = arrayItem.subcounty_id
      item.ward_id = arrayItem.ward_id
      
      settlementOptions.value.push(item)
    })


    // sort by value
    settlementOptions.value.sort(function (a, b) {
      return a.value - b.value;
    });

  })
}

const handleSelectSettlement = async (settlementId) => { 
  console.log(settlementId)
  const filteredOptions = settlementOptions.value.filter(option => option.value === settlementId);
    console.log(filteredOptions[0].subcounty_id)
    grmForm.value.subcounty_id=filteredOptions[0].subcounty_id
    grmForm.value.ward_id=filteredOptions[0].ward_id

}

 

const next = async () => {

  console.log(grmForm.value)
     const formInstance = dynamicFormRef
    formInstance.value.validate((valid: boolean) => {
      if (valid) {
        console.log(formInstance)
        active.value++;
      }
    });
  
  
};


const prev = () => {
  active.value--;
};

const dynamicFormRef = ref<FormInstance>()




const router = useRouter();

const uploadFiles = async (grievance_id) => {
  console.log('grievance_id',grievance_id)

 
  const formData = new FormData();

// Assuming `fileList` is an array of file objects and `grievance_id` is defined
for (var i = 0; i < fileList.value.length; i++) {
  console.log('------>file', fileList.value[i]); 
  formData.append('files', fileList.value[i].raw);
  formData.append('format', fileList.value[i].name.split('.').pop());
  formData.append('grievance_id', grievance_id);
  formData.append('protected_file', true);
  formData.append('size', (fileList.value[i].raw.size / 1024 / 1024).toFixed(2));
  formData.append('code', uuid.v4());
}

// Printing out the contents of formData
for (let [key, value] of formData.entries()) {
  console.log(`${key}: ${value}`);
}

const res =  await uploadGrievanceDocuments(formData)

console.log("Docuemnts Uploaded", res)
 



}


const logAction = async (grievance) => {
  console.log('Log---->grievance',grievance)

 
  const formData ={};

  formData.grievance_id=grievance.id
  formData.action_type='Created'
  formData.action_by=null
  formData.date_actioned=grievance.date_reported
  formData.prev_status=grievance.status
  formData.new_status=grievance.status
  
  

  const res =  await logGrievanceAction(formData)

console.log("Log Successful", res)
router.push('/landing');

}
const submitForm = async () => {
 
 
   grmForm.value.date_reported = new Date();
   grmForm.value.status ='Open'
   grmForm.value.model = 'grievance';
   grmForm.value.current_level = '1';
    

   const formInstance = dynamicFormRef

   formInstance.value.validate( async (valid: boolean) => {
     if (valid) {
       console.log('Is Valid',grmForm)
       
       //1. Submit teh greivance 
       const res =  await generateGrievance(grmForm.value)
       console.log('res',res)
 
       // 2. Uplaod docuemnts 
      await uploadFiles(res.data.id)
     

       // 3. Log the entry
       await logAction (res.data)
 

       ElMessage({
         message: res.message,
         type: 'success'
       })    

      
     } else {
       console.log('is Not Valid')
       ElMessage({
         message: 'Invalid Form',
         type: 'error'
       })    // felix - show message on success request 

     }
   });
 
 
};


const resetForm = () => {
  const formRef = dynamicFormRef.value;
  if (formRef) {
    formRef.resetFields();
  }
};

const checkStatus = () => {
  // Handle checking status logic here
  statusResult.value = {
    status: 'Pending',
    details: 'Your grievance is under review.'
  };
};

const handlePreview = (file) => {
  console.log('Preview:', file);
};

const handleRemove = (file, fileList) => {
  console.log('Remove:', file, fileList);
};

const beforeRemove = (file) => {
  return true;
};

const handleExceed = (files, fileList) => {
  ElMessage.warning('You can only upload up to 3 files.');
};

 
const tabPosition =ref('top')



const isTourVisible =ref(false)
const showTour = () => {

isTourVisible.value=true

 
}

const filteredTourSteps = computed(() => {

const fil = tourSteps.value.filter(step => step.step == active.value && step.visible==true);
console.log('filteredTourSteps', fil)
return fil
});


const endTour = () => { 
 
}


const tourSteps = ref([
  {
    step: 0,
    target: '#btn1',
    title: 'Name',
    content: 'Please provide your name as it appears on the National ID. Feel free to leave this blank if you want anonymity.',
    visible:true
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Gender',
    content: 'Please select your gender.',
    visible:true
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Age',
    content: 'Select your age bracket',
    visible:true
  },
  {
    step: 0,
    target: '#btn4',
    title: 'National ID',
    content: 'We require your national ID especially for land related complaints',
    visible:true
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Phone',
    content: 'Please provide your phone number. We require this for our communication on the status of the complaint',
    visible:true
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Email(optional)',
    content: 'Please provide an email address. We may use this for our communication on the status of the complaint',
    visible:true
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Next',
    content: 'Click here to fill in the complaint details',
    visible:true
  },
 

  {
    step: 0,
    target: '#btn8',
    title: 'Clear Form',
    content: 'Click here to clear this form',
    visible:true
  },
 

  {
  step: 1,
  target: '#btn10',
  title: 'County Selection',
  content: 'Select the county where the project is implemented.',
  visible: true
},

{
  step: 1,
  target: '#btn11',
  title: 'Settlement Selection',
  content: 'Select the settlement within the selected county.',
  visible: true
},
{
  step: 1,
  target: '#btn12',
  title: 'Address',
  content: 'Enter the your address.e, near XXX Primary school, Plot No. XXX.',
  visible: true
},
{
  step: 1,
  target: '#btn13',
  title: 'GBV Related Complaint',
  content: 'Indicate if the complaint is related to Gender-Based Violence.',
  visible: true
},
{
  step: 1,
  target: '#btn14',
  title: 'Nature of Complaint',
  content: 'Select the category that best describes the nature of the complaint.',
  visible: true
},
{
  step: 1,
  target: '#btn15',
  title: 'Complaint Description',
  content: 'Provide a detailed description of the complaint.',
  visible: true
},
{
  step: 1,
  target: '#btn16',
  title: 'Plea/Request',
  content: 'Enter your plea or request regarding the complaint.',
  visible: true
},

{
    step: 1,
    target: '#btn9',
    title: 'Previous',
    content: 'Click here to go back one page',
    visible:true
  },


{
  step: 2,
  target: '#btn17',
  title: 'Witness Name',
  content: 'Enter the name of the witness related to the grievance.',
  visible: true
},

{
  step: 2,
  target: '#btn18',
  title: 'Witness Phone',
  content: 'Enter the phone number of the witness.',
  visible: true
},

{
  step: 2,
  target: '#btn19',
  title: 'Witness Statement',
  content: 'Provide a statement from the witness regarding the grievance.',
  visible: true
},
{
  step: 2,
  target: '#btn20',
  title: 'Supporting Documentation',
  content: 'Upload any supporting documents related to the grievance. Only pdf/jpg/png files with a size less than 10mb are allowed.',
  visible: true
},
{
  step: 2,
  target: '#btn21',
  title: 'Submit',
  content: 'Click to send the form. You will receive a notification on SMS with a link for future followups.',
  visible: true
}



]);


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