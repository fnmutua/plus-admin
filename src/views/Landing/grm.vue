<template>
  <BaseLayout>
    <div class="gok-grm" id="grievance-form">
      <div class="gok-container gok-grm__shell">
        <header class="gok-grm__header">
          <p class="gok-eyebrow">Electronic Grievance Redress</p>
          <h1 class="gok-grm__title">File a grievance</h1>
          <p class="gok-grm__lead">
            Submit a complaint or concern related to programme activities. You can track progress using the
            code you receive after submission.
          </p>
        </header>

        <el-steps
          :active="active"
          finish-status="success"
          align-center
          class="gok-grm__steps"
          aria-label="Grievance filing steps"
        >
          <el-step title="Personal" />
          <el-step title="Location" />
          <el-step title="Complaint" />
          <el-step title="Submit" />
        </el-steps>

        <el-form
          ref="dynamicFormRef"
          :model="grmForm"
          class="gok-grm__form"
          label-position="top"
          :rules="currentStepRules"
          size="default"
        >
          <el-row v-if="active === 0" :gutter="20">
            <el-col :xs="24" :md="12">
              <el-form-item id="btn1" label="Name of complainant(s)" prop="name">
                <el-input
                  v-model="grmForm.name"
                  type="textarea"
                  :rows="2"
                  placeholder="Full name(s). Use Anonymous if preferred"
                />
                <p class="gok-grm__hint">Separate multiple names with commas. Match National ID where possible.</p>
              </el-form-item>

              <el-form-item id="btn2" label="Gender" prop="gender">
                <el-select v-model="grmForm.gender" placeholder="Select" style="width: 100%">
                  <el-option label="Female" value="female" />
                  <el-option label="Male" value="male" />
                  <el-option label="Unspecified" value="unspecified" />
                </el-select>
              </el-form-item>

              <el-form-item id="btn3" label="Age" prop="age">
                <el-select v-model="grmForm.age" placeholder="Select" style="width: 100%">
                  <el-option
                    v-for="item in ageRanges"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-form-item id="btn4" label="National ID" prop="national_id">
                <el-input v-model="grmForm.national_id" placeholder="ID number" style="width: 100%" />
                <p class="gok-grm__hint">Required especially for land-related complaints.</p>
              </el-form-item>

              <el-form-item id="btn5" label="Phone" prop="phone">
                <el-input
                  v-model="grmForm.phone"
                  placeholder="254…"
                  style="width: 100%"
                  :onChange="convertPhoneNumber"
                />
                <p class="gok-grm__hint">Used for status updates on this complaint.</p>
              </el-form-item>

              <el-form-item id="btn6" label="Email" prop="email">
                <el-input v-model="grmForm.email" placeholder="Email address" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row v-if="active === 1" :gutter="20">
            <el-col :xs="24" :md="12">
              <el-form-item id="btn10" label="County" prop="county_id">
                <el-select
                  filterable
                  v-model="grmForm.county_id"
                  placeholder="County"
                  style="width: 100%"
                  @change="getSettlementByCounty"
                >
                  <el-option
                    v-for="item in countiesOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item id="btn10a" label="Project phase" prop="project_phase">
                <el-select
                  filterable
                  v-model="grmForm.project_phase"
                  placeholder="Select phase"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in projectPhaseOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item id="btn11" prop="settlement_id">
                <template #label>
                  Settlement
                  <span v-if="isFilteringSettlements" class="loading-dots" aria-live="polite" aria-busy="true">
                    <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                  </span>
                </template>
                <el-select
                  filterable
                  v-model="grmForm.settlement_id"
                  :placeholder="isFilteringSettlements ? 'Filtering…' : 'Settlement'"
                  :disabled="!grmForm.county_id || isFilteringSettlements"
                  :loading="isFilteringSettlements"
                  style="width: 100%"
                  @change="handleSelectSettlement"
                >
                  <el-option
                    v-for="item in settlementOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-form-item id="btn12" label="Physical address" prop="address">
                <el-input v-model="grmForm.address" placeholder="Landmark or plot reference" style="width: 100%" />
              </el-form-item>

              <el-form-item id="btn7a" label="Date reported" prop="date_reported">
                <el-date-picker
                  v-model="grmForm.date_reported"
                  type="date"
                  placeholder="Select date"
                  style="width: 100%"
                  format="YYYY-MM-DD"
                  :disabled-date="disableFutureDates"
                />
              </el-form-item>

              <el-form-item id="btn13" label="Complaint flags">
                <div class="gok-grm__flags">
                  <el-checkbox v-model="grmForm.isgbv" label="Related to gender-based violence" />
                  <el-checkbox v-model="grmForm.isInCourt" label="Currently in court" />
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row v-if="active === 2" :gutter="20">
            <el-col :xs="24" :md="12">
              <el-form-item v-if="!grmForm.isgbv" id="btn14" label="Nature of complaint" prop="nature">
                <el-select filterable v-model="grmForm.nature" placeholder="Select category" style="width: 100%">
                  <el-option
                    v-for="item in grievanceOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item id="btn15" label="Complaint description" prop="description">
                <el-input
                  v-model="grmForm.description"
                  type="textarea"
                  :rows="4"
                  placeholder="What happened, when, where, and who was involved"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item id="btn16" label="Plea / request" prop="plea">
                <el-input
                  v-model="grmForm.plea"
                  type="textarea"
                  :rows="4"
                  placeholder="What action would you like taken?"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row v-if="active === 3" :gutter="20">
            <el-col :xs="24" :md="12">
              <el-form-item id="btn17" label="Witness name (optional)" prop="witness">
                <el-input v-model="grmForm.witness" placeholder="Witness name" style="width: 100%" />
              </el-form-item>

              <el-form-item id="btn18" label="Witness phone (optional)" prop="witness_phone">
                <el-input v-model="grmForm.witness_phone" placeholder="Witness phone" style="width: 100%" />
              </el-form-item>

              <el-form-item id="btn19" label="Witness statement (optional)" prop="witness_statement">
                <el-input
                  v-model="grmForm.witness_statement"
                  type="textarea"
                  :rows="3"
                  placeholder="Witness statement"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :md="12">
              <el-form-item id="btn21" label="Are you the complainant?">
                <el-switch
                  v-model="grmForm.self_reported"
                  inline-prompt
                  style="--el-switch-on-color: #00843d; --el-switch-off-color: #bb0000"
                  active-text="Yes"
                  inactive-text="No"
                />
                <p class="gok-grm__hint">Turn off if filing on someone else’s behalf.</p>
              </el-form-item>

              <el-form-item v-if="!grmForm.self_reported" id="btn22" label="Your name" prop="reporter_name">
                <el-input v-model="grmForm.reporter_name" placeholder="Your name" style="width: 100%" />
              </el-form-item>

              <el-form-item v-if="!grmForm.self_reported" id="btn23" label="Your phone" prop="reporter_phone">
                <el-input v-model="grmForm.reporter_phone" placeholder="Your phone" style="width: 100%" />
              </el-form-item>

              <el-form-item label="Supporting documents (optional)">
                <el-upload
                  id="btn20"
                  class="gok-grm__upload"
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
                  <button type="button" class="gok-grm__upload-btn">Upload files</button>
                  <template #tip>
                    <p class="gok-grm__hint">PDF, JPG or PNG · max 500KB each · up to 3 files</p>
                  </template>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>

          <div class="gok-grm__nav">
            <div class="gok-grm__nav-left">
              <el-tooltip content="Guided help" placement="top">
                <button type="button" class="gok-grm__btn gok-grm__btn--ghost" @click="showTour">
                  <el-icon><InfoFilled /></el-icon>
                  Help
                </button>
              </el-tooltip>
              <button
                v-if="active > 0"
                id="btn9"
                type="button"
                class="gok-grm__btn gok-grm__btn--ghost"
                @click="prev"
              >
                <el-icon><ArrowLeft /></el-icon>
                Previous
              </button>
            </div>
            <div class="gok-grm__nav-right">
              <button id="btn8" type="button" class="gok-grm__btn gok-grm__btn--ghost" @click="resetForm">
                Reset
              </button>
              <button
                v-if="active < 3"
                id="btn7"
                type="button"
                class="gok-grm__btn gok-grm__btn--primary"
                @click="next"
              >
                Next
                <el-icon><ArrowRight /></el-icon>
              </button>
              <button
                v-if="active === 3"
                id="btn2"
                type="button"
                class="gok-grm__btn gok-grm__btn--primary"
                @click="submitForm"
              >
                Submit grievance
              </button>
            </div>
          </div>
        </el-form>
      </div>

      <el-tour
        v-model="isTourVisible"
        class="gok-grm-tour"
        :z-index="100000"
        :gap="{ offset: 10, radius: 8 }"
        :mask="{ color: 'rgba(18, 24, 28, 0.55)' }"
        @close="endTour"
      >
        <el-tour-step
          v-for="(step, index) in filteredTourSteps"
          :key="index"
          :target="step.target"
          :title="step.title"
          :description="step.content"
          :next-button-props="{ children: index === filteredTourSteps.length - 1 ? 'Done' : 'Next' }"
          :prev-button-props="{ children: 'Back' }"
        />
      </el-tour>
    </div>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref,watch, computed, nextTick } from 'vue';
import {
  ElForm, ElFormItem, ElUpload, ElCheckbox, ElTour, ElTourStep, ElSwitch,
  ElSelect, ElOption, ElRow, ElCol, ElMessage, ElStep, ElSteps, ElIcon, ElTooltip, ElDatePicker,
} from 'element-plus';

import BaseLayout from './BaseLayout.vue';
import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import { uploadGrievanceDocuments, generateGrievance, logGrievanceAction, sendAcknowledgement } from '@/api/grievance'

import { useHead } from '@unhead/vue'

useHead({
  title: 'File a Grievance | KeSMIS Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'File a grievance related to KeSMIS intervention projects. Submit complaints, feedback, or concerns about informal settlement improvement programmes through our online grievance management system.' },
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
    { name: 'twitter:description', content: 'File a grievance related to KeSMIS intervention projects. Submit complaints, feedback, or concerns about informal settlement improvement programmes.' },
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
  date_reported: undefined,
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
    date_reported: [{ required: true, message: 'Date reported is required', trigger: 'change' }],
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
  // Add action field to avoid showing "None"
  const description = grievance.description || '';
  formData.action = description 
    ? `Grievance reported: ${description.length > 100 ? description.substring(0, 100) + '...' : description}` 
    : `New grievance registered with code ${grievance.code || ''}`

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





      // 2. Create log entry with proper action field
      let log = await logAction(res.data)

      // 3. Upload documents 
      await uploadFiles(log.id, res.data.id)

      // 4. Send Notification 
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
    // Reset date_reported to undefined after reset
    grmForm.value.date_reported = undefined;
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
  return tourSteps.value.filter((step) => {
    if (step.step !== active.value || !step.visible) return false
    if (
      grmForm.value.self_reported &&
      (step.target === '#btn22' || step.target === '#btn23')
    ) {
      return false
    }
    return true
  })
})

const endTour = () => {
  isTourVisible.value = false
}

const tourSteps = ref([
  {
    step: 0,
    target: '#btn1',
    title: 'Complainant name',
    content: 'Enter the full name as on the National ID, or Anonymous if preferred.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn2',
    title: 'Gender',
    content: 'Select the complainant’s gender.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn3',
    title: 'Age',
    content: 'Choose the age bracket that applies.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn4',
    title: 'National ID',
    content: 'Especially important for land-related complaints.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn5',
    title: 'Phone',
    content: 'We use this number for status updates on the complaint.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn6',
    title: 'Email',
    content: 'Optional. Used for updates if provided.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn7',
    title: 'Continue',
    content: 'Go to the location and project details step.',
    visible: true,
  },
  {
    step: 0,
    target: '#btn8',
    title: 'Reset',
    content: 'Clear the form and start again.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn10',
    title: 'County',
    content: 'Select the county where the issue occurred.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn10a',
    title: 'Project phase',
    content: 'Choose KISIP 1 or KISIP 2.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn11',
    title: 'Settlement',
    content: 'Pick the settlement within the selected county.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn12',
    title: 'Physical address',
    content: 'Add a landmark or plot reference if known.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn13',
    title: 'Complaint flags',
    content: 'Mark if this relates to GBV or is already in court.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn9',
    title: 'Previous',
    content: 'Return to personal details.',
    visible: true,
  },
  {
    step: 1,
    target: '#btn7',
    title: 'Continue',
    content: 'Go to the complaint description step.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn14',
    title: 'Nature of complaint',
    content: 'Select the category that best fits the issue.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn15',
    title: 'Description',
    content: 'Briefly explain what happened, when, where, and who was involved.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn16',
    title: 'Plea / request',
    content: 'State the action you would like taken.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn9',
    title: 'Previous',
    content: 'Return to location details.',
    visible: true,
  },
  {
    step: 2,
    target: '#btn7',
    title: 'Continue',
    content: 'Go to witness details and submission.',
    visible: true,
  },
  {
    step: 3,
    target: '#btn17',
    title: 'Witness name',
    content: 'Optional. Add a witness if available.',
    visible: true,
  },
  {
    step: 3,
    target: '#btn18',
    title: 'Witness phone',
    content: 'Optional contact number for the witness.',
    visible: true,
  },
  {
    step: 3,
    target: '#btn19',
    title: 'Witness statement',
    content: 'Optional notes from the witness.',
    visible: true,
  },
  {
    step: 3,
    target: '#btn21',
    title: 'Are you the complainant?',
    content: 'Turn off if you are filing on someone else’s behalf.',
    visible: true,
  },
  {
    step: 3,
    target: '#btn22',
    title: 'Your name',
    content: 'Required when filing for someone else.',
    visible: true,
  },
  {
    step: 3,
    target: '#btn23',
    title: 'Your phone',
    content: 'Required when filing for someone else.',
    visible: true,
  },
  {
    step: 3,
    target: '#btn20',
    title: 'Supporting documents',
    content: 'Optional PDF, JPG or PNG files (max 500KB each).',
    visible: true,
  },
  {
    step: 3,
    target: '#btn2',
    title: 'Submit',
    content: 'Send the grievance. You will receive a tracking code.',
    visible: true,
  },
  {
    step: 3,
    target: '#btn8',
    title: 'Reset',
    content: 'Clear all fields and start over.',
    visible: true,
  },
])

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
.gok-grm {
  padding: 2.5rem 0 3.5rem;
  background: var(--gok-grey, #f5f7f6);
  color: var(--gok-charcoal, #212121);
  font-family: var(--gok-font, 'Montserrat', sans-serif);
}

.gok-grm__shell {
  max-width: 56rem;
  margin: 0 auto;
  background: var(--gok-panel, #fff);
  border: 1px solid var(--gok-border, #e3e8e5);
  border-radius: 14px;
  box-shadow: var(--gok-shadow, 0 10px 28px rgba(0, 0, 0, 0.06));
  padding: 1.75rem 1.75rem 1.35rem;
}

.gok-grm__header {
  margin-bottom: 1.35rem;
}

.gok-grm__title {
  margin: 0 0 0.45rem;
  font-size: clamp(1.45rem, 2.5vw, 1.85rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--gok-charcoal, #212121);
}

.gok-grm__lead {
  margin: 0;
  max-width: 40rem;
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--gok-muted, #5f6368);
}

.gok-grm__steps {
  margin: 0 0 1.5rem;
  padding: 0.85rem 0.5rem 0.35rem;
  background: var(--gok-grey, #f5f7f6);
  border-radius: 10px;
  border: 1px solid var(--gok-border, #e3e8e5);
}

.gok-grm__form :deep(.el-form-item) {
  margin-bottom: 1.1rem;
}

.gok-grm__form :deep(.el-form-item__label) {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--gok-charcoal, #212121);
  margin-bottom: 0.35rem;
}

.gok-grm__hint {
  margin: 0.35rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--gok-muted, #5f6368);
}

.gok-grm__flags {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.75rem 0.9rem;
  background: var(--gok-grey, #f5f7f6);
  border: 1px solid var(--gok-border, #e3e8e5);
  border-radius: 8px;
}

.gok-grm__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1.15rem;
  border-top: 1px solid var(--gok-border, #e3e8e5);
}

.gok-grm__nav-left,
.gok-grm__nav-right {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.gok-grm__btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.65rem 1.05rem;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.gok-grm__btn--primary {
  background: var(--gok-green, #00843d);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 132, 61, 0.25);
}

.gok-grm__btn--primary:hover {
  background: var(--gok-green-dark, #006b32);
}

.gok-grm__btn--ghost {
  background: transparent;
  border-color: var(--gok-border, #e3e8e5);
  color: var(--gok-charcoal, #212121);
}

.gok-grm__btn--ghost:hover {
  border-color: var(--gok-green, #00843d);
  color: var(--gok-green, #00843d);
  background: var(--gok-green-soft, #e8f5ee);
}

.gok-grm__upload-btn {
  appearance: none;
  border: 1px dashed color-mix(in srgb, var(--gok-green, #00843d) 45%, var(--gok-border));
  background: var(--gok-green-soft, #e8f5ee);
  color: var(--gok-green, #00843d);
  border-radius: 8px;
  padding: 0.65rem 1rem;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}

.gok-grm__upload-btn:hover {
  border-style: solid;
  border-color: var(--gok-green, #00843d);
}

/* Element Plus field chrome */
.gok-grm :deep(.el-input__wrapper),
.gok-grm :deep(.el-textarea__inner),
.gok-grm :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: none;
  background: var(--gok-panel, #fff);
}

.gok-grm :deep(.el-input__wrapper) {
  border: 1px solid var(--gok-border, #e3e8e5);
}

.gok-grm :deep(.el-input__wrapper:hover),
.gok-grm :deep(.el-textarea__inner:hover) {
  border-color: var(--gok-green, #00843d);
}

.gok-grm :deep(.el-input__wrapper.is-focus),
.gok-grm :deep(.el-textarea__inner:focus) {
  border-color: var(--gok-green, #00843d);
  box-shadow: 0 0 0 2px rgba(0, 132, 61, 0.15);
}

.gok-grm :deep(.el-textarea__inner) {
  border: 1px solid var(--gok-border, #e3e8e5);
  font-family: inherit;
}

.gok-grm :deep(.el-step__title) {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--gok-muted, #5f6368);
}

.gok-grm :deep(.el-step__title.is-process),
.gok-grm :deep(.el-step__title.is-finish) {
  color: var(--gok-green, #00843d);
}

.gok-grm :deep(.el-step__head.is-process),
.gok-grm :deep(.el-step__head.is-finish) {
  color: var(--gok-green, #00843d);
  border-color: var(--gok-green, #00843d);
}

.gok-grm :deep(.el-step__head.is-process .el-step__icon),
.gok-grm :deep(.el-step__head.is-finish .el-step__icon) {
  background: var(--gok-green, #00843d);
  border-color: var(--gok-green, #00843d);
  color: #fff;
}

.gok-grm :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: var(--gok-green, #00843d);
  border-color: var(--gok-green, #00843d);
}

.gok-grm :deep(.el-checkbox__label) {
  color: var(--gok-charcoal, #212121);
  font-weight: 500;
  white-space: normal;
}

.loading-dots {
  display: inline-flex;
  gap: 1px;
  margin-left: 0.35rem;
  color: var(--gok-green, #00843d);
}

.loading-dots .dot {
  animation: gok-grm-blink 1.2s infinite both;
}

.loading-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes gok-grm-blink {
  0%, 80%, 100% { opacity: 0.2; }
  40% { opacity: 1; }
}

@media (max-width: 768px) {
  .gok-grm {
    padding: 1.25rem 0 2rem;
  }

  .gok-grm__shell {
    border-radius: 12px;
    padding: 1.2rem 1.1rem 1.1rem;
  }

  .gok-grm__nav {
    flex-direction: column;
    align-items: stretch;
  }

  .gok-grm__nav-left,
  .gok-grm__nav-right {
    width: 100%;
  }

  .gok-grm__nav-right {
    justify-content: stretch;
  }

  .gok-grm__btn {
    flex: 1;
    justify-content: center;
  }

  .gok-grm :deep(.el-step__title) {
    font-size: 0.7rem;
  }
}
</style>

<!-- Tour teleports to body — must be unscoped -->
<style>
.gok-grm-tour {
  --el-color-primary: #00843d;
  --el-color-primary-light-3: #2f9a5c;
  --el-color-primary-light-5: #66b58b;
  --el-color-primary-light-7: #99cfb3;
  --el-color-primary-light-9: #e8f5ee;
  --el-color-primary-dark-2: #006b32;
  font-family: 'Montserrat', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

.gok-grm-tour .el-tour__content {
  border-radius: 12px !important;
  border: 1px solid #e3e8e5;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14) !important;
  padding: 1rem 1.1rem 1.05rem !important;
  max-width: min(22rem, calc(100vw - 2rem));
  background: #fff !important;
}

.gok-grm-tour .el-tour__title {
  font-size: 0.95rem !important;
  font-weight: 800 !important;
  letter-spacing: -0.02em;
  color: #212121 !important;
}

.gok-grm-tour .el-tour__body,
.gok-grm-tour .el-tour__description {
  font-size: 0.85rem !important;
  line-height: 1.5 !important;
  color: #5f6368 !important;
  font-weight: 500;
}

.gok-grm-tour .el-tour__closebtn .el-tour__close {
  color: #5f6368;
}

.gok-grm-tour .el-tour__closebtn:hover .el-tour__close {
  color: #00843d;
}

.gok-grm-tour .el-tour-indicators {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.gok-grm-tour .el-tour-indicator {
  width: 7px !important;
  height: 7px !important;
  border-radius: 999px !important;
  background: #d5dbd7 !important;
  margin-right: 0 !important;
}

.gok-grm-tour .el-tour-indicator.is-active {
  width: 18px !important;
  background: #00843d !important;
}

.gok-grm-tour .el-tour__footer .el-button {
  border-radius: 8px;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.85rem;
}

.gok-grm-tour .el-tour__footer .el-button--primary {
  background: #00843d !important;
  border-color: #00843d !important;
  color: #fff !important;
}

.gok-grm-tour .el-tour__footer .el-button--primary:hover {
  background: #006b32 !important;
  border-color: #006b32 !important;
}

.gok-grm-tour .el-tour__footer .el-button--default {
  border-color: #e3e8e5;
  color: #212121;
  background: #fff;
}

.gok-grm-tour .el-tour__footer .el-button--default:hover {
  border-color: #00843d;
  color: #00843d;
  background: #e8f5ee;
}

.gok-grm-tour .el-tour__arrow {
  background: #fff !important;
  border: 1px solid #e3e8e5;
}

.dark-mode .gok-grm-tour .el-tour__content {
  background: #1a2228 !important;
  border-color: #2c363c;
}

.dark-mode .gok-grm-tour .el-tour__title {
  color: #e8ecea !important;
}

.dark-mode .gok-grm-tour .el-tour__body,
.dark-mode .gok-grm-tour .el-tour__description {
  color: #a7b0ac !important;
}

.dark-mode .gok-grm-tour .el-tour__arrow {
  background: #1a2228 !important;
  border-color: #2c363c;
}

.dark-mode .gok-grm-tour .el-tour__footer .el-button--default {
  background: #1a2228;
  border-color: #2c363c;
  color: #e8ecea;
}
</style>
