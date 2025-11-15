<template>
  <BaseLayout>
    <div class="incident-container">
      <el-card>
        <el-tabs v-model="activeName" :tab-position="tabPosition">
          <!-- TAB 1: File Incident -->
          <el-tab-pane label="File an Incident" name="file">
            <section aria-label="Incident Reporting Process">
              <h1 class="visually-hidden">Report an Incident in Slums and Informal Settlements</h1>
              <el-steps v-if="!isMobile" :active="active" finish-status="success" :direction="isMobile ? 'vertical' : 'horizontal'" :simple="isMobile" aria-label="Incident reporting steps">
                <el-step title="Incident Details" />
                <el-step title="Incident Details(2)" />
                <el-step title="Investigation" />
                <el-step title="Investigation(2)" />
                <el-step title="Narrative" />
                <el-step title="Actions" />
                <el-step title="Prepared" />
              </el-steps>
            </section>

            <el-form
              :model="incidentForm"
              class="demo-form-inline"
              label-position="top"
              :rules="currentStepRules"
              ref="incidentFormRef"
            >
              <div class="form-content-scrollable">
                <el-card shadow="hover">

                <!-- Step 1: Incident Details (Part 1) -->
                <el-row v-if="active === 0" :gutter="10">
                  <el-col :xs="24" :sm="24" :md="12" :span="12">
                    <el-form-item label="Occurrence Date" prop="occurred_date">
                      <el-date-picker v-model="incidentForm.occurred_date" type="date" />
                    </el-form-item>
                    <el-form-item label="Occurrence Time" prop="occurred_time">
                      <el-time-picker v-model="incidentForm.occurred_time" />
                    </el-form-item>
                    <el-form-item label="County" prop="county_id">
                      <el-select filterable v-model="incidentForm.county_id" placeholder="Select County" @change="getSettlementByCounty" style="width:100%">
                        <el-option v-for="item in countiesOptions" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="Settlement" prop="settlement_id">
                      <el-select filterable v-model="incidentForm.settlement_id" placeholder="Select Settlement" @change="handleSelectSettlement" style="width:100%">
                        <el-option v-for="item in settlementOptions" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="Location" prop="location_text">
                      <el-input v-model="incidentForm.location_text" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :span="12">
                    
                
                    <el-form-item label="Reported By" prop="reported_by">
                      <el-input v-model="incidentForm.reported_by" />
                    </el-form-item>

         
                    <el-form-item label="Reporter role" prop="reporter_role">
                      <el-select v-model="incidentForm.reporter_role" placeholder="Select reporter role">
                        <el-option label="Consultant" value="Consultant" />
                        <el-option label="Contractor" value="Contractor" />
                        <el-option label="SEC" value="SEC" />
                        <el-option label="Victim/self" value="Victim/self" />
                        <el-option label="CPCT" value="CPCT" />
                        <el-option label="Member" value="Member" />
                        <el-option label="On behalf of victim" value="On behalf of victim" />
                      </el-select>
                    </el-form-item>

                    



                    <el-form-item label="Reporter Phone" prop="reporter_phone">
                      <el-input v-model="incidentForm.reporter_phone" placeholder="2547XXXXXXXX" />
                    </el-form-item>
                 
                  </el-col>
                </el-row>

                <!-- Step 2: Incident Details (Part 2) -->
                <el-row v-if="active === 1" :gutter="10">
                  <el-col :xs="24" :sm="24" :md="12" :span="12">
                    <el-form-item label="Worker Name" prop="worker_name">
                      <el-input v-model="incidentForm.worker_name" />
                    </el-form-item>
                    <el-form-item label="Designation" prop="designation">
                      <el-input v-model="incidentForm.designation" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :span="12">
                    <el-form-item label="Site Supervisor" prop="site_supervisor">
                      <el-input v-model="incidentForm.site_supervisor" />
                    </el-form-item>
                  </el-col>
                  <el-col :xs="24" :sm="24" :md="12" :span="12">

                  <el-form-item label="Department" prop="department">
                      <el-input v-model="incidentForm.department" />
                    </el-form-item>
                  </el-col>

                </el-row>

                <!-- Step 3: Categories -->
                <el-row v-if="active === 2" :gutter="20">
                  <!-- Incident Types Card -->
                  <el-col :span="24">
                    <el-card class="category-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <span>Incident Types</span>
                        </div>
                      </template>
                      <el-form-item prop="incident_types">
                        <el-checkbox-group v-model="incidentForm.incident_types">
                          <el-row :gutter="10">
                            <el-col v-for="i in incidentTypes" :key="i" :xs="24" :sm="12" :md="12" :span="12">
                              <el-checkbox :label="i" class="checkbox-item">{{ i }}</el-checkbox>
                            </el-col>
                          </el-row>
                        </el-checkbox-group>
                      </el-form-item>
                    </el-card>
                  </el-col>

                  <!-- Mechanism Causing Incident Card -->
                  <el-col :span="24">
                    <el-card class="category-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <span>Mechanism Causing Incident</span>
                        </div>
                      </template>
                      <el-form-item prop="mechanisms">
                        <el-checkbox-group v-model="incidentForm.mechanisms">
                          <el-row :gutter="10">
                            <el-col v-for="m in mechanisms" :key="m" :xs="24" :sm="12" :md="12" :span="12">
                              <el-checkbox :label="m" class="checkbox-item">{{ m }}</el-checkbox>
                            </el-col>
                          </el-row>
                        </el-checkbox-group>
                      </el-form-item>
                    </el-card>
                  </el-col>

                  <!-- Indirect Causesy Card -->
                  <el-col :span="24">
                    <el-card class="category-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <span>Indirect Causes</span>
                        </div>
                      </template>
                      <el-form-item prop="indirect_causes">
                        <el-checkbox-group v-model="incidentForm.indirect_causes">
                          <el-row :gutter="10">
                            <el-col v-for="p in indirectCauses" :key="p" :xs="24" :sm="12" :md="12" :span="12">
                              <el-checkbox :label="p" class="checkbox-item">{{ p }}</el-checkbox>
                            </el-col>
                          </el-row>
                        </el-checkbox-group>
                      </el-form-item>
                    </el-card>
                  </el-col>

                  <!-- Activity Leading to Incident Card -->
                  <el-col :span="24">
                    <el-card class="category-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <span>Activity Leading to Incident</span>
                        </div>
                      </template>
                      <el-form-item prop="activity_leading">
                        <el-checkbox-group v-model="incidentForm.activity_leading">
                          <el-row :gutter="10">
                            <el-col v-for="a in activities" :key="a" :xs="24" :sm="12" :md="12" :span="12">
                              <el-checkbox :label="a" class="checkbox-item">{{ a }}</el-checkbox>
                            </el-col>
                          </el-row>
                        </el-checkbox-group>
                      </el-form-item>
                    </el-card>
                  </el-col>
                </el-row>

                      <!-- Step 3: Categories 2 -->
            
                 <!-- Step 4: Categories 2 -->
                 <el-row v-if="active === 3" :gutter="20">
                   
 

                  <!-- Indirect Causes (Job) Card -->
                  <el-col :span="24">
                    <el-card class="category-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <span>Direct Causes </span>
                        </div>
                      </template>
                      <el-form-item prop="direct_causes">
                        <el-checkbox-group v-model="incidentForm.direct_causes">
                          <el-row :gutter="10">
                            <el-col v-for="j in directCauses" :key="j" :xs="24" :sm="12" :md="12" :span="12">
                              <el-checkbox :label="j" class="checkbox-item">{{ j }}</el-checkbox>
                            </el-col>
                          </el-row>
                        </el-checkbox-group>
                      </el-form-item>
                    </el-card>
                  </el-col>

                  <!-- Activity Leading to Incident Card -->
                  <el-col :span="24">
                    <el-card class="category-card" shadow="hover">
                      <template #header>
                        <div class="card-header">
                          <span>Root Cause</span>
                        </div>
                      </template>
                      <el-form-item prop="root_cause">
                        <el-checkbox-group v-model="incidentForm.root_cause">
                          <el-row :gutter="10">
                            <el-col v-for="a in rootCauses" :key="a" :xs="24" :sm="12" :md="12" :span="12">
                              <el-checkbox :label="a" class="checkbox-item">{{ a }}</el-checkbox>
                            </el-col>
                          </el-row>
                        </el-checkbox-group>
                      </el-form-item>
                    </el-card>
                  </el-col>
                </el-row>

                <!-- Step 4: Narrative -->
                <el-row v-if="active === 4" :gutter="10">
                  <el-col :span="24">
                    <el-form-item label="Description" prop="description">
                      <el-input type="textarea" :rows="3" v-model="incidentForm.description" />
                    </el-form-item>
                    <el-form-item label="Consequences" prop="consequences">
                      <el-input type="textarea" :rows="3" v-model="incidentForm.consequences" />
                    </el-form-item>
                    <el-form-item label="Immediate Action" prop="immediate_action">
                      <el-input type="textarea" :rows="3" v-model="incidentForm.immediate_action" />
                    </el-form-item>
                    <el-form-item label="Severity" prop="severity">
                      <el-select v-model="incidentForm.severity" placeholder="Select severity">
                        <el-option v-for="s in severityLevels" :key="s" :label="s" :value="s" />
                      </el-select>
                    </el-form-item>

                    <el-upload
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
                        <div class="el-upload__tip">pdf/jpg/png files with a size less than 10MB.</div>
                      </template>
                    </el-upload>
                  </el-col>
                </el-row>

                <!-- Step 5: Actions to Avoid -->
                <el-row v-if="active === 5" :gutter="10">
                  <el-col :span="24">
                    <div class="table-scroll">
                      <el-table :data="incidentForm.actions_to_avoid" style="width:100%" class="actions-table">
                      <el-table-column prop="action" label="Action" />
                      <el-table-column prop="responsible" label="Responsible" />
                      <el-table-column prop="priority" label="Priority" />
                      <el-table-column prop="due_date" label="Due Date" />
                      <el-table-column label="Operations">
                        <template #default="{ $index }">
                          <el-button type="danger" size="small" @click="removeAction($index)">Remove</el-button>
                        </template>
                      </el-table-column>
                      </el-table>
                    </div>
                    <el-button type="primary" @click="addActionRow">Add Action</el-button>
                  </el-col>
                </el-row>

                <!-- Step 6: Prepared By -->
                <el-row v-if="active === 6" :gutter="10">
                  <el-col :xs="24" :sm="24" :md="12" :span="12">
                    <el-form-item label="Prepared By" prop="prepared_by_name">
                      <el-input v-model="incidentForm.prepared_by_name" />
                    </el-form-item>
                    <el-form-item label="Job Title" prop="prepared_by_job_title">
                      <el-input v-model="incidentForm.prepared_by_job_title" />
                    </el-form-item>
                  </el-col>
                </el-row>
                </el-card>
              </div>
            </el-form>
          </el-tab-pane>
        </el-tabs>

        <!-- Footer navigation -->
        <template #footer>
          <div class="steps-navigation">
            <el-button v-if="active > 0" @click="prev" type="primary" class="nav-button">
              <i class="fas fa-chevron-left"></i> Previous
            </el-button>
            <el-button v-if="active < 6" type="primary" @click="next" class="nav-button">
              Next <i class="fas fa-chevron-right"></i>
            </el-button>
            <el-button v-if="active === 6" type="success" @click="submitForm" class="nav-button">
              <i class="fas fa-check"></i> Submit
            </el-button>
          </div>
        </template>
      </el-card>
    </div>

    <el-dialog v-model="showActionDialog" title="Add Action" :width="dialogWidth">
        <el-form :model="newAction" :rules="actionDialogRules" label-position="top" ref="dialogFormRef">
          <el-form-item label="Action" prop="action">
            <el-input v-model="newAction.action" />
          </el-form-item>
          <el-form-item label="Responsible" prop="responsible">
            <el-input v-model="newAction.responsible" />
          </el-form-item>
          <el-form-item label="Priority" prop="priority">
            <el-select v-model="newAction.priority" placeholder="Select priority">
              <el-option label="Yes" value="Yes" />
              <el-option label="No" value="No" />
            </el-select>
          </el-form-item>
          <el-form-item label="Due Date" prop="due_date">
            <el-date-picker v-model="newAction.due_date" type="date" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showActionDialog = false">Cancel</el-button>
          <el-button type="primary" @click="confirmAddAction">Add</el-button>
        </template>
      </el-dialog>


  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage,ElStep,ElSteps,ElTabPane,ElTabs,ElCheckboxGroup,ElCheckbox,ElDatePicker,ElCol,ElRow,ElDialog,
  ElTimePicker,ElInput,ElSelect,ElOption,ElTable,ElTableColumn,ElButton,ElCard,ElForm,ElFormItem, ElUpload } from 'element-plus'
import BaseLayout from './BaseLayout.vue'
import type { FormInstance } from 'element-plus'
 import { createIncident, uploadIncidentDocuments } from '@/api/incident'
import { getCountyAuth, getSettlementByCountyAuth } from '@/api/register'
import type { UploadUserFile } from 'element-plus'
import { uuid } from 'vue-uuid'

import { useHead } from '@unhead/vue'

useHead({
  title: 'Report an Incident | KeSMIS Kenya Slum Management Information System',
  meta: [
    { name: 'description', content: 'Report incidents in slums and informal settlements through KeSMIS. Submit safety concerns, infrastructure issues, or emergency situations in Kenya\'s informal settlements.' },
    { name: 'keywords', content: 'report incident, slum incidents, informal settlement reporting, Kenya safety concerns, infrastructure issues, emergency reporting, KISIP incidents' },
    { name: 'author', content: 'Kenya Informal Settlements Improvement Project (KISIP)' },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph tags (for WhatsApp, Facebook, LinkedIn)
    { property: 'og:title', content: 'Report an Incident - KeSMIS Kenya Slum Management Information System' },
    { property: 'og:description', content: 'Report incidents in slums and informal settlements through KeSMIS. Submit safety concerns, infrastructure issues, or emergency situations.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://kesmis.go.ke/incidents' },
    { property: 'og:image', content: 'https://kesmis.go.ke/warning.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    { property: 'og:site_name', content: 'KeSMIS' },
    { property: 'og:locale', content: 'en_KE' },
    
    // Twitter Card tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Report an Incident - KeSMIS Kenya Slum Management Information System' },
    { name: 'twitter:description', content: 'Report incidents in slums and informal settlements through KeSMIS. Submit safety concerns, infrastructure issues, or emergency situations.' },
    { name: 'twitter:image', content: 'https://kesmis.go.ke/warning.jpg' },
    { name: 'twitter:image:alt', content: 'KeSMIS Logo - Kenya Slum Management Information System' },
    
    // Additional meta tags for better SEO
    { name: 'theme-color', content: '#00DC82' },
    { name: 'msapplication-TileColor', content: '#00DC82' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    { name: 'format-detection', content: 'telephone=no' }
  ]
})
import { useRouter } from 'vue-router';

const router = useRouter();



// === Options from the PDF ===
const incidentTypes = [
  "Hazards","Environmental Impact","Near Miss","Occupational Personal Injury",
  "Non-Occupational Incident / Accident","Occupational Disease","Vehicle Incident/ Accident",
  "Fatality","Non worker incident (Traffic Accident Away)"
]

const mechanisms = [
"Loss of Containment",
  "Assault",
  "Radiation",
  "Fire/Explosion",
  "Unsafe Act",
  "Plant /Vehicle Operation",
  "Pollution /Environment",
  "Mechanical lifting",
  "Structural / Foundation",
  "Slip/ Trip/fall",
  "Lifting/ crane operation",
  "Waterborne",
  "Falling from height",
  "Manual handling",
  "Hazardous Substances exposure",
  "Falling/flying objects",
  "Using Machineries",
  "Driving",
  "Unsafe Condition",
  "Radiation",
  "Electrical",
  "Using Hand tools"
]

const indirectCauses  = [
"Inadequate Mental / Physical capacity",
  "Inadequate Design / Engineering",
  "Inadequate knowledge/skills",
  "Inadequate Procedures",
  "Stress",
  "Inadequate Tools / Equipment",
  "Inadequate Supervision",
  "Inadequate Instructions.",
  "Improper Motivation",
  "Inadequate Planning / Organization.",
  "Disregard of Instruction.",
  "Inadequate Supervision.",
  "Inadequate appreciation of situation",
  "Inadequate Training",
  "Fatigue / illness",
  "Inadequate Maintenance / Inspection",
  "Others (specify)",
  "Inadequate judgement involving KPLC wire)"
]
const directCauses  = [
"Failure in Communication",
  "Inadequate PPEs",
  "Failure to follow Rules/ Regulations",
  "Defective / damaged Tools and Equipment",
  "Failure to wear PPEs",
  "Inadequate CPEs",
  "Failure to wear RPEs",
  "Inadequate warning / Safety devices",
  "Improve manual handling",
  "Poor housekeeping",
  "Improve Vehicle Operation",
  "Inadequate/ miss use of Tools/ Equipment",
  "Failure to properly observe warnings",
  "Failure to properly observe Safety devices",
  "Wet / Uneven floor / Ground",
  "Misuse of Tool, Equipment and Plants",
  "Inadequate Access and Egress",
  "Others",
  "Accident involving the hanging kplc wire",
  "Weak old structures with shallow foundations"
]
 

const activities = [
"Using portable Tools/Equipment",
  "Grinding",
  "Breaking connection",
  "Operating Plant / Machineries",
  "Electrical work",
  "Manual lifting/handling",
  "Assembling /Dismantling",
  "Welding / Cutting with torch",
  "Movement of Equipment",
  "Handling hazardous substances",
  "Inspection, Examination, Radiography",
  "Others (refiling of water bowser)",
  "Climbing / Descending",
  "Cleaning",
  "Working / Walking on same level",
  "Painting",
  "Driving",
  "Digging",
  "Working at height (above 2 M)",
  "Draining/ flushing"
]

const rootCauses =[
"Management commitment",
  "Inspection / Audit",
  "Recruitment Procedures",
  "Training",
  "Planning",
  "Communication",
  "Design",
  "Standards",
  "Housekeeping",
  "Failure in organization",
  "Others (specify)"
]
const severityLevels = [
  "Minor","Major","Lost time injury","Fatality",
  "Restricted to work cases","Medical treatment cases","First Aid Case"
]

// === Form ===
interface IncidentForm {
  county_id: number | string
  subcounty_id?: number | string
  ward_id?: number | string
  settlement_id: number | string
  occurred_date: string
  occurred_time: string
  reported_date: string
  reported_time: string
  reported_by: string
  reporter_role: string
  reporter_phone: string
  site_supervisor: string
  department: string
  location_text: string
  worker_name: string
  designation: string
  incident_types: string[]
  mechanisms: string[]
  indirect_causes : string[]
  direct_causes: string[]
  activity_leading: string[]
  root_cause: string[]
  description: string
  consequences: string
  immediate_action: string
  severity: string
  actions_to_avoid: { action: string; responsible: string; priority: string; due_date: string }[]
  prepared_by_name: string
  prepared_by_job_title: string
  prepared_by_date: string | null
}

const incidentForm = ref<IncidentForm>({
  county_id: '',
  subcounty_id: '',
  ward_id: '',
  settlement_id: '',
  occurred_date: '',
  occurred_time: '',
  reported_date: '',
  reported_time: '',
  reported_by: "",
  reporter_role: "",
  reporter_phone: "",
  site_supervisor: "",
  department: "",
  location_text: "",
  worker_name: "",
  designation: "",
  incident_types: [],
  mechanisms: [],
  indirect_causes: [],
  direct_causes: [],
  root_cause: [],
  activity_leading: [],
  description: "",
  consequences: "",
  immediate_action: "",
  severity: "",
  actions_to_avoid: [],
  prepared_by_name: "",
  prepared_by_job_title: "",
  prepared_by_date: null
})

const activeName = ref('file')
const active = ref(0)
const tabPosition = ref<'top' | 'left' | 'right' | 'bottom'>('top')
const incidentFormRef = ref<FormInstance>()

// Responsive helpers
const isMobile = ref(false)
const dialogWidth = computed(() => (isMobile.value ? '95%' : '500px'))
if (typeof window !== 'undefined') {
  const setIsMobile = () => { isMobile.value = window.innerWidth < 768 }
  setIsMobile()
  window.addEventListener('resize', setIsMobile)
}
 
// === Validation Rules for Main Form ===
const validationRules = {
  step0: {
    occurred_date: [{ required: true, message: 'Occurred Date is required', trigger: 'change' }],
    occurred_time: [{ required: true, message: 'Occurred Time is required', trigger: 'change' }],
    location_text: [{ required: true, message: 'Location is required', trigger: 'blur' }],
    reported_by: [{ required: true, message: 'Reported By is required', trigger: 'blur' }],
    reporter_role: [{ required: true, message: 'Your Role is required', trigger: 'blur' }],

    

    reporter_phone: [{ required: true, message: 'Reporter Phone is required', trigger: 'blur' }],
    county_id: [{ required: true, message: 'County is required', trigger: 'change' }],
    settlement_id: [{ required: true, message: 'Settlement is required', trigger: 'change' }]
  },
  step1: {
    worker_name: [{ required: true, message: 'Worker Name is required', trigger: 'blur' }],
    designation: [{ required: true, message: 'Designation is required', trigger: 'blur' }],
    site_supervisor: [{ required: true, message: 'Site Supervisor is required', trigger: 'blur' }],
    department: [{ required: true, message: 'Department is required', trigger: 'blur' }],

  },
  step2: {
    incident_types: [{ required: true, message: 'Select at least 1 Incident Type', trigger: 'change' }],
    mechanisms: [{ required: true, message: 'Select at least 1 Mechanism', trigger: 'change' }],
    indirect_causes: [{ required: true, message: 'Select at least 1 Indirect Cause', trigger: 'change' }],
    activity_leading: [{ required: true, message: 'Select at least 1 Activity', trigger: 'change' }]
  },
  step3: {
    direct_causes: [{ required: true, message: 'Select at least 1 Direct Cause', trigger: 'change' }],
    root_cause: [{ required: true, message: 'Select at least 1 Root Cause', trigger: 'change' }]
  },
  step4: {
    description: [{ required: true, message: 'Description is required', trigger: 'blur' }],
    consequences: [{ required: true, message: 'Consequences are required', trigger: 'blur' }],
    immediate_action: [{ required: true, message: 'Immediate Action is required', trigger: 'blur' }],
    severity: [{ required: true, message: 'Severity is required', trigger: 'change' }]
  },
  step5: {
    actions_to_avoid: [{ required: true, message: 'Add at least one Action to Avoid', trigger: 'change' }]
  },
  step6: {
    prepared_by_name: [{ required: true, message: 'Prepared By is required', trigger: 'blur' }],
    prepared_by_job_title: [{ required: true, message: 'Job Title is required', trigger: 'blur' }]
  }
}

const currentStepRules = computed(() => validationRules[`step${active.value}`] || {})

// === County/Settlement options and logic (reuse from grievance) ===
interface CountyOption { value: number; label: string }
interface SettlementOption { value: number; label: string; county_id: number; subcounty_id: number; ward_id: number }

const countiesOptions = ref<CountyOption[]>([])
const settlementOptions = ref<SettlementOption[]>([])

const getCounties = async () => {
  const formData: any = { model: 'county' }
  await getCountyAuth(formData as any).then((response: any) => {
    const cnty = response.data
    countiesOptions.value = cnty.map((c: any) => ({ value: c.id, label: c.name }))
    countiesOptions.value.sort((a, b) => a.value - b.value)
  })
}
getCounties()

const getSettlementByCounty = async (selectCounty: number) => {
  settlementOptions.value = []
  incidentForm.value.settlement_id = ''
  await getSettlementByCountyAuth({ county_id: selectCounty } as any).then((response: any) => {
    const opt = response.data
    settlementOptions.value = opt.map((s: any) => ({
      value: s.id,
      label: s.name,
      county_id: s.county_id,
      subcounty_id: s.subcounty_id,
      ward_id: s.ward_id
    }))
    settlementOptions.value.sort((a, b) => a.value - b.value)
  })
}

const handleSelectSettlement = (settlementId: number) => {
  const found = settlementOptions.value.find((o) => o.value === settlementId)
  if (!found) return
  incidentForm.value.subcounty_id = found.subcounty_id
  incidentForm.value.ward_id = found.ward_id
  incidentForm.value.county_id = found.county_id
}

// Normalize reporter phone similar to grievance form
watch(
  () => incidentForm.value.reporter_phone,
  (newVal) => {
    if (!newVal) return
    let sanitizedNumber = newVal.replace(/[^0-9]/g, '')
    if (sanitizedNumber.startsWith('0')) {
      sanitizedNumber = sanitizedNumber.substring(1)
    }
    if (!sanitizedNumber.startsWith('254')) {
      sanitizedNumber = `254${sanitizedNumber}`
    }
    incidentForm.value.reporter_phone = sanitizedNumber.substring(0, 12)
  }
)

// === Upload (similar to grievances) ===
const fileList = ref<UploadUserFile[]>([])
const handlePreview = (file: any) => {
  console.log('Preview:', file)
}
const handleRemove = (file: any, list: any) => {
  console.log('Remove:', file, list)
}
const beforeRemove = () => {
  return true
}
const handleExceed = () => {
  ElMessage.warning('You can only upload up to 3 files.')
}

const uploadFiles = async (incident_id: number | string) => {
  const formData = new FormData()
  for (let i = 0; i < fileList.value.length; i++) {
    formData.append('files', (fileList.value[i] as any).raw)
    formData.append('format', fileList.value[i].name.split('.').pop() as string)
    formData.append('incident_id', String(incident_id))
    formData.append('type', 'Supporting Documentation')
    formData.append('protected_file', 'true')
    const sizeMb = ((fileList.value[i] as any).raw.size / 1024 / 1024).toFixed(2)
    formData.append('size', sizeMb)
    formData.append('code', uuid.v4())
  }
  const uploadRes = await uploadIncidentDocuments(formData)
  console.log('Documents Uploaded', uploadRes)
}
 
const next = async () => {
  try {
    await incidentFormRef.value?.validate()
    active.value++
  } catch {
    ElMessage.error('Please fill required fields')
  }
}
const prev = () => active.value--

const submitForm = async () => {
  try {
    await incidentFormRef.value?.validate()
  } catch (e) {
    ElMessage.error('Please fill required fields')
    return
  }

  try {
    // system-generate reported date/time
    incidentForm.value.reported_date = new Date().toISOString().split("T")[0]
    incidentForm.value.reported_time = new Date().toLocaleTimeString()
    // system-generate prepared date
    incidentForm.value.prepared_by_date = new Date().toISOString().split("T")[0]

    // Create incident
    const res = await createIncident(incidentForm.value)
    console.log('res', res)
    router.push('/landing');
    // Upload documents if any
    try {
      if (fileList.value && fileList.value.length > 0 && res?.data?.id) {
        await uploadFiles(res.data.id)
      }
    } catch (uploadErr) {
      console.error('Upload failed', uploadErr)
      ElMessage.error('Incident created, but uploading documents failed')
      return
    }

    ElMessage.success('Incident submitted successfully')
  } catch (err) {
    console.error('Submit failed', err)
    ElMessage.error('Failed to submit incident')
  }

  console.log("Submitting Incident:", incidentForm.value)
}
// === Action Dialog ===
const showActionDialog = ref(false)

const addActionRow = () => {
  showActionDialog.value = true
 // incidentForm.value.actions_to_avoid.push({ action: "", responsible: "", priority: "", due_date: "" })
}


const newAction = ref({ action: "", responsible: "", priority: "", due_date: "" })
const dialogFormRef = ref<FormInstance>()
const actionDialogRules = {
  action: [{ required: true, message: 'Action is required', trigger: 'blur' }],
  responsible: [{ required: true, message: 'Responsible is required', trigger: 'blur' }],
  priority: [{ required: true, message: 'Priority is required', trigger: 'change' }],
  due_date: [{ required: true, message: 'Due Date is required', trigger: 'change' }]
}

const confirmAddAction = async () => {
  try {
    await dialogFormRef.value?.validate()
  } catch (e) {
    ElMessage.error("Please fill all required fields")
    return
  }
  incidentForm.value.actions_to_avoid.push({ ...newAction.value })
  newAction.value = { action: "", responsible: "", priority: "", due_date: "" }
  showActionDialog.value = false
}

const removeAction = (index: number) => {
  incidentForm.value.actions_to_avoid.splice(index, 1)
}


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

.incident-container {
  padding: 4rem 2rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background 0.3s ease, color 0.3s ease;
  min-height: 100vh;
}

:deep(.el-card) {
  max-width: 1280px;
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

:deep(.el-card__body) {
  padding: 2.5rem;
}

@media (max-width: 768px) {
  .incident-container {
    padding: 2rem 1rem;
  }
  
  :deep(.el-card__body) {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .incident-container {
    padding: 1.5rem 1rem;
  }
  
  :deep(.el-card__body) {
    padding: 1rem;
  }
}

/* Steps Component */
:deep(.el-steps) {
  margin-bottom: 2.5rem;
  padding: 2rem 1.5rem;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
}

:deep(.el-step__title) {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
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
:deep(.el-form-item) {
  margin-bottom: 1.5rem;
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

/* Date/Time Picker Styling */
:deep(.el-date-editor .el-input__wrapper),
:deep(.el-time-picker .el-input__wrapper) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

:deep(.el-date-editor .el-input__wrapper:hover),
:deep(.el-time-picker .el-input__wrapper:hover) {
  border-color: #00DC82;
}

:deep(.el-date-editor .el-input__wrapper.is-focus),
:deep(.el-time-picker .el-input__wrapper.is-focus) {
  border-color: #00DC82;
  box-shadow: 0 0 0 2px rgba(0, 220, 130, 0.2);
}

:deep(.el-picker-panel) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

/* Button Styling */
:deep(.el-button) {
  padding: 0.875rem 1.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  letter-spacing: -0.01em;
  border: none;
}

:deep(.el-button--primary) {
  background: #00DC82 !important;
  border: 1px solid #00DC82 !important;
  color: white !important;
}

:deep(.el-button--primary:hover) {
  background: #00B86B !important;
  border-color: #00B86B !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 220, 130, 0.3);
}

:deep(.el-button--success) {
  background: #00DC82 !important;
  border: 1px solid #00DC82 !important;
  color: white !important;
}

:deep(.el-button--success:hover) {
  background: #00B86B !important;
  border-color: #00B86B !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 220, 130, 0.3);
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

/* Table Styling */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header) {
  background: var(--bg-secondary);
}

:deep(.el-table th) {
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
}

:deep(.el-table td) {
  color: var(--text-primary);
}

:deep(.el-table--border) {
  border: 1px solid var(--border-color);
}

:deep(.el-table--border th),
:deep(.el-table--border td) {
  border-right: 1px solid var(--border-color);
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

.steps-navigation { 
  margin-top: 2.5rem; 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.5rem;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-color);
}

.nav-button {
  flex: 1;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
}

.nav-button i {
  font-size: 0.875rem;
}

/* Scrollable form content */
.form-content-scrollable {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

/* Custom scrollbar styling */
.form-content-scrollable::-webkit-scrollbar {
  width: 6px;
}

.form-content-scrollable::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 3px;
}

.form-content-scrollable::-webkit-scrollbar-thumb {
  background: rgba(0, 220, 130, 0.3);
  border-radius: 3px;
}

.form-content-scrollable::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 220, 130, 0.5);
}

/* Category Cards Styling */
.category-card {
  margin-bottom: 2rem;
  height: fit-content;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.3s ease;
}

.category-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  padding: 0;
}

.step-header {
  margin-bottom: 20px;
  text-align: center;
}

.step-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.step-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.checkbox-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  margin-right: 0;
}

.checkbox-item .el-checkbox {
  display: flex;
  align-items: flex-start;
}

.checkbox-item .el-checkbox__input {
  margin-top: 0.125rem;
  flex-shrink: 0;
}

.checkbox-item .el-checkbox__label {
  font-size: 0.9375rem;
  line-height: 1.6;
  padding-left: 0.5rem;
  white-space: normal;
  word-break: break-word;
  color: var(--text-primary);
  font-weight: 500;
}

/* Dark Mode Support */
.dark-mode .incident-container {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.dark-mode :deep(.el-card) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-steps) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-tabs__header) {
  border-color: var(--border-color);
}

.dark-mode :deep(.el-tabs__item) {
  color: var(--text-secondary);
}

.dark-mode :deep(.el-tabs__item.is-active) {
  color: #00DC82;
}

.dark-mode :deep(.el-tabs__active-bar) {
  background-color: #00DC82;
}

.dark-mode .category-card {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode .card-header {
  color: var(--text-primary);
}

.dark-mode .steps-navigation {
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

.dark-mode :deep(.el-select .el-input__wrapper),
.dark-mode :deep(.el-date-editor .el-input__wrapper),
.dark-mode :deep(.el-time-picker .el-input__wrapper) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-select-dropdown),
.dark-mode :deep(.el-picker-panel) {
  background: var(--bg-primary);
  border-color: var(--border-color);
}

.dark-mode :deep(.el-table__header) {
  background: var(--bg-secondary);
}

.dark-mode :deep(.el-table th),
.dark-mode :deep(.el-table td) {
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

@media (max-width: 768px) {
  .steps-navigation {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .nav-button {
    flex: 1;
    width: 100%;
    margin: 0;
    min-width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  :deep(.el-steps) {
    padding: 1.5rem 1rem;
  }

  :deep(.el-step__title) {
    font-size: 0.875rem;
  }

  :deep(.el-tabs__item) {
    font-size: 0.875rem;
    padding: 0 1rem;
  }

  .category-card {
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .steps-navigation {
    padding: 1rem 0.75rem;
  }

  :deep(.el-steps) {
    padding: 1rem 0.75rem;
  }

  :deep(.el-step__title) {
    font-size: 0.8125rem;
  }

  :deep(.el-tabs__item) {
    font-size: 0.8125rem;
    padding: 0 0.75rem;
  }
}

/* Horizontal scroll for mobile tables */
.table-scroll {
  width: 100%;
  overflow-x: auto;
}

.actions-table {
  min-width: 700px;
}
</style>
