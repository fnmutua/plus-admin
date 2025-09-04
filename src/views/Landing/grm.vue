<template>
  <BaseLayout>
    <div class="grievance-container" :class="{ 'dark-mode': isDarkMode }">
      <el-card>


          <el-tabs v-model="activeName" :tab-position="tabPosition">

            <el-tab-pane label="File a Grievance" name="file">
              <el-steps :active="active" finish-status="success">
                <el-step title="Personal Details" />
                <el-step title="Grievance Details" />
                <el-step title="Review & Submit" />
              </el-steps>

              <el-form
:model="grmForm" class="demo-form-inline" label-position="top" :rules="currentStepRules"
                ref="dynamicFormRef">
                <el-card shadow="hover">
                  <el-row v-if="active === 0" :gutter="10">
                    <!-- Step 1: Personal Details -->
                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn1" label="Name" prop="name">
                        <el-input v-model="grmForm.name" placeholder="Enter name" style="width:90%" />
                      </el-form-item>

                      <el-form-item id="btn2" label="Gender" prop="gender">
                        <el-select v-model="grmForm.gender" placeholder="Select" style="width:90%">
                          <el-option label="Female" value="female" />
                          <el-option label="Male" value="male" />
                          <el-option label="Unspecified" value="unspecified" />
                        </el-select>
                      </el-form-item>

                      <el-form-item id="btn3" label="Age" prop="age">
                        <el-select v-model="grmForm.age" placeholder="Select" style="width:90%">
                          <el-option
v-for="item in ageRanges" :key="item.value" :label="item.label"
                            :value="item.value" />
                        </el-select>
                      </el-form-item>


                    </el-col>


                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn4" label="National ID" prop="national_id">
                        <el-input v-model="grmForm.national_id" placeholder="Enter ID number" style="width:90%" />
                      </el-form-item>

                      <el-form-item id="btn5" label="Phone" prop="phone">
                        <el-input
v-model="grmForm.phone" placeholder="Enter phone number (254.....)" style="width:90%"
                          :onChange="convertPhoneNumber" />
                      </el-form-item>

                      <el-form-item id="btn6" label="Email" prop="email">
                        <el-input v-model="grmForm.email" placeholder="Enter Email" style="width:90%" />
                      </el-form-item>
                    </el-col>


                  </el-row>



                  <el-row v-if="active === 1" :gutter="10">
                    <!-- Step 2: Grievance Details -->
                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn10" label="County" prop="county_id">
                        <el-select
filterable v-model="grmForm.county_id" placeholder="County" @change="getSettlementByCounty"
                          style="width:90%">
                          <el-option
v-for="item in countiesOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                        </el-select>
                      </el-form-item>

                      <el-form-item id="btn11" label="Settlement" prop="settlement_id">
                        <el-select
filterable v-model="grmForm.settlement_id" placeholder="Settlement"
                          @change="handleSelectSettlement" style="width:90%">
                          <el-option
v-for="item in settlementOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                        </el-select>
                      </el-form-item>

                      <el-form-item id="btn12" label="Address" prop="address">
                        <el-input v-model="grmForm.address" placeholder="Enter address" style="width:90%" />
                      </el-form-item>



                      <el-checkbox
id="btn13" v-model="grmForm.isgbv"
                        label="Is this complaint related to Gender-Based Violence?" size="large"
                        style="margin-bottom:5px" />

                 
                        <el-checkbox
id="btn13" v-model="grmForm.isInCourt"
                        label="Is this complaint currently in court?" size="large"
                        style="margin-bottom:5px" />



                    </el-col>
                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">

                      <!-- <el-form-item v-if="!grmForm.isgbv" id="btn14" label="Nature of Complaint" prop="nature">
                        <el-select v-model="grmForm.nature" placeholder="Select category" style="width:90%">
                          <el-option label="Land" value="land" />
                          <el-option label="Labour Related" value="labour" />
                          <el-option label="Infrastructure" value="infrastructure" />
                          <el-option label="Others" value="others" />
                        </el-select>
                      </el-form-item> -->


                      <el-form-item v-if="!grmForm.isgbv" id="btn14" label="Nature of Complaint" prop="nature">
                          <el-select filterable  v-model="grmForm.nature" placeholder="Select category" style="width:90%">
                            <!-- <el-option label="Land Ownership Disputes" value="land_ownership" />
                            <el-option label="Evictions and Displacement" value="evictions" />
                            <el-option label="Compensation Concerns" value="compensation" />
                            <el-option label="Labour Wage Disputes" value="labour_wages" />
                            <el-option label="Unfair Dismissal or Termination" value="unfair_dismissal" />
                            <el-option label="Workplace Harassment" value="workplace_harassment" />
                            <el-option label="Unsafe Working Conditions" value="unsafe_conditions" />
                            <el-option label="Poor Road Conditions" value="poor_roads" />
                            <el-option label="Water and Sanitation Issues" value="water_sanitation" />
                            <el-option label="Electricity and Power Supply Concerns" value="electricity" />
                            <el-option label="Inadequate Public Transport" value="public_transport" />
                            <el-option label="Pollution Complaints" value="pollution" />
                            <el-option label="Waste Management Issues" value="waste_management" />
                            <el-option label="Public Health Hazards" value="public_health" />
                            <el-option label="Deforestation or Land Degradation" value="deforestation" />
                            <el-option label="Discrimination and Exclusion" value="discrimination" />
                            <el-option label="Corruption and Mismanagement" value="corruption" />
                            <el-option label="Others" value="others" /> -->
                            <el-option
                                    v-for="item in grievanceOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                  />
                          </el-select>
                        </el-form-item>



                      <el-form-item id="btn15" label="Complaint Description" prop="description">
                        <el-input
v-model="grmForm.description" type="textarea" rows="2"
                          placeholder="Describe your complaint" style="width:90%" />
                      </el-form-item>

                      <el-form-item id="btn16" label="Plea/Request" prop="plea">
                        <el-input
v-model="grmForm.plea" type="textarea" rows="2" placeholder="Enter your plea/request"
                          style="width:90%" />
                      </el-form-item>
                    </el-col>


                  </el-row>

                  <el-row v-if="active === 2" :gutter="10">
                    <!-- Step 3: Review & Submit -->
                    <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn17" label="Witness Name" prop="witness">
                        <el-input v-model="grmForm.witness" placeholder="Enter witness name" style="width:90%" />
                      </el-form-item>

                      <el-form-item id="btn18" label="Witness Phone" prop="witness_phone">
                        <el-input v-model="grmForm.witness_phone" placeholder="Enter witness phone" style="width:90%" />
                      </el-form-item>

                      <el-form-item id="btn19" label="Witness Statement" prop="witness_statement">
                        <el-input
v-model="grmForm.witness_statement" type="textarea"
                          placeholder="Enter witness statement" style="width:90%" />
                      </el-form-item>
                    </el-col>
                    <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">

                      <el-form-item id="btn17" label="Are you the complainant?" prop="witness">

                        <el-switch
v-model="grmForm.self_reported" class="ml-2" inline-prompt
                          style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" active-text="Yes"
                          inactive-text="No" />

                      </el-form-item>

                      <el-form-item v-if="!grmForm.self_reported" id="btn18" label="Your Name" prop="reporter_name">
                        <el-input v-model="grmForm.reporter_name" placeholder="Your Name" style="width:90%" />
                      </el-form-item>

                      <el-form-item v-if="!grmForm.self_reported" id="btn19" label="Your Phone" prop="reporter_phone">
                        <el-input
v-model="grmForm.reporter_phone" type="text" placeholder="Your Phone"
                          style="width:90%" />
                      </el-form-item>




                      <el-upload
id="btn20" class="upload-demo"
                        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple
                        :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove" :limit="3"
                        v-model:file-list="fileList" :auto-upload="false" :on-exceed="handleExceed">
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
                        <el-input v-model="statusForm.phoneNumber" placeholder="25470000000" />
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
                          <p style="margin-top: 10px"><strong>Ref:</strong> {{ statusResult.code }}</p>
                          <p style="margin-top: 10px"><strong>Date Reported:</strong> {{ statusResult.date_reported }}
                            ({{ getDaysSince(statusResult.date_reported) }} days ago)</p>
                            <p style="margin-top: 10px"><strong>Status:</strong> {{ statusResult.status }}</p>
                            <p style="margin-top: 10px"><strong>Status2:</strong> {{ statusResult.daysToExpiryDate }}</p>
                            <el-button  
                              type="danger"
                              style="margin-top: 10px"
                              v-if="statusResult.daysToExpiryDate < 0" 
                              @click="escalateIssue"
                            >
                              {{ statusResult.escalateLabel }}
                            </el-button>


                        </el-card>
                      </div>
                    </el-col>
                  </el-row>
                </el-card>
              </el-form>
            </el-tab-pane>
          </el-tabs>
          <template #footer>
            <div
class="steps-navigation"
              style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
              <div>
                <el-tooltip content="Help" placement="top">
                  <el-button color="#626aef" type="info" @click="showTour" :icon="InfoFilled" plain />
                </el-tooltip>

                <el-button id="btn9" v-if="active > 0" @click="prev" type="primary" :icon="ArrowLeft">Previous
                </el-button>
              </div>
              <div>
                <el-button id="btn7" v-if="active < 2" type="primary" @click="next">
                  Next <el-icon class="el-icon--right">
                    <ArrowRight />
                  </el-icon>
                </el-button>

                <el-button
id="btn2" v-if="active === 2" type="primary" @click="submitForm"
                  style="margin-left: 10px;">Submit</el-button>
                <el-button id="btn8" @click="resetForm" style="margin-left: 10px;">Reset</el-button>
              </div>
            </div>
          </template>

        </el-card>
      </div>

      <el-tour v-model="isTourVisible" :z-index="100000" :on-close="endTour">
        <el-tour-step
v-for="(step, index) in filteredTourSteps" :key="index" :target="step.target" :title="step.title"
          :description="step.content" />
      </el-tour>
    </BaseLayout>


  
    <el-dialog 
          v-model="showEscalateMessage" 
          title="Escalate Grievance" 
          width="50%" 
          :close-on-click-modal="false"
        >
          <el-row justify="center">
            <el-col :span="24">
              <el-input 
                v-model="EscalateMessage" 
                placeholder="Enter escalation reason. Provide as much detail as possible" 
                type="textarea" 
                :rows="3"
                maxlength="500"
                show-word-limit
              />
            </el-col>
          </el-row>

          <template #footer>
            <div class="dialog-footer">
              <el-button @click="showEscalateMessage = false">Cancel</el-button>
              <el-button type="success" @click="submitEscalation()">Submit</el-button>
            </div>
          </template>
  </el-dialog>


</template>

<script setup lang="ts">
import { ref,watch, computed, onMounted } from 'vue';
import {
  ElButton, ElCard, ElForm, ElFormItem,  ElUpload, ElCheckbox, ElTour, ElTourStep, ElSwitch,
  ElTabPane, ElTabs, ElSelect, ElOption, ElRow, ElCol, ElMessage, ElStep, ElSteps, ElIcon, ElTooltip,ElDialog, 
} from 'element-plus';

import BaseLayout from './BaseLayout.vue';
import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { uploadGrievanceDocuments, generateGrievance, logGrievanceAction, getGrievanceStatus, sendAcknowledgement,selfEscalate } from '@/api/grievance'
import {
  ArrowLeft,
  ArrowRight,
  InfoFilled,
} from '@element-plus/icons-vue'
import type { UploadUserFile } from 'element-plus'
import { uuid } from 'vue-uuid'
import { useRouter } from 'vue-router';
import { ElInput } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';


const activeName = ref('file');
const active = ref(0);

const grievanceOptions = [
  { label: 'Land Ownership or Title Disputes', value: 'land_ownership' },
  { label: 'Evictions or Displacement', value: 'evictions' },
  { label: 'Compensation or Resettlement Issues', value: 'compensation' },
  { label: 'Poor Road or Pathway Conditions', value: 'poor_roads' },
  { label: 'Infrastructure related ', value: 'infrastructure' },
  { label: 'Drainage and Flooding Problems', value: 'drainage_flooding' },
  { label: 'Water Access and Supply Issues', value: 'water_supply' },
  { label: 'Sanitation and Hygiene Concerns', value: 'sanitation' },
  { label: 'Electricity or Street Lighting Issues', value: 'electricity_lighting' },
  { label: 'Waste Collection and Management', value: 'waste_management' },
  { label: 'Environmental Degradation ', value: 'environmental_issues' },
  { label: 'Health and Safety Hazards', value: 'health_safety' },
  { label: 'Corruption, Mismanagement, or Bribery', value: 'corruption' },
  { label: 'Discrimination, Exclusion or Favoritism', value: 'discrimination' },
  { label: 'Gender-Based Violence or Harassment', value: 'gbv' },
  { label: 'Labour Issues (e.g. unpaid wages, poor conditions)', value: 'labour_issues' },
  { label: 'Lack of Information or Consultation', value: 'information_gap' },
  { label: 'Project Implementation Delays or Inactivity', value: 'delays' },
  { label: 'Other', value: 'other' }
];


interface GrievanceForm {
  name: string;
  gender: string;
  age: string;
  national_id: string;
  phone: string;
  email: string;
  county_id: string;
  settlement_id: string;
  address: string;
  nature: string;
  isgbv: boolean;
  isInCourt: boolean;
  description: string;
  plea: string;
  witness: string;
  witness_phone: string;
  witness_statement: string;
  self_reported: boolean;
  reporter_name: string;
  reporter_phone: string;
  date_reported?: Date;
  status?: string;
  model?: string;
  current_status_date?: Date;
  status_expiry_date?: Date;
  current_level?: string;
  subcounty_id?: string;
  ward_id?: string;
}

interface StatusResult {
  code: string;
  id: string;
  date_reported: string;
  status: string;
  daysToExpiryDate: number;
  current_level: string;
  escalateLabel: string;
}

interface CountyOption {
  value: number;
  label: string;
}

interface SettlementOption {
  value: number;
  label: string;
  county_id: number;
  subcounty_id: number;
  ward_id: number;
}

const grmForm = ref<GrievanceForm>({
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
  isInCourt: false,
  description: '',
  plea: '',
  witness: '',
  witness_phone: '',
  witness_statement: '',
  self_reported: true,
  reporter_name: '',
  reporter_phone: '',
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
  },

  step2: {
    county_id: [{ required: true, message: 'County is required', trigger: 'change' }],
    settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'change' }],
    nature: [{ required: true, message: 'Nature of complaint is required', trigger: 'change' }],
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    plea: [{ required: true, message: 'Plea/request is required', trigger: 'blur' }],
  },

  step3: {
    reporter_name: [{ required: true, message: 'Name is required', trigger: 'change' }],
    reporter_phone: [{ required: true, message: 'Phone is required', trigger: 'change' }],
  },
});


const currentStepRules = computed(() => {
  const stepRulesKey = `step${active.value + 1}`;
  console.log('stepRulesKey', stepRulesKey)
  return validationRules[stepRulesKey];
});

console.log('currentStepRules', currentStepRules)

const statusForm = ref({
  grievanceCode: '',
  phoneNumber: '',
});

const statusResult = ref<StatusResult>({
  code: '',
  id: '',
  date_reported: '',
  status: '',
  daysToExpiryDate: 0,
  current_level: '',
  escalateLabel: ''
});


const ageRanges = [
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: '46-55', label: '46-55' },
  { value: '56-65', label: '56-65' },
  { value: '65+', label: '65+' },
];

const countiesOptions = ref<CountyOption[]>([])
const settlementOptions = ref<SettlementOption[]>([])

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
  grmForm.value.subcounty_id = filteredOptions[0].subcounty_id
  grmForm.value.ward_id = filteredOptions[0].ward_id
  grmForm.value.county_id = filteredOptions[0].county_id
  grmForm.value.current_level = 'settlement'  // 1-settlement





  console.log(grmForm.value)


}



const znext = async () => {

  console.log(grmForm.value)
  const formInstance = dynamicFormRef
  formInstance.value.validate((valid: boolean) => {
    if (valid) {
      console.log(formInstance)
      active.value++;
    }
  });


};

const next = async () => {
  const formInstance = dynamicFormRef.value;
  if (!formInstance) return;

  try {
    await formInstance.validate();
    active.value++;
  } catch (error) {
    ElMessage({
      message: 'Please fill in all required fields correctly',
      type: 'error'
    });
  }
};

const prev = () => {
  active.value--;
};

const dynamicFormRef = ref<FormInstance>()




const router = useRouter();




const uploadFiles = async (action_id, grievance_id) => {
  const formData = new FormData();

  // Assuming `fileList` is an array of file objects and `grievance_id` is defined
  for (var i = 0; i < fileList.value.length; i++) {
    console.log('------>file', fileList.value[i]);
    formData.append('files', fileList.value[i].raw);
    formData.append('format', fileList.value[i].name.split('.').pop());
    formData.append('grievance_id', grievance_id);
    formData.append('action_id', action_id);
    formData.append('type', 'Supporting Documentation');
    formData.append('protected_file', true);
    formData.append('size', (fileList.value[i].raw.size / 1024 / 1024).toFixed(2));
    formData.append('code', uuid.v4());
  }

  // Printing out the contents of formData
  for (let [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  const res = await uploadGrievanceDocuments(formData)

  console.log("Docuemnts Uploaded", res)




}

const logAction = async (grievance) => {
  console.log('Log---->grievance', grievance)


  const formData = {};

  formData.grievance_id = grievance.id
  formData.action_type = 'Reported'
  formData.action_by = null
  formData.date_actioned = grievance.date_reported
  formData.prev_status = grievance.status
  formData.new_status = grievance.status
  formData.current_level = 'settlement'



  const res = await logGrievanceAction(formData)

  return res.data


}

function getStageDuration(status) {
    const durations = {
        "Sorting": 7, // 7 days
        "Investigation": 14, // 14 days
        "Escalated": 14 , // 3 days
        "Resolved": 21,  // 3 days
        "Closed": 42,  // 3 days
  
    };
    return (durations[status] || 0) * 24 * 60 * 60 * 1000; // Convert days to milliseconds
}
 
const submitForm = async () => {

  const formInstance = dynamicFormRef

  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      console.log('Is Valid', grmForm)


      grmForm.value.date_reported = new Date();
 

      if(grmForm.value.isInCourt) {
        grmForm.value.status = 'In Court'
      } else {
        grmForm.value.status = 'Sorting'
      }


      

      grmForm.value.model = 'grievance';

      grmForm.value.current_status_date=new Date();
 
      grmForm.value.status_expiry_date = new Date(Date.now() + getStageDuration(grmForm.value.status));



      if (grmForm.value.isgbv) {
        grmForm.value.current_level = 'national';

      }
      else {
        grmForm.value.current_level = 'settlement';
      }
 

      //1. Submit teh greivance 
      const res = await generateGrievance(grmForm.value)
      console.log('res', res)





      // 3. Log the entry
      let log = await logAction(res.data)


      // 2. Uplaod docuemnts 
      await uploadFiles(log.id, res.data.id)

      // 3. Send Notification 

      await sendNotification(res.data, log.id)


      console.log("Log Successful", res)
      router.push('/landing');


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



   // Watch for changes in grievanceCode and format as "GRM-..."
   watch(
      () => statusForm.value.grievanceCode,
      (newVal) => {
        if (!newVal.startsWith("GRM-")) {
          statusForm.value.grievanceCode = `GRM-${newVal.replace(/[^0-9]/g, "")}`;
        }
      }
    );

    

 

// Watch for changes in phoneNumber and ensure it starts with "254"
watch(
  () => statusForm.value.phoneNumber,
  (newVal) => {
    // Remove non-numeric characters
    let sanitizedNumber = newVal.replace(/[^0-9]/g, "");

    // Check if it starts with '0' and truncate it
    if (sanitizedNumber.startsWith("0")) {
      sanitizedNumber = sanitizedNumber.substring(1);
    }

    // Add '254' prefix if it's missing
    if (!sanitizedNumber.startsWith("254")) {
      sanitizedNumber = `254${sanitizedNumber}`;
    }

    // Ensure the number doesn't exceed the typical length of 12 digits
    statusForm.value.phoneNumber = sanitizedNumber.substring(0, 12);
  }
);


// Watch for changes in phoneNumber and ensure it starts with "254"
watch(
  () => grmForm.value.phone,
  (newVal) => {
    // Remove non-numeric characters
    let sanitizedNumber = newVal.replace(/[^0-9]/g, "");

    // Check if it starts with '0' and truncate it
    if (sanitizedNumber.startsWith("0")) {
      sanitizedNumber = sanitizedNumber.substring(1);
    }

    // Add '254' prefix if it's missing
    if (!sanitizedNumber.startsWith("254")) {
      sanitizedNumber = `254${sanitizedNumber}`;
    }

    // Ensure the number doesn't exceed the typical length of 12 digits
    grmForm.value.phone = sanitizedNumber.substring(0, 12);
  }
);




function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


const sendNotification = async (grievance, action_id) => {
  const formData = {};

  // Additional properties based on the provided JSON object
  formData.type = "acknowledgement"
  formData.action_id = action_id || null;
  formData.grievance_id = grievance.id || null;
  formData.phone = grievance.phone || null;
  formData.project_phone = grievance.project_phone || 'Not Available';
  formData.code = grievance.code || null;
  formData.date = formatDate(grievance.date_reported) || null;
  formData.age = grievance.age || null;
  formData.gender = grievance.gender || null;
  formData.barcode = grievance.barcode || null;
  formData.name = grievance.name || null;
  formData.address = grievance.address || null;
  formData.settlement = grievance.settlement.name || null;
  formData.email = grievance.email || null;
  formData.complaint = grievance.description || null;
  formData.county = grievance.county.name || null;
  formData.subcounty = grievance.subcounty.name || null;
  formData.documents = grievance.documents || null;


  console.log(formData);

  const res = await sendAcknowledgement(formData)

  console.log(res)

}

const resetForm = () => {
  const formRef = dynamicFormRef.value;
  if (formRef) {
    formRef.resetFields();
  }
};

const checkStatus = async () => {

  console.log(statusForm.value)
  const res = await getGrievanceStatus(statusForm.value)
  console.log(res.data)

  // Handle checking status logic here
  statusResult.value = {
    code: res.data.code,
    id: res.data.id,
    date_reported: res.data.date_reported,
    status: res.data.status,
    daysToExpiryDate: res.data.daysToExpiryDate,
    current_level:  res.data.current_level,
    escalateLabel:  res.data.escalateLabel
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


const tabPosition = ref('top')



const isTourVisible = ref(false)
const showTour = () => {

  isTourVisible.value = true


}

const filteredTourSteps = computed(() => {

  const fil = tourSteps.value.filter(step => step.step == active.value && step.visible == true);
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
    content: 'Please provide your name as it appears on the National ID. Fill Anonymous if you want anonymity.',
    visible: true
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Gender',
    content: 'Please select your gender.',
    visible: true
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Age',
    content: 'Select your age bracket',
    visible: true
  },
  {
    step: 0,
    target: '#btn4',
    title: 'National ID',
    content: 'We require your national ID especially for land related complaints',
    visible: true
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Phone',
    content: 'Please provide your phone number. We require this for our communication on the status of the complaint',
    visible: true
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Email(optional)',
    content: 'Please provide an email address. We may use this for our communication on the status of the complaint',
    visible: true
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Next',
    content: 'Click here to fill in the complaint details',
    visible: true
  },


  {
    step: 0,
    target: '#btn8',
    title: 'Clear Form',
    content: 'Click here to clear this form',
    visible: true
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
    visible: true
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


function convertPhoneNumber(phoneNumber: string | undefined) {

  // console.log(phoneNumber)
  let trimmedPhoneNumber = phoneNumber.replace(/\s+/g, '').trim();
  console.log(trimmedPhoneNumber.startsWith('0'))


  if (trimmedPhoneNumber.startsWith('0')) {
    trimmedPhoneNumber = '254' + trimmedPhoneNumber.slice(1);
  }

  console.log(trimmedPhoneNumber)
  // return trimmedPhoneNumber;
  grmForm.value.phone = trimmedPhoneNumber

}

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

const showEscalateMessage=ref(false)
const EscalateMessage=ref(null)
const escalateIssue = async () => {

  console.log('Escalating......')
  showEscalateMessage.value=true

 }
 const submitEscalation = async () => {

  console.log(EscalateMessage.value)

  const formData = {}
  formData.code = statusResult.value.code
  formData.action = EscalateMessage.value
  formData.new_status = 'Escalated'

  if (statusResult.value.current_level === 'settlement') {
  formData.current_level = 'county';
} else if (statusResult.value.current_level === 'county') {
  formData.current_level = 'national';
} else {
  formData.current_level = statusResult.value.current_level; // Default fallback (no change)
}
  
formData.status_expiry_date = new Date() + getStageDuration(formData.new_status);
formData.current_status_date=new Date();

// here we provide log actiion 
formData.grievance_id=statusResult.value.id
formData.action_type = 'Escalate'
formData.action_by = 1 /// to be changed
formData.date_actioned = new Date();
formData.prev_status = statusResult.value.status
formData.action_level = statusResult.value.current_level 
  


console.log(formData)

try {
  const res = await selfEscalate(formData);
  if (res) {
    console.log(res)

    await logGrievanceAction(formData);
  }
} catch (error) {
  console.error("Error in selfEscalate:", error);
}




  showEscalateMessage.value=false

 }

const isDarkMode = ref(false);

// Function to check system dark mode preference
const checkDarkMode = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');
  isDarkMode.value = savedTheme ? savedTheme === 'dark' : prefersDark;
};

// Function to toggle dark mode
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
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
 
</script>




<style>
.form-container {
  max-height: 100vh;
  overflow-y: auto;
  background-color: var(--bg-primary);
  transition: all 0.3s ease;
  padding: 2rem 0;
}

:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #2c3e50;
  --text-secondary: #606266;
  --border-color: #dcdfe6;
  --accent-color: #409eff;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
  --gradient-start: #409eff;
  --gradient-end: #66b1ff;
  --input-bg: #ffffff;
  --input-border: #dcdfe6;
  --input-text: #2c3e50;
  --step-bg: #ffffff;
  --step-border: #dcdfe6;
  --step-text: #2c3e50;
  --step-active: #409eff;
  --step-completed: #67c23a;
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
  --input-bg: #2c2c2c;
  --input-border: #3a3a3a;
  --input-text: #ffffff;
  --step-bg: #2c2c2c;
  --step-border: #3a3a3a;
  --step-text: #ffffff;
  --step-active: #4a9eff;
  --step-completed: #67c23a;
  --card-bg: #2c2c2c;
  --hover-bg: #363636;
  --disabled-bg: #2c2c2c;
  --disabled-text: #666666;
}

.el-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  margin-bottom: 2rem;
}

.el-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.el-steps {
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--step-bg);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

:deep(.el-step__title) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--step-text);
}

:deep(.el-step__head.is-process) {
  color: var(--step-active);
  border-color: var(--step-active);
}

:deep(.el-step__head.is-finish) {
  color: var(--step-completed);
  border-color: var(--step-completed);
}

.el-form-item {
  margin-bottom: 1.5rem;
}

:deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

:deep(.el-input__wrapper) {
  background: var(--input-bg);
  box-shadow: none;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
}

:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

:deep(.el-input__inner) {
  color: var(--input-text);
  background: var(--input-bg);
}

:deep(.el-textarea__inner) {
  background: var(--input-bg);
  color: var(--input-text);
  border: 1px solid var(--input-border);
  border-radius: 8px;
  transition: all 0.3s ease;
  padding: 1rem;
  font-size: 1rem;
  resize: none;
}

:deep(.el-textarea__inner:hover),
:deep(.el-textarea__inner:focus) {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
}

:deep(.el-select .el-input__wrapper) {
  background: var(--input-bg);
}

:deep(.el-select-dropdown) {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
}

:deep(.el-select-dropdown__item) {
  color: var(--text-primary);
}

:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  background: var(--hover-bg);
}

:deep(.el-select-dropdown__item.selected) {
  color: var(--accent-color);
  background: var(--hover-bg);
}

:deep(.el-checkbox__label) {
  color: var(--text-primary);
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
}

.steps-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.el-button {
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.el-button--primary {
  background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
  border: none;
  color: white;
}

.el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
  opacity: 0.9;
}

.el-button--info {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

.el-button--info:hover {
  background: var(--hover-bg);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  background: var(--input-bg);
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--accent-color);
  background: var(--hover-bg);
}

:deep(.el-upload__tip) {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.status-result {
  margin-top: 1.5rem;
  animation: fadeIn 0.3s ease-out;
}

.status-result .el-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
}

.status-result p {
  color: var(--text-primary);
  margin: 0.5rem 0;
  font-size: 1rem;
}

.status-result strong {
  color: var(--text-secondary);
  font-weight: 600;
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

@media (max-width: 768px) {
  .form-container {
    padding: 1rem;
  }

  .el-card {
    margin-bottom: 1rem;
  }

  .steps-navigation {
    flex-direction: column;
    gap: 1rem;
  }

  .steps-navigation > div {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }

  .el-button {
    width: 100%;
    margin: 0;
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  :deep(.el-step__title) {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .form-container {
    padding: 0.5rem;
  }

  .el-form-item {
    margin-bottom: 1rem;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    padding: 0.5rem;
  }

  .el-button {
    padding: 0.6rem 0.9rem;
    font-size: 0.85rem;
  }
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