<template>
  <BaseLayout>
    <div class="grievance-container" id="grievance-form">
      <el-card class="grievance-card">
        <section aria-label="Grievance Filing Process">
          <h1 class="visually-hidden">File a Grievance with KISIP</h1>
          <el-steps :active="active" finish-status="success" aria-label="Grievance filing steps">
            <el-step title="Personal Details" />
            <el-step title="Grievance Details" />
            <el-step title="Complaint Details" />
            <el-step title="Review & Submit" />
          </el-steps>
        </section>

        <el-form
          :model="grmForm" class="demo-form-inline" label-position="top" :rules="currentStepRules" size="small"
          ref="dynamicFormRef">
                <el-card shadow="hover">
                  <el-row v-if="active === 0" :gutter="10">
                    <!-- Step 1: Personal Details -->
                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn1" label="Name of Complainant(s)" prop="name">
                        <el-input v-model="grmForm.name" type="textarea" :rows="2" placeholder="Enter name(s) seperate by comma if more than one complainant" />
                        <el-text type="info" size="small">This field allows you to enter one or more names. Please provide the complainant's full name(s) as it appears on the National ID. Fill Anonymous if you want anonymity.</el-text>
                      </el-form-item>

                      <el-form-item id="btn2" label="Gender" prop="gender">
                        <el-select v-model="grmForm.gender" placeholder="Select" style="width: 100%">
                          <el-option label="Female" value="female" />
                          <el-option label="Male" value="male" />
                          <el-option label="Unspecified" value="unspecified" />
                        </el-select>
                        <el-text type="info" size="small">Please select the complainant's gender.</el-text>
                      </el-form-item>

                      <el-form-item id="btn3" label="Age" prop="age">
                        <el-select v-model="grmForm.age" placeholder="Select" style="width: 100%">
                          <el-option
v-for="item in ageRanges" :key="item.value" :label="item.label"
                            :value="item.value" />
                        </el-select>
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Select the complainant's age bracket.</el-text>
                      </el-form-item>


                    </el-col>


                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn4" label="National ID" prop="national_id">
                        <el-input v-model="grmForm.national_id" placeholder="Enter ID number" style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">We require the complainant's national ID especially for land related complaints.</el-text>
                      </el-form-item>

                      <el-form-item id="btn5" label="Phone" prop="phone">
                        <el-input
v-model="grmForm.phone" placeholder="Enter phone number (254.....)" style="width: 100%"
                          :onChange="convertPhoneNumber" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Please provide the complainant's phone number. This is the number we will use to communicate regarding the status of the complaint.</el-text>
                      </el-form-item>

                      <el-form-item id="btn6" label="Email" prop="email">
                        <el-input v-model="grmForm.email" placeholder="Enter Email" style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Please provide an email address. We may use this for our communication on the status of the complaint.</el-text>
                      </el-form-item>
                    </el-col>


                  </el-row>



                  <el-row v-if="active === 1" :gutter="10">
                    <!-- Step 2: Grievance Details -->
                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn10" label="County" prop="county_id">
                        <el-select
filterable v-model="grmForm.county_id" placeholder="County" @change="getSettlementByCounty"
                          style="width: 100%">
                          <el-option
v-for="item in countiesOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                        </el-select>
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Select the county where the project is implemented.</el-text>
                      </el-form-item>

                      <el-form-item id="btn10a" label="Project Phase" prop="project_phase">
                        <el-select
                          filterable v-model="grmForm.project_phase" placeholder="Select Project Phase"
                          style="width: 100%">
                          <el-option
                            v-for="item in projectPhaseOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                        </el-select>
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Select the project phase (KISIP 1 or KISIP 2).</el-text>
                      </el-form-item>

                      <el-form-item id="btn11" prop="settlement_id">
                        <template #label>
                          Settlement
                          <span v-if="isFilteringSettlements" class="loading-dots" aria-live="polite" aria-busy="true">
                            <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                          </span>
                        </template>
                        <el-select
                        filterable v-model="grmForm.settlement_id" :placeholder="isFilteringSettlements ? 'Filtering settlements…' : 'Settlement'"
                          :disabled="!grmForm.county_id || isFilteringSettlements" :loading="isFilteringSettlements"
                          @change="handleSelectSettlement" style="width: 100%">
                          <el-option
v-for="item in settlementOptions" :key="item.value" :label="item.label"
                            :value="item.value" />
                        </el-select>
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Select the settlement within the selected county.</el-text>
                      </el-form-item>

                      
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn12" label="Physical Address" prop="address">
                        <el-input v-model="grmForm.address" placeholder="Enter physical address" style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Enter the complainant's physical address, e.g., near XXX Primary school, Plot No. XXX.</el-text>
                      </el-form-item>

                      <el-form-item id="btn7a" label="Date Reported" prop="date_reported">
                        <el-date-picker
                          v-model="grmForm.date_reported"
                          type="date"
                          placeholder="Select date reported"
                          style="width: 100%;"
                          format="YYYY-MM-DD"
                          :disabled-date="disableFutureDates"
                        />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Select the date when the grievance was reported. Defaults to today.</el-text>
                      </el-form-item>

                      <el-form-item id="btn13" label="Complaint Type">
                        <el-checkbox
                          v-model="grmForm.isgbv"
                          label="Is this complaint related to Gender-Based Violence?"
                          size="large"
                          style="display: block; margin-bottom: 4px;" />
 
                        <el-checkbox
                          v-model="grmForm.isInCourt"
                          label="Is this complaint currently in court?"
                          size="large"
                          style="display: block; margin-top: 12px; margin-bottom: 4px;" />
                       </el-form-item>
                    </el-col>


                  </el-row>

                  <el-row v-if="active === 2" :gutter="10">
                    <!-- Step 3: Complaint Details -->
                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                      <el-form-item v-if="!grmForm.isgbv" id="btn14" label="Nature of Complaint" prop="nature">
                        <el-select filterable v-model="grmForm.nature" placeholder="Select category" style="width: 100%">
                          <el-option
                            v-for="item in grievanceOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                          />
                        </el-select>
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Select the category that best describes the nature of the complaint.</el-text>
                      </el-form-item>

                      <el-form-item id="btn15" label="Complaint Description" prop="description">
                        <el-input
                          v-model="grmForm.description" type="textarea" rows="2"
                          placeholder="Describe your complaint" style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Provide a detailed description of the complaint, including what happened, when, where, and who was involved.</el-text>
                      </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn16" label="Plea/Request" prop="plea">
                        <el-input
                          v-model="grmForm.plea" type="textarea" rows="4" placeholder="Enter your plea/request"
                          style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Enter the complainant's plea or request regarding the complaint. What action would you like to be taken?</el-text>
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row v-if="active === 3" :gutter="10">
                    <!-- Step 4: Review & Submit -->
                    <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">
                      <el-form-item id="btn17" label="Witness Name" prop="witness">
                        <el-input v-model="grmForm.witness" placeholder="Enter witness name" style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Enter the name of the witness related to the grievance (optional).</el-text>
                      </el-form-item>

                      <el-form-item id="btn18" label="Witness Phone" prop="witness_phone">
                        <el-input v-model="grmForm.witness_phone" placeholder="Enter witness phone" style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Enter the phone number of the witness (optional).</el-text>
                      </el-form-item>

                      <el-form-item id="btn19" label="Witness Statement" prop="witness_statement">
                        <el-input
v-model="grmForm.witness_statement" type="textarea"
                          placeholder="Enter witness statement" style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Provide a statement from the witness regarding the grievance (optional).</el-text>
                      </el-form-item>
                    </el-col>
                    <el-col :xs="12" :sm="12" :md="12" :lg="12" :xl="12">

                      <el-form-item id="btn21" label="Are you the complainant?" prop="witness">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 4px 0;">
                          <el-switch
                            v-model="grmForm.self_reported"
                            inline-prompt
                            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                            active-text="Yes"
                            inactive-text="No" />
                        </div>
                        <el-text type="info" size="small" class="switch-helper">Indicate if you are filing this grievance on behalf of yourself or someone else.</el-text>
                      </el-form-item>

                      <el-form-item v-if="!grmForm.self_reported" id="btn22" label="Your Name" prop="reporter_name">
                        <el-input v-model="grmForm.reporter_name" placeholder="Your Name" style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Enter your name if you are filing on behalf of someone else.</el-text>
                      </el-form-item>

                      <el-form-item v-if="!grmForm.self_reported" id="btn23" label="Your Phone" prop="reporter_phone">
                        <el-input
v-model="grmForm.reporter_phone" type="text" placeholder="Your Phone"
                          style="width: 100%" />
                        <el-text type="info" size="small" style="display: block; margin-top: 4px;">Enter your phone number if you are filing on behalf of someone else.</el-text>
                      </el-form-item>




                      <el-upload
id="btn20" class="upload-demo"
                        action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" multiple
                        :on-preview="handlePreview" :on-remove="handleRemove" :before-remove="beforeRemove" :limit="3"
                        v-model:file-list="fileList" :auto-upload="false" :on-exceed="handleExceed">
                        <el-button type="primary">Upload Supporting Documentation</el-button>
                        <template #tip>
                          <div class="el-upload__tip">pdf/jpg/png files with a size less than 500KB.</div>
                          <el-text type="info" size="small" style="display: block; margin-top: 8px;">Upload supporting documents such as photos, reports, or other relevant files related to this grievance (optional).</el-text>
                        </template>
                      </el-upload>





                    </el-col>

                  </el-row>
                </el-card>
              </el-form>

          <template #footer>
            <div class="steps-navigation">
              <div class="nav-group-left">
                <el-tooltip content="Help" placement="top">
                  <el-button color="#626aef" type="info" @click="showTour" :icon="InfoFilled" plain class="help-button">
                    <span class="help-button-text">Help</span>
                  </el-button>
                </el-tooltip>

                <el-button id="btn9" v-if="active > 0" @click="prev" :icon="ArrowLeft" class="prev-button">
                  Previous
                </el-button>
              </div>
              <div class="nav-group-right">
                <el-button id="btn7" v-if="active < 3" @click="next" class="next-button">
                  Next <el-icon class="el-icon--right">
                    <ArrowRight />
                  </el-icon>
                </el-button>

                <el-button
                  id="btn2" 
                  v-if="active === 3" 
                  @click="submitForm"
                  type="primary"
                  class="submit-button"
                >
                  Submit
                </el-button>
                <el-button id="btn8" @click="resetForm" class="reset-button">Reset</el-button>
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
</template>

<script setup lang="ts">
import { ref,watch, computed, nextTick } from 'vue';
import {
  ElButton, ElCard, ElForm, ElFormItem,  ElUpload, ElCheckbox, ElTour, ElTourStep, ElSwitch,
  ElSelect, ElOption, ElRow, ElCol, ElMessage, ElStep, ElSteps, ElIcon, ElTooltip, ElText, ElDatePicker,
} from 'element-plus';

import BaseLayout from './BaseLayout.vue';
import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { uploadGrievanceDocuments, generateGrievance, logGrievanceAction, sendAcknowledgement } from '@/api/grievance'

import { useHead } from '@unhead/vue'

useHead({
  title: 'File a Grievance | KeSMIS Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'File a grievance with  KISIP project. Submit complaints, feedback, or concerns about the Kenya Informal Settlements Improvement Project through our online grievance management system.' },
    { name: 'keywords', content: 'file grievance, KISIP complaint, Kenya slum management grievance, online complaint form, KISIP feedback, grievance management system' },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph tags (for WhatsApp, Facebook, LinkedIn)
    { property: 'og:title', content: 'File a Grievance - KeSMIS Kenya Slum Management Information System' },
    { property: 'og:description', content: 'Submit complaints, feedback, or concerns about the Kenya Informal Settlements Improvement Project.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/grm' },
    { property: 'og:image', content: 'https://kesmis.go.ke/logo.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'File a Grievance - KeSMIS Kenya Slum Management Information System' },
    { name: 'twitter:description', content: 'File a grievance with KeSMIS KISIP project. Submit complaints, feedback, or concerns about the Kenya Informal Settlements Improvement Project.' },
    { name: 'twitter:image', content: 'https://kesmis.go.ke/twitter-card.jpg' },
    { name: 'twitter:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    
    // Additional meta tags for better SEO
    { name: 'theme-color', content: '#00DC82' },
    { name: 'msapplication-TileColor', content: '#00DC82' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'format-detection', content: 'telephone=no' }
  ]
})
import {
  ArrowLeft,
  ArrowRight,
  InfoFilled,
} from '@element-plus/icons-vue'
import type { UploadUserFile } from 'element-plus'
import { uuid } from 'vue-uuid'
import { useRouter } from 'vue-router';
import { ElInput } from 'element-plus';
import type { FormInstance } from 'element-plus';


const active = ref(0);

const projectPhaseOptions = [
{ label: 'KISIP 2', value: 'KISIP 2' },
{ label: 'KISIP 1', value: 'KISIP 1' },
]


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
  project_phase?: string;
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
  project_phase: 'KISIP 2',
  date_reported: new Date(),
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
  },

  step3: {
    nature: [{ required: true, message: 'Nature of complaint is required', trigger: 'change' }],
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    plea: [{ required: true, message: 'Plea/request is required', trigger: 'blur' }],
  },

  step4: {
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

const ageRanges = [
  { value: 'unspecified', label: 'Unspecified' },
  { value: '18-25', label: '18-25' },
  { value: '26-35', label: '26-35' },
  { value: '36-45', label: '36-45' },
  { value: '46-55', label: '46-55' },
  { value: '56-65', label: '56-65' },
  { value: '65+', label: '65+' },
];

const countiesOptions = ref<CountyOption[]>([])
const settlementOptions = ref<SettlementOption[]>([])
const isFilteringSettlements = ref(false)

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

  isFilteringSettlements.value = true

  try {
    const response = await getSettlementByCountyAuth({ county_id: selectCounty })
    console.log('List of settlement:', response)
    const opt = response.data || []

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

    // No toast messages; UI shows animated dots next to label while filtering
  } catch (error) {
    // Optional: you may add error handling UI if needed
  } finally {
    isFilteringSettlements.value = false
  }
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
    
    // Focus the first field of the next step
    await nextTick();
    let firstFieldId = '';
    if (active.value === 1) {
      firstFieldId = '#btn10'; // County field
    } else if (active.value === 2) {
      firstFieldId = '#btn14'; // Nature of Complaint field (or first visible field)
    } else if (active.value === 3) {
      firstFieldId = '#btn17'; // Witness Name field
    }
    
    if (firstFieldId) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        // Try to find the input or select element within the specific form item
        const formItem = document.querySelector(firstFieldId) as HTMLElement;
        if (formItem) {
          // For step 1, specifically target the County select field (first select in the form item)
          if (active.value === 1) {
            // Find the first el-select within this form item (should be County)
            const firstSelect = formItem.querySelector('.el-select:first-of-type .el-select__wrapper input, .el-select:first-of-type input');
            if (firstSelect) {
              (firstSelect as HTMLElement).focus();
              return;
            }
          }
          
          // For select fields, find the input inside .el-select within this specific form item only
          const selectInput = formItem.querySelector('.el-select__wrapper input, .el-select input');
          if (selectInput) {
            (selectInput as HTMLElement).focus();
          } else {
            // For regular input fields, find only direct children or within this form item
            const input = formItem.querySelector('input, textarea');
            if (input) {
              (input as HTMLElement).focus();
            }
          }
        }
      }, 50);
    }
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

const disableFutureDates = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}
 
const submitForm = async () => {

  const formInstance = dynamicFormRef

  formInstance.value.validate(async (valid: boolean) => {
    if (valid) {
      console.log('Is Valid', grmForm)


      // Use date_reported from form, or default to today if not set
      if (!grmForm.value.date_reported) {
        grmForm.value.date_reported = new Date();
      }
 

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
    // Reset date_reported to today after reset
    grmForm.value.date_reported = new Date();
  }
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
  // Step 0: Personal Details
  {
    step: 0,
    target: '#btn1',
    title: 'Name',
    content: 'Please provide the complainant\'s name as it appears on the National ID. Fill Anonymous if you want anonymity.',
    visible: true
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Gender',
    content: 'Please select the complainant\'s gender.',
    visible: true
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Age',
    content: 'Select the complainant\'s age bracket.',
    visible: true
  },
  {
    step: 0,
    target: '#btn4',
    title: 'National ID',
    content: 'We require the complainant\'s national ID especially for land related complaints.',
    visible: true
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Phone',
    content: 'Please provide the complainant\'s phone number. We require this for our communication on the status of the complaint.',
    visible: true
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Email (Optional)',
    content: 'Please provide an email address. We may use this for our communication on the status of the complaint.',
    visible: true
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Next Button',
    content: 'Click here to proceed to the next step and fill in the grievance details.',
    visible: true
  },
  {
    step: 0,
    target: '#btn8',
    title: 'Reset Form',
    content: 'Click here to clear all form fields and start over.',
    visible: true
  },

  // Step 1: Grievance Details
  {
    step: 1,
    target: '#btn10',
    title: 'County Selection',
    content: 'Select the county where the project is implemented.',
    visible: true
  },
  {
    step: 1,
    target: '#btn10a',
    title: 'Project Phase',
    content: 'Select the project phase (KISIP 1 or KISIP 2).',
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
    title: 'Physical Address',
    content: 'Enter the complainant\'s physical address, e.g., near XXX Primary school, Plot No. XXX.',
    visible: true
  },
  {
    step: 1,
    target: '#btn13',
    title: 'Complaint Type',
    content: 'Indicate if the complaint is related to Gender-Based Violence or if it is currently in court.',
    visible: true
  },
  {
    step: 1,
    target: '#btn9',
    title: 'Previous Button',
    content: 'Click here to go back to the previous step.',
    visible: true
  },
  {
    step: 1,
    target: '#btn7',
    title: 'Next Button',
    content: 'Click here to proceed to the complaint details step.',
    visible: true
  },

  // Step 2: Complaint Details
  {
    step: 2,
    target: '#btn14',
    title: 'Nature of Complaint',
    content: 'Select the category that best describes the nature of the complaint.',
    visible: true
  },
  {
    step: 2,
    target: '#btn15',
    title: 'Complaint Description',
    content: 'Provide a detailed description of the complaint, including what happened, when, where, and who was involved.',
    visible: true
  },
  {
    step: 2,
    target: '#btn16',
    title: 'Plea/Request',
    content: 'Enter the complainant\'s plea or request regarding the complaint. What action would you like to be taken?',
    visible: true
  },
  {
    step: 2,
    target: '#btn9',
    title: 'Previous Button',
    content: 'Click here to go back to the previous step.',
    visible: true
  },
  {
    step: 2,
    target: '#btn7',
    title: 'Next Button',
    content: 'Click here to proceed to the review and submit step.',
    visible: true
  },

  // Step 3: Review & Submit
  {
    step: 3,
    target: '#btn17',
    title: 'Witness Name',
    content: 'Enter the name of the witness related to the grievance (optional).',
    visible: true
  },
  {
    step: 3,
    target: '#btn18',
    title: 'Witness Phone',
    content: 'Enter the phone number of the witness (optional).',
    visible: true
  },
  {
    step: 3,
    target: '#btn19',
    title: 'Witness Statement',
    content: 'Provide a statement from the witness regarding the grievance (optional).',
    visible: true
  },
  {
    step: 3,
    target: '#btn21',
    title: 'Are you the complainant?',
    content: 'Indicate if you are filing this grievance on behalf of yourself or someone else.',
    visible: true
  },
  {
    step: 3,
    target: '#btn22',
    title: 'Reporter Name',
    content: 'Enter your name if you are filing on behalf of someone else.',
    visible: true
  },
  {
    step: 3,
    target: '#btn23',
    title: 'Reporter Phone',
    content: 'Enter your phone number if you are filing on behalf of someone else.',
    visible: true
  },
  {
    step: 3,
    target: '#btn20',
    title: 'Supporting Documentation',
    content: 'Upload any supporting documents related to the grievance. Only pdf/jpg/png files with a size less than 500KB are allowed (up to 3 files).',
    visible: true
  },
  {
    step: 3,
    target: '#btn2',
    title: 'Submit Button',
    content: 'Click to submit your grievance. You will receive a notification via SMS with a reference code for future follow-ups.',
    visible: true
  },
  {
    step: 3,
    target: '#btn9',
    title: 'Previous Button',
    content: 'Click here to go back to the previous step.',
    visible: true
  },
  {
    step: 3,
    target: '#btn8',
    title: 'Reset Form',
    content: 'Click here to clear all form fields and start over.',
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

// Dark mode is handled by BaseLayout; styles respond to the inherited `.dark-mode` class.
 
</script>




<style scoped>
/* Accessibility */
.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.grievance-container {
  padding: 4rem 2rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background 0.3s ease, color 0.3s ease;
  min-height: 100vh;
}

.grievance-card {
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

.grievance-card :deep(.el-card__body) {
  padding: 2.5rem;
}

@media (max-width: 768px) {
  .grievance-container {
    padding: 2rem 1rem;
  }
  
  .grievance-card :deep(.el-card__body) {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .grievance-container {
    padding: 1.5rem 1rem;
  }
  
  .grievance-card :deep(.el-card__body) {
    padding: 1rem;
  }
}

/* Steps Component */
.el-steps {
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-primary);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
}

:deep(.el-step__title) {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  line-height: 1.2;
}

:deep(.el-step__head) {
  width: 24px;
  height: 24px;
}

:deep(.el-step__icon) {
  width: 24px;
  height: 24px;
  font-size: 12px;
}

:deep(.el-step__line) {
  top: 12px;
}

:deep(.el-step__head.is-process) {
  color: #00DC82;
  border-color: #00DC82;
}

:deep(.el-step__head.is-finish) {
  color: #00DC82;
  border-color: #00DC82;
}

:deep(.el-step__head.is-process .el-step__icon) {
  background-color: #00DC82;
  border-color: #00DC82;
  color: white;
}

:deep(.el-step__head.is-finish .el-step__icon) {
  background-color: #00DC82;
  border-color: #00DC82;
  color: white;
}

:deep(.el-step__head.is-wait .el-step__icon) {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-secondary);
}

/* Form Items */
.el-form-item {
  margin-bottom: 1rem;
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

:deep(.el-input.is-error .el-input__wrapper) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}



/* Textarea Styling */
:deep(.el-textarea__inner) {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
  padding: 0.75rem;
  font-size: 0.9375rem;
  resize: none;
  line-height: 1.6;
  font-family: inherit;
}

:deep(.el-textarea__inner:hover) {
  border-color: #00DC82;
}

:deep(.el-textarea__inner:focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

:deep(.el-textarea.is-error .el-textarea__inner) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
}

/* Select Styling */
:deep(.el-select .el-input__wrapper) {
  background: var(--bg-primary);
}

:deep(.el-select-dropdown) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

:deep(.el-select-dropdown__item) {
  color: var(--text-primary);
  font-size: 0.9375rem;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}

:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  background: rgba(0, 220, 130, 0.05);
}

:deep(.el-select-dropdown__item.selected) {
  color: #00DC82;
  background: rgba(0, 220, 130, 0.1);
  font-weight: 600;
}

/* Checkbox Styling */
:deep(.el-checkbox__label) {
  color: var(--text-primary);
  font-size: 0.9375rem;
  line-height: 1.6;
  font-weight: 500;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #00DC82;
  border-color: #00DC82;
}

:deep(.el-checkbox__inner:hover) {
  border-color: #00DC82;
}

/* Checkbox styling improvements */
:deep(.el-checkbox) {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0;
}

:deep(.el-checkbox__input) {
  margin-top: 2px;
  flex-shrink: 0;
}

:deep(.el-checkbox__label) {
  padding-left: 8px;
  line-height: 1.6;
}

/* Switch styling improvements */
:deep(.el-switch) {
  margin: 0;
}

:deep(.el-switch__label) {
  font-size: 0.9rem;
}

/* Switch Styling */
:deep(.el-switch__label.is-active) {
  color: #00DC82;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #00DC82;
  border-color: #00DC82;
}

/* Form item with checkboxes and switches */
.el-form-item[id="btn13"],
.el-form-item[id="btn17"],
.el-form-item[id="btn21"] {
  margin-bottom: 1rem;
}

/* Checkbox and switch helper text styling */
.checkbox-helper,
.switch-helper {
  display: block;
  margin-left: 28px;
  margin-top: 2px;
  font-size: 0.75rem;
  line-height: 1.3;
  color: rgba(128, 128, 128, 0.6) !important;
  opacity: 0.7;
}

.dark-mode .checkbox-helper,
.dark-mode .switch-helper {
  color: rgba(160, 160, 160, 0.5) !important;
  opacity: 0.6;
}

/* Navigation Buttons */
.steps-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-primary);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
  border-top: 2px solid rgba(0, 220, 130, 0.2);
  gap: 0.375rem;
  position: relative;
}

.steps-navigation::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(0, 220, 130, 0.3) 0%, rgba(0, 184, 107, 0.2) 50%, rgba(0, 220, 130, 0.3) 100%);
  border-radius: 12px 12px 0 0;
}

.steps-navigation > div {
  display: flex;
  gap: 0.375rem;
  align-items: center;
}

.nav-group-left {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.nav-group-right {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

/* Help button text - hidden on mobile */
.help-button-text {
  display: inline;
}

@media (max-width: 768px) {
  .help-button-text {
    display: none;
  }
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
  position: relative;
}

/* Subtle color lining on buttons */
:deep(.el-button--primary) {
  background: #00DC82 !important;
  border: 1px solid #00DC82 !important;
  border-left: 3px solid rgba(0, 184, 107, 0.6) !important;
  color: white !important;
}

:deep(.el-button--default) {
  background: transparent !important;
  border: 1px solid var(--border-color) !important;
  border-left: 3px solid rgba(0, 220, 130, 0.2) !important;
  color: var(--text-primary) !important;
}

:deep(.el-button--primary:hover) {
  background: #00B86B !important;
  border-color: #00B86B !important;
  border-left-color: rgba(0, 184, 107, 0.8) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 220, 130, 0.3);
}

:deep(.el-button--default:hover) {
  background: rgba(0, 220, 130, 0.1) !important;
  border-color: #00DC82 !important;
  border-left-color: rgba(0, 220, 130, 0.4) !important;
  color: #00DC82 !important;
}

:deep(.el-button--info) {
  background: transparent !important;
  border: 1px solid var(--border-color) !important;
  border-left: 3px solid rgba(98, 106, 239, 0.3) !important;
  color: var(--text-primary) !important;
}

:deep(.el-button--info:hover) {
  background: rgba(0, 220, 130, 0.1) !important;
  border-color: #00DC82 !important;
  border-left-color: rgba(98, 106, 239, 0.5) !important;
  color: #00DC82 !important;
}

:deep(.el-button--danger) {
  background: #f56c6c !important;
  border-color: #f56c6c !important;
  color: white !important;
}

:deep(.el-button--danger:hover) {
  background: #e85a5a !important;
  border-color: #e85a5a !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 108, 108, 0.3);
}

  /* Animated dots shown next to Settlement label while filtering */
  .loading-dots {
    display: inline-block;
    margin-left: 6px;
  }
  .loading-dots .dot {
    display: inline-block;
    animation: loading-blink 1.4s infinite both;
  }
  .loading-dots .dot:nth-child(2) {
    animation-delay: .2s;
  }
  .loading-dots .dot:nth-child(3) {
    animation-delay: .4s;
  }
  @keyframes loading-blink {
    0% { opacity: 0.2; }
    20% { opacity: 1; }
    100% { opacity: 0.2; }
  }

/* Upload Styling */
:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  background: var(--bg-primary);
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-upload-dragger:hover) {
  border-color: #00DC82;
  background: rgba(0, 220, 130, 0.02);
}

:deep(.el-upload__tip) {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-top: 0.5rem;
  line-height: 1.5;
}

:deep(.el-upload-list) {
  margin-top: 1rem;
}

/* Status Result */
.status-result {
  margin-top: 2rem;
  animation: fadeIn 0.3s ease-out;
}

.status-result :deep(.el-card) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.status-result :deep(.el-card__body) {
  padding: 1.5rem;
}

.status-result p {
  color: var(--text-primary);
  margin: 0.75rem 0;
  font-size: 0.9375rem;
  line-height: 1.7;
}

.status-result strong {
  color: var(--text-primary);
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-right: 0.5rem;
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

/* Tabs Styling */
:deep(.el-tabs__header) {
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-tabs__item) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0 1.5rem;
  letter-spacing: -0.01em;
  transition: all 0.3s ease;
}

:deep(.el-tabs__item.is-active) {
  color: #00DC82;
}

:deep(.el-tabs__active-bar) {
  background-color: #00DC82;
  height: 3px;
}

:deep(.el-tabs__item:hover) {
  color: #00DC82;
}

/* Card Styling */
:deep(.el-card) {
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  background: var(--bg-primary);
  overflow: hidden;
}

:deep(.el-card__body) {
  padding: 1.5rem;
}

:deep(.el-card.shadow-hover:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

/* Text Styling */
:deep(.el-text) {
  color: rgb(139, 138, 138);
  font-size: 0.7875rem;
  line-height: 1.6;
  display: block;
  margin-top: 0.5rem;
  font-style: italic;
}

/* Helper text - more subtle, pushed to background */
:deep(.el-text[type="info"]) {
  color: rgba(128, 128, 128, 0.6) !important;
  font-size: 0.8125rem;
  opacity: 0.7;
}

.dark-mode :deep(.el-text[type="info"]) {
  color: rgba(160, 160, 160, 0.5) !important;
  opacity: 0.6;
}

/* Dialog Styling */
:deep(.el-dialog) {
  border-radius: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

:deep(.el-dialog__header) {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

:deep(.el-dialog__title) {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

:deep(.el-dialog__body) {
  padding: 1.5rem;
  color: var(--text-primary);
}

:deep(.el-dialog__footer) {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .el-steps {
    display: none;
  }

  .steps-navigation {
    flex-direction: row;
    gap: 0.5rem;
    padding: 0.75rem;
    margin-top: 1rem;
    position: sticky;
    bottom: 0;
    background: var(--bg-primary);
    border-top: 2px solid rgba(0, 220, 130, 0.25);
    border-radius: 0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
    z-index: 10;
  }

  .steps-navigation::before {
    display: none;
  }

  .steps-navigation > div {
    display: flex;
    gap: 0.5rem;
    flex-wrap: nowrap;
    flex: 1;
  }

  /* Help button - icon only on mobile */
  .steps-navigation .nav-group-left :deep(.el-button--info) {
    min-width: 44px;
    width: 44px;
    padding: 0.75rem;
    flex-shrink: 0;
  }

  .steps-navigation .nav-group-left :deep(.el-button--info .help-button-text) {
    display: none;
  }

  /* All buttons - flexible sizing on mobile */
  .steps-navigation :deep(.el-button) {
    flex: 1;
    min-width: 0;
    padding: 0.75rem 0.75rem;
    font-size: 0.8125rem;
    min-height: 44px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Help button stays fixed width */
  .steps-navigation .nav-group-left :deep(.el-button--info) {
    flex: 0 0 44px;
  }

  :deep(.el-step__title) {
    font-size: 0.875rem;
  }

  :deep(.el-tabs__item) {
    font-size: 0.875rem;
    padding: 0 1rem;
  }

  .el-form-item {
    margin-bottom: 1.25rem;
  }

  :deep(.el-card__body) {
    padding: 1.25rem;
  }
}

@media (max-width: 480px) {
  .el-form-item {
    margin-bottom: 1rem;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    padding: 0.625rem;
  }

  .steps-navigation {
    padding: 0.5rem 0.625rem;
    gap: 0.375rem;
    margin-top: 0.5rem;
  }

  .steps-navigation > div {
    gap: 0.375rem;
  }

  /* All buttons stay in same row, smaller padding on very small screens */
  .steps-navigation :deep(.el-button) {
    flex: 1;
    min-width: 0;
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
    min-height: 44px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Help button stays icon-only and fixed width */
  .steps-navigation .nav-group-left :deep(.el-button--info) {
    width: 44px;
    min-width: 44px;
    flex: 0 0 44px;
    padding: 0.75rem;
  }

  .el-steps {
    padding: 0.5rem 0.375rem;
    margin-bottom: 0.5rem;
  }

  :deep(.el-step__title) {
    font-size: 0.8125rem;
  }

  :deep(.el-tabs__item) {
    font-size: 0.8125rem;
    padding: 0 0.75rem;
  }
}

/* Dark Mode Support */
.dark-mode .grievance-card {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-card) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-steps) {
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

.dark-mode :deep(.el-textarea__inner) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.dark-mode :deep(.el-textarea__inner:hover),
.dark-mode :deep(.el-textarea__inner:focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

.dark-mode :deep(.el-select .el-input__wrapper) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-select-dropdown) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode .steps-navigation {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-tabs__header) {
  border-color: var(--border-color);
}

.dark-mode :deep(.el-dialog) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-dialog__header),
.dark-mode :deep(.el-dialog__footer) {
  border-color: var(--border-color);
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
